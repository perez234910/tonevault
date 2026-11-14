import assert from "node:assert/strict";
import test from "node:test";
import {validateCheckoutStep, type CheckoutDraft} from "../src/lib/checkout-validation";
const draft: CheckoutDraft={email:"alex@example.invalid",fullName:"Alex Test",street:"123 Test Street",city:"Test City",postalCode:"1600",payment:"demo-card"};
test("checkout contact/shipping/payment steps reject incomplete data before review",()=>{
 assert.deepEqual(validateCheckoutStep(0,draft),{});assert.deepEqual(validateCheckoutStep(1,draft),{});assert.deepEqual(validateCheckoutStep(2,draft),{});
 assert.equal(Object.keys(validateCheckoutStep(0,{...draft,email:"bad",fullName:" "})).length,2);
 assert.equal(Object.keys(validateCheckoutStep(1,{...draft,street:" ",city:" ",postalCode:"12345"})).length,3);
 assert.ok(validateCheckoutStep(2,{...draft,payment:"real-card"}).payment);
});
