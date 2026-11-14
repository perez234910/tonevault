"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { fetchSavedOrder, OrderReadError, type SavedOrder } from "@/src/lib/order-client";
import { formatPrice, instrumentTitle } from "@/src/lib/format";
import { fetchProductDetail } from "@/src/lib/product-detail-client";
import type { ProductDetail } from "@/src/types";
import { productPhotography } from "@/src/lib/catalog-photography";
import { InstrumentImage } from "./instrument-image";

export function OrderLookup() {
  const router=useRouter();const [reference,setReference]=useState("");const [error,setError]=useState("");
  return <div className="page-container"><h1>Find your saved order</h1><p className="mt-4 max-w-lg text-sm leading-6 text-muted">Use the reference from a successfully saved order. Checkout preview does not create one.</p><form className="mt-8 max-w-lg" noValidate onSubmit={(event)=>{event.preventDefault();const id=reference.trim();if(!z.uuid().safeParse(id).success){setError("Enter a valid saved order reference.");return;}setError("");router.push(`/confirmation/${encodeURIComponent(id)}`);}}><label htmlFor="order-reference" className="mb-3 block text-sm">Order reference</label><input id="order-reference" value={reference} onChange={event=>setReference(event.target.value)} aria-invalid={Boolean(error)} aria-describedby="reference-note" className="ui-control" autoComplete="off" spellCheck={false} /><p id="reference-note" role={error?"alert":undefined} className={error?"field-error":"mt-3 text-xs text-muted"}>{error||"Saved order access requires authorization. No private order data is available without the order service."}</p><button className="ui-button ui-button--primary mt-6" type="submit">Find order</button></form><Link href="/browse" className="ui-link mt-8">Back to the storefront</Link></div>;
}

type State={key:string;accessToken?:string;order?:SavedOrder;product?:ProductDetail;productUnavailable?:boolean;error?:string;kind?:string};
const statuses=["pending","paid","awaiting_shipment","shipped","delivered","approved","payout_released"];
export function ConfirmationScreen({id,accessToken}:{id:string;accessToken?:string}) {
 const [attempt,setAttempt]=useState(0);const [state,setState]=useState<State|null>(null);const key=`${id}:${attempt}`;
 useEffect(()=>{const controller=new AbortController();void (async()=>{
  try {const order=await fetchSavedOrder(id,controller.signal,fetch,{accessToken});let product:ProductDetail|undefined;try{product=await fetchProductDetail(order.product_id,controller.signal)}catch{if(controller.signal.aborted)return;}
   if(!controller.signal.aborted)setState({key,accessToken,order,product,productUnavailable:!product});
  }catch(error){if(!controller.signal.aborted)setState({key,accessToken,error:error instanceof OrderReadError?error.message:"Unable to load your order. Check your connection and try again.",kind:error instanceof OrderReadError?error.kind:"unavailable"});}
 })();return()=>controller.abort();},[id,key,accessToken]);
 if(state?.key!==key || state.accessToken!==accessToken)return <div className="page-container"><h1>Checking your saved order</h1><p role="status" className="mt-6">Loading authorized order details…</p></div>;
 if(!state.order)return <div className="page-container"><h1>{state.kind==="missing"?"Order not found":state.kind==="denied"?"Order access required":"Order confirmation unavailable"}</h1><div className="empty-panel"><p role="status">{state.error}</p><p>No order, payment or shipment is confirmed by this screen.</p><div className="mt-6 flex flex-wrap justify-center gap-3">{state.kind!=="missing"&&state.kind!=="invalid"?<button className="ui-button" onClick={()=>setAttempt(x=>x+1)}>Retry order lookup</button>:null}<Link href="/confirmation" className="ui-button">Check another reference</Link><Link href="/browse" className="ui-button ui-button--primary">Return to storefront</Link></div></div></div>;
 const {order,product}=state;const photography=product?productPhotography(product):null;const current=statuses.indexOf(order.escrow_status);
 return <div className="page-container"><h1>Your saved order</h1><p className="mt-4 break-all text-sm text-muted">Reference {order.id}</p><p className="mt-3 text-sm text-muted">Recorded {new Intl.DateTimeFormat("en-PH",{dateStyle:"medium",timeZone:"Asia/Manila"}).format(new Date(order.created_at))}. This page does not process payment.</p>
 <ol className="order-progress" aria-label="Saved order status">{statuses.map((status,index)=><li key={status} aria-current={status===order.escrow_status?"step":undefined}><span className={index<=current?"status-point status-point--reached":"status-point"}>{index+1}</span><span>{status.replaceAll("_"," ")}</span></li>)}</ol>
 <div className="checkout-grid"><section><h2 className="text-xl">{product?instrumentTitle(product):"Ordered instrument"}</h2>{product?<div className="relative mt-6 aspect-[4/3] max-w-md bg-panel"><InstrumentImage src={photography?.images[0]??null} alt={instrumentTitle(product)} sizes="400px" reference={photography?.reference} /></div>:<p className="mt-5 text-sm text-muted">Instrument details are unavailable. The saved order details below remain separate from current catalog availability.</p>}{photography?.reference?<p className="mt-3 text-xs text-muted">Model reference photo; not shipment or verification evidence.</p>:null}<p className="mt-6 text-sm leading-6 text-muted">{order.escrow_status==="pending"?"This order is recorded as pending. No payment or shipment is implied.":`The saved order is marked ${order.escrow_status.replaceAll("_"," ")}. Consult the seller for the next update.`}</p></section><aside className="cart-summary" aria-label="Saved order details"><h2 className="text-xl">Order details</h2><dl className="review-details"><div><dt>Quantity</dt><dd>{order.quantity}</dd></div><div><dt>Saved total</dt><dd>{formatPrice(order.total_amount)}</dd></div><div><dt>Status</dt><dd>{order.escrow_status.replaceAll("_"," ")}</dd></div><div><dt>Tracking</dt><dd>{order.tracking_number||"Not provided"}</dd></div></dl><p className="mt-5 text-xs leading-5 text-muted">Saved totals come from the order service. Contact and shipping information is not available through the current order model.</p></aside></div><Link href="/browse" className="ui-button ui-button--primary mt-8">Back to the storefront</Link></div>;
}
