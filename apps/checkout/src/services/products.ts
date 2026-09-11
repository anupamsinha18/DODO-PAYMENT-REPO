export interface Product {
  id: string;
  name: string;
  description: string;
  priceFormatted: string;
  priceCents: number;
}

export const PRODUCTS: Record<string, Product> = {
  prod_123: {
    id: "prod_123",
    name: "Premium Developer Plan",
    description: "Build better products faster with unlimited cloud environments and preview deploys.",
    priceFormatted: "$49.00",
    priceCents: 4900,
  },
  prod_team: {
    id: "prod_team",
    name: "Team Enterprise License",
    description: "Organization-wide collaboration, priority support, and custom domain routing.",
    priceFormatted: "$149.00",
    priceCents: 14900,
  },
};

export function getProductById(productId: string): Product | null {
  return PRODUCTS[productId] || null;
}
