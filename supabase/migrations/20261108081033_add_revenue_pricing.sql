do $$
begin
  create type public.verification_option as enum (
    'none',
    'remote',
    'physical'
  );
exception
  when duplicate_object then null;
end
$$;

alter table public.orders
  add column if not exists unit_price numeric(12, 2),
  add column if not exists subtotal_amount numeric(12, 2),
  add column if not exists verification_option public.verification_option,
  add column if not exists verification_fee numeric(12, 2),
  add column if not exists commission_rate_bps integer,
  add column if not exists commission_amount numeric(12, 2),
  add column if not exists seller_payout_amount numeric(12, 2),
  add column if not exists platform_revenue_amount numeric(12, 2);

-- Existing orders predate the revenue rules. Preserve their saved total as a
-- zero-commission snapshot instead of rewriting history as if a fee was paid.
update public.orders
set
  unit_price = round(total_amount / nullif(quantity, 0), 2),
  subtotal_amount = total_amount,
  verification_option = 'none',
  verification_fee = 0,
  commission_rate_bps = 0,
  commission_amount = 0,
  seller_payout_amount = total_amount,
  platform_revenue_amount = 0
where unit_price is null;

alter table public.orders
  alter column unit_price set not null,
  alter column subtotal_amount set not null,
  alter column verification_option set not null,
  alter column verification_fee set not null,
  alter column commission_rate_bps set not null,
  alter column commission_amount set not null,
  alter column seller_payout_amount set not null,
  alter column platform_revenue_amount set not null;

alter table public.orders
  drop constraint if exists orders_revenue_amounts_nonnegative,
  drop constraint if exists orders_commission_rate_valid,
  add constraint orders_revenue_amounts_nonnegative check (
    unit_price >= 0
    and subtotal_amount >= 0
    and verification_fee >= 0
    and commission_amount >= 0
    and seller_payout_amount >= 0
    and platform_revenue_amount >= 0
  ),
  add constraint orders_commission_rate_valid check (
    commission_rate_bps between 0 and 10000
  );

drop function if exists public.place_catalog_order(uuid, uuid, integer);

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

  if not exists (select 1 from public.users where id = p_buyer_id) then
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
