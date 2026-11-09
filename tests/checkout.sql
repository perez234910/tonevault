-- Disposable database only, with Member 4 pricing and Member 3 details migrations applied.
begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('a1111111-1111-4111-8111-111111111111','seller@example.test','{}'),
 ('a2222222-2222-4222-8222-222222222222','buyer@example.test','{}');
insert into public.products(id,seller_id,brand,model,price,stock) values
 ('b1111111-1111-4111-8111-111111111111','a1111111-1111-4111-8111-111111111111','Test','Physical',485000,1),
 ('b2222222-2222-4222-8222-222222222222','a1111111-1111-4111-8111-111111111111','Test','Rollback',485000,1),
 ('b3333333-3333-4333-8333-333333333333','a1111111-1111-4111-8111-111111111111','Test','Remote',168000,1);
set local role service_role;
do $$
declare saved public.orders%rowtype;
begin
 saved := public.place_checkout_order('b1111111-1111-4111-8111-111111111111',null,1,'physical',485000,485000,8500,800,38800,446200,47300,493500,'Test Buyer','test@example.com','09123456789','123 Test Street','simulated_card',repeat('a',64));
 assert saved.buyer_id is null and saved.total_amount=493500;
 assert saved.verification_option='physical' and saved.verification_fee=8500;
 assert saved.commission_amount=38800 and saved.seller_payout_amount=446200 and saved.platform_revenue_amount=47300;
 assert exists(select 1 from public.order_checkout_details where order_id=saved.id and guest_token_hash=repeat('a',64));
 assert exists(select 1 from public.products where id=saved.product_id and stock=0 and status='sold');
 begin
  perform public.place_checkout_order('b2222222-2222-4222-8222-222222222222',null,1,'none',485000,485000,0,800,38800,446200,38800,485000,'Test Buyer','test@example.com','09123456789','123 Test Street','simulated_card',null);
  raise exception 'Expected guest hash requirement';
 exception when raise_exception then if sqlerrm<>'INVALID_GUEST_ACCESS' then raise; end if;
 end;
 begin
  perform public.place_checkout_order('b2222222-2222-4222-8222-222222222222',null,1,'none',1,485000,0,800,38800,446200,38800,485000,'Test Buyer','test@example.com','09123456789','123 Test Street','simulated_card',repeat('b',64));
  raise exception 'Expected stale price rejection';
 exception when raise_exception then if sqlerrm<>'PRICE_CHANGED' then raise; end if;
 end;
 begin
  perform public.place_checkout_order('b2222222-2222-4222-8222-222222222222',null,1,'none',485000,485000,0,800,38800,446200,38800,1,'Test Buyer','test@example.com','09123456789','123 Test Street','simulated_card',repeat('b',64));
  raise exception 'Expected forged snapshot rejection';
 exception when raise_exception then if sqlerrm<>'INVALID_PRICING_SNAPSHOT' then raise; end if;
 end;
 begin
  perform public.place_checkout_order('b2222222-2222-4222-8222-222222222222',null,1,'none',485000,485000,0,800,38800,446200,38800,485000,'Test Buyer','test@example.com','09123456789','123 Test Street','invalid',repeat('b',64));
  raise exception 'Expected details rollback';
 exception when check_violation then null;
 end;
 assert not exists(select 1 from public.orders where product_id='b2222222-2222-4222-8222-222222222222');
 assert exists(select 1 from public.products where id='b2222222-2222-4222-8222-222222222222' and stock=1);
 saved := public.place_checkout_order('b2222222-2222-4222-8222-222222222222','a2222222-2222-4222-8222-222222222222',1,'none',485000,485000,0,800,38800,446200,38800,485000,'Test Buyer','test@example.com','09123456789','123 Test Street','simulated_card',null);
 assert saved.buyer_id='a2222222-2222-4222-8222-222222222222' and saved.total_amount=485000 and saved.verification_fee=0;
 saved := public.place_checkout_order('b3333333-3333-4333-8333-333333333333',null,1,'remote',168000,168000,2800,800,13440,154560,16240,170800,'Test Buyer','test@example.com','09123456789','123 Test Street','simulated_card',repeat('c',64));
 assert saved.total_amount=170800 and saved.verification_fee=2800 and saved.verification_option='remote';
end; $$;
reset role;
do $$ begin
 assert not has_table_privilege('anon','public.order_checkout_details','select');
 assert not has_table_privilege('authenticated','public.order_checkout_details','select');
 assert not has_function_privilege('anon','public.place_checkout_order(uuid,uuid,integer,public.verification_option,numeric,numeric,numeric,integer,numeric,numeric,numeric,numeric,text,text,text,text,text,text)','execute');
 assert not exists(select 1 from information_schema.tables where table_schema='public' and table_name='order_pricing');
 assert not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='checkout_pricing_rules');
end; $$;
rollback;
