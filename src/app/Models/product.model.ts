export class Product {
  id: number;
  name: string;
  reference: string;
  sub_category_id: number;  // Ensure it matches the sub-category's ID
  price: number;
  description: string;
  image_url: string | null;  // For optional image field

  constructor(id: number, name: string, reference: string, sub_category_id: number, price: number, description: string, image_url: string | null) {
    this.id = id;
    this.name = name;
    this.reference = reference;
    this.sub_category_id = sub_category_id;
    this.price = price;
    this.description = description;
    this.image_url = image_url;
  }
}
