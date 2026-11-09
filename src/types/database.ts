import type {
  EscrowStatus,
  CheckoutDetails,
  OrderPricing,
  CheckoutPricingRules,
  Order,
  OrderInsert,
  OrderUpdate,
  Product,
  ProductInsert,
  ProductStatus,
  ProductUpdate,
  User,
  UserInsert,
  UserRole,
  UserUpdate,
  VerificationOption,
  VerificationStatus,
} from "./index";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: UserInsert;
        Update: UserUpdate;
        Relationships: [];
      };
      products: {
        Row: Product;
        Insert: ProductInsert;
        Update: ProductUpdate;
        Relationships: [
          {
            foreignKeyName: "products_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      order_pricing: {
        Row: OrderPricing;
        Insert: Pick<OrderPricing, "order_id" | "merchandise_amount" | "commission_rate">;
        Update: Partial<Pick<OrderPricing, "inspection_fee" | "inspection_status">>;
        Relationships: [];
      };
      order_checkout_details: {
        Row: CheckoutDetails;
        Insert: CheckoutDetails;
        Update: Partial<CheckoutDetails>;
        Relationships: [];
      };
      orders: {
        Row: Order;
        Insert: OrderInsert;
        Update: OrderUpdate;
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_buyer_id_fkey";
            columns: ["buyer_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      order_revenue: {
        Row: { order_id: string; commission_revenue: number; inspection_revenue: number };
        Relationships: [];
      };
    };
    Functions: {
      place_checkout_order: {
        Args: {
          p_product_id: string; p_buyer_id: string | null; p_quantity: number;
          p_full_name: string; p_email: string; p_phone: string;
          p_address: string; p_payment_method: string; p_inspection_requested?: boolean; p_guest_token_hash?: string | null;
        };
        Returns: Order;
      };
      checkout_pricing_rules: {
        Args: Record<PropertyKey, never>;
        Returns: CheckoutPricingRules;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      place_catalog_order: {
        Args: {
          p_product_id: string;
          p_buyer_id: string;
          p_quantity: number;
          p_verification_option: VerificationOption;
          p_expected_unit_price: number;
          p_subtotal_amount: number;
          p_verification_fee: number;
          p_commission_rate_bps: number;
          p_commission_amount: number;
          p_seller_payout_amount: number;
          p_platform_revenue_amount: number;
          p_total_amount: number;
        };
        Returns: Order;
      };
    };
    Enums: {
      user_role: UserRole;
      verification_status: VerificationStatus;
      product_status: ProductStatus;
      escrow_status: EscrowStatus;
      verification_option: VerificationOption;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
