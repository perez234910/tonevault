import assert from "node:assert/strict";
import test from "node:test";
import { productPhotography, cartPhotograph } from "../src/lib/catalog-photography";
const base = {brand:"Fender",model:"Stratocaster",finish:"Olympic White",images:["https://images.unsplash.com/unrelated"]};
test("model references match brand, model and finish; never substitute a different guitar or repeat a gallery", () => {
  assert.deepEqual(productPhotography(base),{images:["/guitars/stratocaster.jpg"],reference:true});
  for (const product of [{...base,finish:"Sunburst"},{...base,model:"SG Standard"},{...base,images:[]}]) assert.deepEqual(productPhotography(product).images,[]);
  assert.deepEqual(productPhotography({...base,images:["https://seller.example/actual.jpg"]}),{images:["https://seller.example/actual.jpg"],reference:false});
});
test("persisted legacy carts use matching model references or a missing-photo state", () => {
  assert.equal(cartPhotograph({title:"1965 Fender Stratocaster",finish:"Olympic White",image:base.images[0]}),"/guitars/stratocaster.jpg");
  assert.equal(cartPhotograph({title:"1954 Fender Stratocaster",finish:"Sunburst",image:base.images[0]}),null);
});
