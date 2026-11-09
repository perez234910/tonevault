-- GC2 permits checkout without an account; registered buyer rows remain valid.
alter table public.orders alter column buyer_id drop not null;
alter table public.order_checkout_details add column guest_token_hash text
  check (guest_token_hash is null or guest_token_hash ~ '^[a-f0-9]{64}$');

create or replace function public.place_catalog_order(
  p_product_id uuid,
  p_buyer_id uuid,
  p_quantity integer
)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  listing public.products%rowtype;
  new_order public.orders%rowtype;
  unit_price numeric(12, 2);
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

  unit_price := listing.price;

  insert into public.orders (
    product_id,
    buyer_id,
    quantity,
    total_amount,
    escrow_status,
    tracking_number
  )
  values (
    p_product_id,
    p_buyer_id,
    p_quantity,
    unit_price * p_quantity,
    'pending',
    null
  )
  returning * into new_order;

  update public.products
  set
    stock = listing.stock - p_quantity,
    status = case
      when listing.stock - p_quantity <= 0 then 'sold'::public.product_status
      else listing.status
    end
  where id = p_product_id;

  return new_order;
end;
$$;

revoke all on function public.place_catalog_order(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.place_catalog_order(uuid, uuid, integer) to service_role;

drop function public.place_checkout_order(uuid, uuid, integer, text, text, text, text, text, boolean);
create function public.place_checkout_order(
  p_product_id uuid, p_buyer_id uuid, p_quantity integer, p_full_name text,
  p_email text, p_phone text, p_address text, p_payment_method text,
  p_inspection_requested boolean default false, p_guest_token_hash text default null
)
returns public.orders language plpgsql security invoker set search_path = ''
as $$
declare saved public.orders%rowtype;
begin
  if (p_buyer_id is null) <> (p_guest_token_hash is not null) then
    raise exception 'INVALID_GUEST_ACCESS';
  end if;
  saved := public.place_catalog_order(p_product_id, p_buyer_id, p_quantity);
  insert into public.order_checkout_details(order_id, full_name, email, phone, address, payment_method, guest_token_hash)
  values(saved.id, p_full_name, p_email, p_phone, p_address, p_payment_method, p_guest_token_hash);
  if p_inspection_requested then
    update public.order_pricing set
      inspection_fee = (public.checkout_pricing_rules()->>'physical_inspection_fee')::numeric,
      inspection_status = 'pending'
    where order_id = saved.id;
    update public.orders set total_amount = (select buyer_total from public.order_pricing where order_id = saved.id)
    where id = saved.id returning * into saved;
  end if;
  return saved;
end; $$;
revoke all on function public.place_checkout_order(uuid, uuid, integer, text, text, text, text, text, boolean, text) from public, anon, authenticated;
grant execute on function public.place_checkout_order(uuid, uuid, integer, text, text, text, text, text, boolean, text) to service_role;

