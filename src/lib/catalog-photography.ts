import type { Product } from "../types";

const references = [
  { brand: "Fender", model: "Stratocaster", finish: ["olympic white"], file: "stratocaster.jpg" },
  { brand: "Gibson", model: "Les Paul Standard", finish: ["cherry sunburst"], file: "les-paul.png" },
  { brand: "Fender", model: "Telecaster", finish: ["olympic white"], file: "telecaster.png" },
  { brand: "Gibson", model: "ES-335", finish: ["cherry"], file: "es-335.jpg" },
  { brand: "PRS", model: "Custom 24", finish: ["cobalt blue"], file: "prs-custom24.jpg" },
  { brand: "Fender", model: "Jazzmaster", finish: ["aquamarine blue", "aquatone blue"], file: "jazzmaster.png" },
];
const isLegacyIllustration = (image: string) => image.startsWith("/preview/") || image.startsWith("https://images.unsplash.com/");
export const isModelReference = (image: string | null) => Boolean(image?.startsWith("/guitars/"));

/** Presentation only. Never mutate API records or turn a model reference into inspection evidence. */
export function productPhotography(product: Pick<Product, "brand" | "model" | "finish" | "images">) {
  if (!product.images.length) return { images: [], reference: false };
  if (!product.images.every(isLegacyIllustration)) return { images: product.images, reference: product.images.some(isModelReference) };
  const match = references.find((entry) => entry.brand === product.brand && entry.model === product.model && entry.finish.includes(product.finish?.toLowerCase() ?? ""));
  return { images: match ? [`/guitars/${match.file}`] : [], reference: Boolean(match) };
}

/** Existing persisted carts can still contain the old unrelated stock images. */
export function cartPhotograph(item: { title: string; finish: string | null; image: string | null }) {
  if (!item.image || !isLegacyIllustration(item.image)) return item.image;
  const match = references.find((entry) => item.title.includes(`${entry.brand} ${entry.model}`) && entry.finish.includes(item.finish?.toLowerCase() ?? ""));
  return match ? `/guitars/${match.file}` : null;
}
