export interface SubCategory {
  id: number;
  name: string;
  slug?: string;
  category_id?: number;
}

export interface Category {
  id: number;
  name: string;
  slug?: string;
  subCategories: SubCategory[];
}

