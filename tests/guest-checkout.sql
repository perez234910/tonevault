-- Disposable database only. Verify guest and account contracts together.
begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('a1111111-1111-4111-8111-111111111111','seller@example.test','{}');
insert into public.products(id,seller_id,brand,model,price,stock) values
 ('b1111111-1111-4111-8111-111111111111','a1111111-1111-4111-8111-111111111111','Test','Guest',485000,1),
 ('b2222222-2222-4222-8222-222222222222','a1111111-1111-4111-8111-111111111111','Test','Rollback',168000,1);
set local role service_role;
do $$
declare saved public.orders%rowtype;
begin
 saved := public.place_checkout_order('b1111111-1111-4111-8111-111111111111',null,1,'Test Buyer','test@example.com','09123456789','123 Test Street','simulated_card',true,repeat('a',64));
 assert saved.buyer_id is null and saved.total_amount=493500;
 assert exists(select 1 from public.order_checkout_details where order_id=saved.id and guest_token_hash=repeat('a',64));
 assert exists(select 1 from public.order_pricing where order_id=saved.id and commission_amount=38800 and seller_proceeds=446200);
 assert exists(select 1 from public.products where id=saved.product_id and stock=0 and status='sold');
 begin
  perform public.place_checkout_order('b2222222-2222-4222-8222-222222222222',null,1,'Test Buyer','test@example.com','09123456789','123 Test Street','simulated_card');
  raise exception 'Expected missing guest access rejection';
 exception when raise_exception then if sqlerrm<>'INVALID_GUEST_ACCESS' then raise; end if;
 end;
 begin
  perform public.place_checkout_order('b2222222-2222-4222-8222-222222222222',null,1,'Test Buyer','test@example.com','09123456789','123 Test Street','simulated_card',false,'bad-hash');
  raise exception 'Expected invalid hash rejection';
 exception when check_violation then null;
 end;
 assert not exists(select 1 from public.orders where product_id='b2222222-2222-4222-8222-222222222222');
 assert exists(select 1 from public.products where id='b2222222-2222-4222-8222-222222222222' and stock=1);
end; $$;
rollback;
