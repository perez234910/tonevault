
import type { Order, Product } from "@/src/types";

// Provisional threshold: listings with 2 or fewer units are considered low-stock.
// Confirm this threshold with the group before final deployment.
export const DEFAULT_LOW_STOCK_THRESHOLD = 2;

export type OwnerMetrics = {
  totalOrders: number;
  totalOrderValue: number;
  averageOrderValue: number;

  // Pending until approved commission and verification-fee
  // fields are available in the database.
  platformRevenue: number | null;
  revenueStatus: "pending_revenue_fields";

  // Includes every guitar tied for the highest quantity sold.
  topSellingItems: {
    productId: string;
    name: string;
    quantitySold: number;
  }[];

  lowStockThreshold: number;

  lowStockItems: {
    id: string;
    name: string;
    stock: number;
  }[];
};

export function calculateOwnerMetrics(
  orders: Order[],
  products: Product[],
  lowStockThreshold = DEFAULT_LOW_STOCK_THRESHOLD,
): OwnerMetrics {
  const threshold = Number.isFinite(lowStockThreshold)
    ? Math.max(0, Math.floor(lowStockThreshold))
    : DEFAULT_LOW_STOCK_THRESHOLD;

  // 1. Total number of saved orders.
  const totalOrders = orders.length;

  // 2. Total value of saved orders.
  const totalOrderValue = orders.reduce((sum, order) => {
    const amount = Number(order.total_amount);

    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);

  // 3. Average order value.
  const averageOrderValue =
    totalOrders === 0
      ? 0
      : Number((totalOrderValue / totalOrders).toFixed(2));

  // Create a product lookup for identifying sold guitars.
  const productMap = new Map(
    products.map((product) => [product.id, product]),
  );

  // 4. Calculate units sold for each product.
  const quantitiesByProduct = new Map<string, number>();

  for (const order of orders) {
    const quantity = Number(order.quantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      continue;
    }

    const previousQuantity =
      quantitiesByProduct.get(order.product_id) ?? 0;

    quantitiesByProduct.set(
      order.product_id,
      previousQuantity + quantity,
    );
  }

  // Rank products by quantity sold, highest first.
  const rankedProducts = Array.from(
    quantitiesByProduct.entries(),
  )
    .map(([productId, quantitySold]) => {
      const product = productMap.get(productId);

      return {
        productId,
        name: product
          ? `${product.brand} ${product.model}`
          : "Unknown guitar",
        quantitySold,
      };
    })
    .sort(
      (a, b) =>
        b.quantitySold - a.quantitySold ||
        a.name.localeCompare(b.name),
    );

  // Include all products tied for the highest quantity sold.
  const highestQuantitySold = rankedProducts[0]?.quantitySold ?? 0;

  const topSellingItems =
    highestQuantitySold === 0
      ? []
      : rankedProducts.filter(
          (product) => product.quantitySold === highestQuantitySold,
        );

  // 5. Find available listings at or below the low-stock threshold.
  const lowStockItems = products
    .filter((product) => {
      const stock = Number(product.stock);

      return (
        product.status === "available" &&
        Number.isFinite(stock) &&
        stock <= threshold
      );
    })
    .map((product) => ({
      id: product.id,
      name: `${product.brand} ${product.model}`,
      stock: Number(product.stock),
    }));

  return {
    totalOrders,
    totalOrderValue,
    averageOrderValue,

    // Platform revenue cannot yet be calculated reliably
    // because commission and verification-fee snapshots
    // have not been integrated into the database.
    platformRevenue: null,
    revenueStatus: "pending_revenue_fields",

    topSellingItems,
    lowStockThreshold: threshold,
    lowStockItems,
  };
}
