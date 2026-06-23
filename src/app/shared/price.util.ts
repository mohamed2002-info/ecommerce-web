import { Product } from '../Models/product.model';

/** The currency suffix used across the catalog. */
export const CURRENCY = 'DT';

/** True when the product currently has a discounted price to show. */
export function isOnSale(product: Product | undefined | null): boolean {
  return !!product?.on_sale
    && product.discounted_price != null
    && product.original_price != null
    && product.discounted_price < product.original_price;
}

/** The price the customer pays now (discounted if on sale, else list price). */
export function effectivePrice(product: Product | undefined | null): number {
  if (!product) {
    return 0;
  }
  if (isOnSale(product) && product.discounted_price != null) {
    return product.discounted_price;
  }
  return product.original_price ?? product.price ?? 0;
}

/** The original (pre-discount) price. */
export function listPrice(product: Product | undefined | null): number {
  return product?.original_price ?? product?.price ?? 0;
}

/** Whole-number percentage saved, for a "-20%" badge. */
export function discountPercent(product: Product | undefined | null): number {
  if (!isOnSale(product) || !product) {
    return 0;
  }
  const original = listPrice(product);
  const discounted = effectivePrice(product);
  if (original <= 0) {
    return 0;
  }
  return Math.round(((original - discounted) / original) * 100);
}
