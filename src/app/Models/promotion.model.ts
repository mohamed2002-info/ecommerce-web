export type PromotionTargetType = 'product' | 'products' | 'category' | 'all';
export type PromotionDiscountType = 'percentage' | 'fixed';
export type PromotionStatus = 'active' | 'paused';

export interface Promotion {
  id: number;
  name: string;
  description: string | null;
  target_type: PromotionTargetType;
  category_id: number | null;
  discount_type: PromotionDiscountType;
  value: number;
  starts_at: string | null;
  ends_at: string | null;
  priority: number;
  status: PromotionStatus;
  max_uses: number | null;
  audience: string;
  is_live?: boolean;
  products?: { id: number; name: string }[];
  category?: { id: number; name: string } | null;
}

/** Shape sent to the API when creating/updating a promotion. */
export interface PromotionPayload {
  name: string;
  description?: string | null;
  target_type: PromotionTargetType;
  category_id?: number | null;
  product_ids?: number[];
  discount_type: PromotionDiscountType;
  value: number;
  starts_at?: string | null;
  ends_at?: string | null;
  priority?: number;
  status?: PromotionStatus;
}
