import assert from "node:assert/strict";
import test from "node:test";
import { parseCatalogSuggestions, fetchCatalogSuggestions, suggestionHref } from "../src/lib/catalog-search";

const product = {id:"30000000-0000-4000-8000-000000000001",brand:"Gibson",model:"Les Paul Standard",year:1959};
const response = {ok:true,products:[product,{...product,id:"30000000-0000-4000-8000-000000000002",model:"ES-335",year:1964}],count:2};

test("GI suggestions derive one matching brand and distinct actual response listings",()=>{
  const options=parseCatalogSuggestions(response,"GI");
  assert.equal(options.length,3);
  assert.deepEqual(options[0],{kind:"brand",key:"brand:gibson",label:"Gibson",brand:"Gibson"});
  assert.equal(options[1].label,"1959 Gibson Les Paul Standard");
  assert.equal(parseCatalogSuggestions({...response,products:[product,product]},"GI").length,2);
  assert.deepEqual(parseCatalogSuggestions({ok:true,products:[],count:0},"GI"),[]);
});
test("model-only matches do not fabricate unrelated brand suggestions",()=>{
  const options=parseCatalogSuggestions({ok:true,products:[{...product,brand:"PRS",model:"Custom 24"}],count:1},"Custom");
  assert.equal(options.length,1);assert.equal(options[0].kind,"product");
});
test("invalid API envelopes fail rather than masquerade as no matches",()=>{
  for(const payload of [{ok:false},[],{...response,products:[{...product,id:"invalid"}]}]) assert.throws(()=>parseCatalogSuggestions(payload,"GI"));
});
test("suggestion fetch uses only the bounded own GET API and forwards cancellation",async()=>{
  const controller=new AbortController();
  const fetcher:typeof fetch=async(input,init)=>{
    assert.equal(String(input),"/api/products?query=GI&status=sold&limit=6");
    assert.equal(init?.signal,controller.signal);assert.equal(init?.cache,"no-store");assert.equal(init?.method,undefined);
    return Response.json(response);
  };
  assert.equal((await fetchCatalogSuggestions(" GI ",controller.signal,"sold",fetcher))[0].label,"Gibson");
  await assert.rejects(fetchCatalogSuggestions("GI",controller.signal,"available",async()=>new Response(null,{status:500})));
});
test("brand selection preserves filters but clears old keyword/pagination; listing selection opens its ID",()=>{
  const [brand,listing]=parseCatalogSuggestions(response,"GI");
  const href=suggestionHref(brand,new URLSearchParams("brand=PRS&query=old&search=alias&offset=24&minPrice=10&status=sold"));
  const parsed=new URL(href,"http://localhost");
  assert.equal(parsed.searchParams.get("brand"),"Gibson");assert.equal(parsed.searchParams.get("minPrice"),"10");assert.equal(parsed.searchParams.get("status"),"sold");
  for(const name of ["query","search","offset"])assert.equal(parsed.searchParams.has(name),false);
  assert.equal(suggestionHref(listing),`/products/${product.id}`);
});
