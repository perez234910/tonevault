import assert from "node:assert/strict";
import test from "node:test";
import {fetchSavedOrder,OrderReadError} from "../src/lib/order-client";
const id="20000000-0000-4000-8000-000000000001";
const order={id,product_id:id,buyer_id:id,quantity:1,total_amount:100.25,escrow_status:"pending",tracking_number:null,created_at:"2026-11-08T00:00:00Z"};
const request=(body:unknown,status=200,type="application/json")=>(async()=>new Response(type==="application/json"?JSON.stringify(body):"<html>Not implemented</html>",{status,headers:{"content-type":type}})) as typeof fetch;
test("saved order UI only accepts a validated matching server record",async()=>{
 assert.deepEqual(await fetchSavedOrder(id,undefined,request({ok:true,data:{order}})),order);
 for(const invalid of [{...order,id:"20000000-0000-4000-8000-000000000002"},{...order,total_amount:-1},{...order,quantity:0}])await assert.rejects(fetchSavedOrder(id,undefined,request({ok:true,data:{order:invalid}})),e=>e instanceof OrderReadError&&e.kind==="invalid");
});
test("missing API, missing order, denied access and invalid reference remain distinct",async()=>{
 await assert.rejects(fetchSavedOrder(id,undefined,request({},404,"text/html")),e=>e instanceof OrderReadError&&e.kind==="unavailable");
 await assert.rejects(fetchSavedOrder(id,undefined,request({code:"NOT_FOUND"},404)),e=>e instanceof OrderReadError&&e.kind==="missing");
 await assert.rejects(fetchSavedOrder(id,undefined,request({},403)),e=>e instanceof OrderReadError&&e.kind==="denied");
 await assert.rejects(fetchSavedOrder("not-an-id",undefined,request({})),e=>e instanceof OrderReadError&&e.kind==="invalid");
});

// Isolated adapter contracts only. These responses never reach a running app or database.
test("guest reads retain the private cookie and accept null buyer identity",async()=>{
 let init:RequestInit|undefined;
 const guest={...order,buyer_id:null};
 const fetcher=(async(_url:unknown,options?:RequestInit)=>{init=options;return request({ok:true,data:{order:guest}})("https://unit.invalid");}) as typeof fetch;
 assert.deepEqual(await fetchSavedOrder(id,undefined,fetcher),guest);
 assert.equal(init?.credentials,"same-origin");
 assert.equal(init?.cache,"no-store");
 assert.equal(new Headers(init?.headers).has("Authorization"),false);
});
test("account reads forward only the supplied bearer token and preserve cancellation",async()=>{
 const controller=new AbortController();let init:RequestInit|undefined;
 const fetcher=(async(_url:unknown,options?:RequestInit)=>{init=options;return request({ok:true,data:{order}})("https://unit.invalid");}) as typeof fetch;
 await fetchSavedOrder(id,controller.signal,fetcher,{accessToken:"unit-test-token"});
 assert.equal(new Headers(init?.headers).get("Authorization"),"Bearer unit-test-token");
 assert.equal(init?.signal,controller.signal);
});
test("Member 3 code-less 404s and malformed JSON cannot display a confirmation",async()=>{
 await assert.rejects(fetchSavedOrder(id,undefined,request({ok:false,error:"Order not found."},404)),e=>e instanceof OrderReadError&&e.kind==="missing");
 const malformed=(async()=>new Response("{",{headers:{"content-type":"application/json"}})) as typeof fetch;
 await assert.rejects(fetchSavedOrder(id,undefined,malformed),e=>e instanceof OrderReadError&&e.kind==="invalid");
 await assert.rejects(fetchSavedOrder(id,undefined,request({ok:true,data:{order:{...order,buyer_id:"invalid"}}})),e=>e instanceof OrderReadError&&e.kind==="invalid");
});
