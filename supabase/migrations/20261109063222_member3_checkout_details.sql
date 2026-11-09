-- Depends on Member 4's add_revenue_pricing migration. No pricing rules are redefined.
alter table public.orders alter column buyer_id drop not null;
create table public.order_checkout_details (
  order_id uuid primary key references public.orders(id) on delete cascade,
  full_name text not null check (length(trim(full_name)) between 2 and 120),
  email text not null check (length(email) between 3 and 254),
  phone text not null check (length(trim(phone)) between 7 and 30),
  address text not null check (length(trim(address)) between 10 and 500),
  payment_method text not null check (payment_method in ('simulated_card', 'simulated_gcash')),
  guest_token_hash text check (guest_token_hash is null or guest_token_hash ~ '^[a-f0-9]{64}$')
);
alter table public.order_checkout_details enable row level security;
revoke all on public.order_checkout_details from public, anon, authenticated;
grant select, insert on public.order_checkout_details to service_role;

-- Extend only Member 4's buyer-existence guard for GC2 guests; pricing validation is unchanged.
create or replace function public.place_catalog_order(
  p_product_id uuid,
  p_buyer_id uuid,
  p_quantity integer,
  p_verification_option public.verification_option,
  p_expected_unit_price numeric,
  p_subtotal_amount numeric,
  p_verification_fee numeric,
  p_commission_rate_bps integer,
  p_commission_amount numeric,
  p_seller_payout_amount numeric,
  p_platform_revenue_amount numeric,
  p_total_amount numeric
)
returns public.orders
language plpgsql
security invoker
set search_path = public
as $$
declare
  listing public.products%rowtype;
  new_order public.orders%rowtype;
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'INVALID_QUANTITY';
  end if;

  select *
  into listing
  from public.products
  where id = p_product_id
  for update;

  if not found then
    raise exception 'LISTING_NOT_FOUND';
  end if;

  if listing.seller_id = p_buyer_id then
    raise exception 'CANNOT_PURCHASE_OWN_LISTING';
  end if;

  if p_buyer_id is not null and not exists (select 1 from public.users where id = p_buyer_id) then
    raise exception 'BUYER_NOT_FOUND';
  end if;

  if listing.status <> 'available' or listing.stock <= 0 then
    raise exception 'SLOT_TAKEN';
  end if;

  if p_quantity > listing.stock then
    raise exception 'INSUFFICIENT_STOCK';
  end if;

  if p_expected_unit_price is distinct from listing.price then
    raise exception 'PRICE_CHANGED';
  end if;

  if
    p_verification_option is null
    or p_subtotal_amount is null
    or p_verification_fee is null
    or p_commission_rate_bps is null
    or p_commission_amount is null
    or p_seller_payout_amount is null
    or p_platform_revenue_amount is null
    or p_total_amount is null
    or p_verification_fee < 0
    or p_commission_rate_bps not between 0 and 10000
    or p_subtotal_amount is distinct from round(listing.price * p_quantity, 2)
    or p_commission_amount is distinct from round(
      p_subtotal_amount * p_commission_rate_bps / 10000,
      2
    )
    or p_seller_payout_amount is distinct from
      p_subtotal_amount - p_commission_amount
    or p_platform_revenue_amount is distinct from
      p_commission_amount + p_verification_fee
    or p_total_amount is distinct from
      p_subtotal_amount + p_verification_fee
  then
    raise exception 'INVALID_PRICING_SNAPSHOT';
  end if;

  insert into public.orders (
    product_id,
    buyer_id,
    quantity,
    unit_price,
    subtotal_amount,
    verification_option,
    verification_fee,
    commission_rate_bps,
    commission_amount,
    seller_payout_amount,
    platform_revenue_amount,
    total_amount,
    escrow_status,
    tracking_number
  )
  values (
    p_product_id,
    p_buyer_id,
    p_quantity,
    listing.price,
    p_subtotal_amount,
    p_verification_option,
    p_verification_fee,
    p_commission_rate_bps,
    p_commission_amount,
    p_seller_payout_amount,
    p_platform_revenue_amount,
    p_total_amount,
    'pending',
    null
  )
  returning * into new_order;

  update public.products
  set
    stock = listing.stock - p_quantity,
    status = case
      when listing.stock - p_quantity <= 0
        then 'sold'::public.product_status
      else listing.status
    end
  where id = p_product_id;

  return new_order;
end;
$$;

revoke all on function public.place_catalog_order(
  uuid,
  uuid,
  integer,
  public.verification_option,
  numeric,
  numeric,
  numeric,
  integer,
  numeric,
  numeric,
  numeric,
  numeric
) from public;

revoke all on function public.place_catalog_order(
  uuid,
  uuid,
  integer,
  public.verification_option,
  numeric,
  numeric,
  numeric,
  integer,
  numeric,
  numeric,
  numeric,
  numeric
) from anon;

revoke all on function public.place_catalog_order(
  uuid,
  uuid,
  integer,
  public.verification_option,
  numeric,
  numeric,
  numeric,
  integer,
  numeric,
  numeric,
  numeric,
  numeric
) from authenticated;

grant execute on function public.place_catalog_order(
  uuid,
  uuid,
  integer,
  public.verification_option,
  numeric,
  numeric,
  numeric,
  integer,
  numeric,
  numeric,
  numeric,
  numeric
) to service_role;

create function public.place_checkout_order(p_product_id uuid, p_buyer_id uuid, p_quantity integer,
  p_verification_option public.verification_option, p_expected_unit_price numeric,
  p_subtotal_amount numeric, p_verification_fee numeric, p_commission_rate_bps integer,
  p_commission_amount numeric, p_seller_payout_amount numeric,
  p_platform_revenue_amount numeric, p_total_amount numeric,
  p_full_name text, p_email text, p_phone text, p_address text,
  p_payment_method text, p_guest_token_hash text)
returns public.orders language plpgsql security invoker set search_path = ''
as $$
declare saved public.orders%rowtype;
begin
  if (p_buyer_id is null) <> (p_guest_token_hash is not null) then
    raise exception 'INVALID_GUEST_ACCESS';
  end if;
  saved := public.place_catalog_order(
    p_product_id, p_buyer_id, p_quantity, p_verification_option, p_expected_unit_price,
    p_subtotal_amount, p_verification_fee, p_commission_rate_bps, p_commission_amount,
    p_seller_payout_amount, p_platform_revenue_amount, p_total_amount
  );
  insert into public.order_checkout_details(order_id, full_name, email, phone, address, payment_method, guest_token_hash)
  values(saved.id, p_full_name, p_email, p_phone, p_address, p_payment_method, p_guest_token_hash);
  return saved;
end; $$;
revoke all on function public.place_checkout_order(uuid, uuid, integer, public.verification_option, numeric, numeric, numeric, integer, numeric, numeric, numeric, numeric, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.place_checkout_order(uuid, uuid, integer, public.verification_option, numeric, numeric, numeric, integer, numeric, numeric, numeric, numeric, text, text, text, text, text, text) to service_role;
