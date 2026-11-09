import type { VerificationOption } from "@/src/lib/pricing/rules";

export type { VerificationOption } from "@/src/lib/pricing/rules";

export type UserRole = "buyer" | "seller" | "admin" | "luthier";

export type VerificationStatus =
  | "Unverified"
  | "Remote Verified"
  | "Fully Verified";

export type ProductStatus = "available" | "sold";

export type EscrowStatus =
  | "pending"
  | "paid"
  | "awaiting_shipment"
  | "shipped"
  | "delivered"
  | "approved"
  | "payout_released";

export type User = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
};

export type Product = {
  id: string;
  seller_id: string;
  brand: string;
  model: string;
  year: number | null;
  finish: string | null;
  price: number;
  verification_status: VerificationStatus;
  tonevault_score: number | null;
  condition_notes: string | null;
  status: ProductStatus;
  stock: number;
  images: string[];
  created_at: string;
};

export type Order = {
  id: string;
  product_id: string;
  buyer_id: string | null;
  quantity: number;
  unit_price: number;
  subtotal_amount: number;
  verification_option: VerificationOption;
  verification_fee: number;
  commission_rate_bps: number;
  commission_amount: number;
  seller_payout_amount: number;
  platform_revenue_amount: number;
  total_amount: number;
  escrow_status: EscrowStatus;
  tracking_number: string | null;
  created_at: string;
};

export type UserInsert = Omit<User, "created_at"> & {
  created_at?: string;
};

export type UserUpdate = Partial<Omit<User, "id" | "created_at">>;

export type ProductInsert = Omit<Product, "id" | "created_at" | "stock"> & {
  id?: string;
  created_at?: string;
  verification_status?: VerificationStatus;
  tonevault_score?: number | null;
  status?: ProductStatus;
  stock?: number;
  images?: string[];
};

export type ProductUpdate = Partial<Omit<Product, "id" | "seller_id" | "created_at">>;

export type OrderInsert = Omit<Order, "id" | "created_at" | "quantity"> & {
  id?: string;
  created_at?: string;
  quantity?: number;
  escrow_status?: EscrowStatus;
  tracking_number?: string | null;
};

export type OrderUpdate = Partial<
  Omit<Order, "id" | "product_id" | "buyer_id" | "created_at">
>;

export type PublicSeller = Pick<User, "id" | "full_name" | "role" | "created_at">;

export type InspectionMetrics = {
  verification_status: VerificationStatus;
  tonevault_score: number | null;
  score_scale: 100;
  condition_notes: string | null;
  is_verified: boolean;
  inspection_level: "none" | "remote" | "in_person";
};

export type ProductDetail = Product & {
  seller: PublicSeller | null;
  inspection: InspectionMetrics;
};

export type CatalogErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "NOT_AVAILABLE"
  | "CONFLICT"
  | "FORBIDDEN"
  | "INTERNAL_ERROR";

export type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: string;
      code: CatalogErrorCode;
      issues?: { path: string; message: string }[];
    };

export type CheckoutDetails = {
  guest_token_hash: string | null;
  order_id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  payment_method: "simulated_card" | "simulated_gcash";
};
