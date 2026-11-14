import Link from "next/link";
import { formatPrice } from "@/src/lib/format";
import type { Order } from "@/src/types";
import { Icon } from "./ui/icon";

export type OwnerOrderRow = Pick<Order, "id" | "quantity" | "total_amount" | "escrow_status"> & { instrument: string };
export type OwnerOrdersState =
  | { status: "unavailable" | "loading" | "error" }
  | { status: "ready"; orders: OwnerOrderRow[] };

/** Presentation states only; Member 5 supplies authorized, validated data. */
export function OwnerOrders({ state }: { state: OwnerOrdersState }) {
  return <div className="owner-table-scroll" role="region" aria-label="Orders table" tabIndex={0}>
    <table className="owner-table" aria-busy={state.status === "loading"}>
      <caption className="sr-only">Owner orders</caption>
      <thead><tr>{["Reference", "Instrument", "Quantity", "Saved total", "Status"].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
      <tbody>{state.status === "ready" && state.orders.length ? state.orders.map(order => <tr key={order.id}>
        <td><Link href={`/confirmation/${encodeURIComponent(order.id)}`} className="ui-link">{order.id.slice(0, 8)}…</Link></td>
        <td>{order.instrument}</td><td>{order.quantity}</td><td>{formatPrice(order.total_amount)}</td><td>{order.escrow_status.replaceAll("_", " ")}</td>
      </tr>) : <tr><td colSpan={5}><div className="owner-orders-unavailable" role={state.status === "error" ? "alert" : "status"}>
        <Icon name="bag" size={24} />
        <h3>{state.status === "loading" ? "Loading orders…" : state.status === "error" ? "Unable to load orders" : state.status === "ready" ? "No orders yet" : "Orders unavailable"}</h3>
        <p>{state.status === "loading" ? "Checking your authorized order history." : state.status === "error" ? "Order data could not be loaded. No empty history or totals can be inferred." : state.status === "ready" ? "Your account has no orders in this result." : "Your authorized order history will appear here once account access and order data are connected."}</p>
      </div></td></tr>}</tbody>
    </table>
  </div>;
}
