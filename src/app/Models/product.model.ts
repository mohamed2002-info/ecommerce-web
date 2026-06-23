/** Promotion summary attached to a product when it is on sale. */
export interface ProductPromotion {
  id: number;
  name: string;
  discount_type: 'percentage' | 'fixed';
  value: number;
  ends_at: string | null;
}

/** Per-store stock breakdown for a product. */
export interface StoreStock {
  store_id: number;
  store: string;
  city: string;
  quantity: number;
}

export class Product {
  id: number;
  name: string;
  reference: string;
  sub_category_id: number;
  price: number;
  description: string;
  image_url: string | null;

  // Promotion pricing (populated by the backend; optional for backward-compat).
  original_price?: number;
  discounted_price?: number;
  on_sale?: boolean;
  promotion?: ProductPromotion | null;

  // Stock / availability (populated by the backend).
  total_stock?: number;
  in_stock?: boolean;
  by_store?: StoreStock[];
  available_stores?: string[];

  constructor(
    id: number,
    name: string,
    reference: string,
    sub_category_id: number,
    price: number,
    description: string,
    image_url: string | null
  ) {
    this.id = id;
    this.name = name;
    this.reference = reference;
    this.sub_category_id = sub_category_id;
    this.price = price;
    this.description = description;
    this.image_url = image_url;
  }
}
