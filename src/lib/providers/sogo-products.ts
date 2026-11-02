export type SogoBuyProduct = {
  product_id: number;
  product_name: string;
  brand_name: string;
  country_code: string;
  country_name: string;
  currency_code: string;
  denomination_type: "FIXED" | "RANGE";
  fixed_recipient_denominations?: number[] | null;
  min_recipient_denomination?: string | number | null;
  max_recipient_denomination?: string | number | null;
  global?: boolean;
  logo_urls?: string[];
  redeem_instruction?: { concise?: string; verbose?: string };
};

const SUPPORTED_BRANDS = ["Amazon", "Apple", "PlayStation", "Steam", "Uber"] as const;

function rangeSuggestions(min: number, max: number): number[] {
  return [10, 25, 50].filter(value => value >= min && value <= max);
}

export function mapSogoBuyProducts(products: SogoBuyProduct[]) {
  return SUPPORTED_BRANDS.flatMap(brand => {
    const product = products.find(item =>
      item.country_code === "US" &&
      item.brand_name.toLowerCase() === brand.toLowerCase()
    );

    if (!product) return [];

    const fixed = Array.isArray(product.fixed_recipient_denominations)
      ? product.fixed_recipient_denominations.map(Number).filter(Number.isFinite)
      : [];

    const min = product.min_recipient_denomination == null
      ? null
      : Number(product.min_recipient_denomination);
    const max = product.max_recipient_denomination == null
      ? null
      : Number(product.max_recipient_denomination);

    const denominations = product.denomination_type === "FIXED"
      ? fixed
      : min !== null && max !== null
        ? rangeSuggestions(min, max)
        : [];

    return [{
      id: `${brand.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-us-${product.product_id}`,
      productId: product.product_id,
      brand,
      displayName: product.product_name,
      countryCode: product.country_code,
      countryName: product.country_name,
      currencyCode: product.currency_code,
      global: Boolean(product.global),
      denominationType: product.denomination_type,
      denominations,
      minDenomination: min,
      maxDenomination: max,
      logoUrl: product.logo_urls?.[0] ?? null,
      redeemInstructions: product.redeem_instruction?.concise ?? null
    }];
  });
}
