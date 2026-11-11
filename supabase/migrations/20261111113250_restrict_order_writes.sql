-- Checkout validates pricing and stock before the service role writes orders.
revoke all on table public.orders from public, anon, authenticated;
grant select on table public.orders to authenticated;
grant select, insert on table public.orders to service_role;

drop policy if exists "Buyers can create their own orders" on public.orders;
drop policy if exists "Order participants can update escrow fields" on public.orders;
