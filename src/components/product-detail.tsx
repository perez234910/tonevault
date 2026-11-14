import { ProductDetailView } from "./product-detail-view";

export async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetailView id={id} />;
}
