-- Disposable database only, with all repo migrations already applied.
begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('a1111111-1111-4111-8111-111111111111','seller@example.test','{}'),
 ('a2222222-2222-4222-8222-222222222222','buyer@example.test','{}');
insert into public.products(id,seller_id,brand,model,price,stock) values
 ('b1111111-1111-4111-8111-111111111111','a1111111-1111-4111-8111-111111111111','Test','Save',485000,1),
 ('b2222222-2222-4222-8222-222222222222','a1111111-1111-4111-8111-111111111111','Test','Rollback',168000,1);
set local role service_role;
do $$
declare saved public.orders%rowtype;
begin
 saved := public.place_checkout_order('b1111111-1111-4111-8111-111111111111','a2222222-2222-4222-8222-222222222222',1,'Test Buyer','test@example.com','09123456789','123 Test Street','simulated_card');
 assert saved.total_amount=485000 and saved.buyer_id='a2222222-2222-4222-8222-222222222222' and saved.escrow_status='pending';
 assert exists(select 1 from public.order_checkout_details where order_id=saved.id);
 assert exists(select 1 from public.products where id=saved.product_id and stock=0 and status='sold');
 begin
  perform public.place_checkout_order('b1111111-1111-4111-8111-111111111111','a2222222-2222-4222-8222-222222222222',1,'Test Buyer','test@example.com','09123456789','123 Test Street','simulated_card');
  raise exception 'Expected sold conflict';
 exception when raise_exception then if sqlerrm<>'SLOT_TAKEN' then raise; end if;
 end;
 begin
  perform public.place_checkout_order('b2222222-2222-4222-8222-222222222222','a2222222-2222-4222-8222-222222222222',1,'Test Buyer','test@example.com','09123456789','123 Test Street','invalid');
  raise exception 'Expected validation failure';
 exception when check_violation then null;
 end;
 assert not exists(select 1 from public.orders where product_id='b2222222-2222-4222-8222-222222222222');
 assert exists(select 1 from public.products where id='b2222222-2222-4222-8222-222222222222' and stock=1 and status='available');
 -- The original registered-buyer RPC still works without checkout details.
 saved := public.place_catalog_order('b2222222-2222-4222-8222-222222222222','a2222222-2222-4222-8222-222222222222',1);
 assert saved.total_amount=168000;
end; $$;
reset role;
do $$ begin
 assert not has_table_privilege('anon','public.order_checkout_details','select');
 assert not has_table_privilege('authenticated','public.order_checkout_details','select');
 assert not has_function_privilege('anon','public.place_checkout_order(uuid,uuid,integer,text,text,text,text,text,boolean,text)','execute');
 assert (select is_nullable='YES' from information_schema.columns where table_schema='public' and table_name='orders' and column_name='buyer_id');
end; $$;
rollback;
