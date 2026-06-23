import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Product } from 'src/app/Models/product.model';
import { environment } from 'src/environments/environment';
import { WishlistService } from '../../services/wishlist.service';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { SubCategoryService } from '../../services/subcategory.service';
import { Category, SubCategory } from '../../Models/category.model';
import { AuthService } from '../../services/auth.service';
import { StoreService, Store } from '../../services/store.service';
import { Observable } from 'rxjs';
import { TickerService } from '../../shared/ticker.service';
import { CURRENCY, discountPercent, effectivePrice, isOnSale, listPrice } from '../../shared/price.util';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.css']
})
export class ProductDetailsComponent {

  @Input() product!: Product;
  @Output() closeModal: EventEmitter<void> = new EventEmitter<void>();
  @Output() productUpdated: EventEmitter<void> = new EventEmitter<void>();
  localUrl = environment.localUrl;
  isAdmin: boolean = false;
  
  // Admin states
  showProductModal: boolean = false;
  showDeleteConfirmModal: boolean = false;
  categories: Category[] = [];
  
  // Product form data
  productName: string = '';
  productReference: string = '';
  selectedSubCategoryId: number | null = null;
  productPrice: number = 0;
  productDescription: string = '';
  productImage: File | null = null;
  productImagePreview: string | null = null;
  adminMessage: string = '';
  adminMessageType: 'success' | 'error' = 'success';
  // Per-store stock for the edit form: { storeId: quantity }
  stores: Store[] = [];
  productStock: { [storeId: number]: number } = {};

  constructor(
    private wishlistService: WishlistService,
    private cartService: CartService,
    private productService: ProductService,
    private categoryService: CategoryService,
    private subCategoryService: SubCategoryService,
    private auth: AuthService,
    private storeService: StoreService,
    ticker: TickerService
  ) {
    this.tick$ = ticker.tick$;
    this.isAdmin = this.auth.isAdmin();
    if (this.isAdmin) {
      this.loadCategories();
      this.storeService.list().subscribe({
        next: (stores) => (this.stores = stores || []),
        error: () => (this.stores = [])
      });
    }
  }

  // Promotion display helpers.
  currency = CURRENCY;
  tick$: Observable<number>;
  get onSale(): boolean { return isOnSale(this.product); }
  get price(): number { return effectivePrice(this.product); }
  get original(): number { return listPrice(this.product); }
  get discountPercent(): number { return discountPercent(this.product); }
  get promoEndsAt(): string | null { return this.product?.promotion?.ends_at ?? null; }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories = (data || []).map((cat: any) => ({
          ...cat,
          subCategories: cat.subCategories || cat.sub_categories || []
        }));
      },
      error: () => {
        console.error('Error loading categories');
      }
    });
  }

  getAllSubCategories(): SubCategory[] {
    const allSubs: SubCategory[] = [];
    this.categories.forEach(category => {
      const subs = category.subCategories || [];
      allSubs.push(...subs);
    });
    return allSubs;
  }

  /**
   * Populate the per-store quantity inputs from the product's current stock.
   * Uses `by_store` (which carries store id/name/qty) directly so it works even
   * if the separate stores fetch hasn't resolved yet.
   */
  private prefillStock(): void {
    const byStore = this.product.by_store || [];

    // If the stores list hasn't loaded, derive it from by_store so labels show.
    if (!this.stores.length && byStore.length) {
      this.stores = byStore.map((b) => ({
        id: b.store_id, name: b.store, city: b.city, slug: ''
      }));
    }

    this.productStock = {};
    this.stores.forEach((s) => {
      const row = byStore.find((b) => Number(b.store_id) === Number(s.id));
      this.productStock[s.id] = row ? Number(row.quantity) : 0;
    });
  }

  onEdit(): void {
    this.productName = this.product.name;
    this.productReference = this.product.reference;
    this.selectedSubCategoryId = this.product.sub_category_id;
    this.productPrice = this.product.price;
    this.productDescription = this.product.description;
    this.productImage = null;
    this.productImagePreview = this.product.image_url ? this.localUrl + this.product.image_url : null;
    this.prefillStock();
    this.showProductModal = true;
    this.adminMessage = '';
  }

  onDelete(): void {
    this.showDeleteConfirmModal = true;
  }

  closeProductModal(): void {
    this.showProductModal = false;
    this.productName = '';
    this.productReference = '';
    this.selectedSubCategoryId = null;
    this.productPrice = 0;
    this.productDescription = '';
    this.productImage = null;
    this.productImagePreview = null;
    this.adminMessage = '';
  }

  closeDeleteConfirmModal(): void {
    this.showDeleteConfirmModal = false;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.productImage = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.productImagePreview = e.target.result;
      };
      reader.readAsDataURL(this.productImage);
    }
  }

  submitProduct(): void {
    // Validate all required fields
    if (!this.productName || !this.productName.trim()) {
      this.adminMessage = 'Product name is required';
      this.adminMessageType = 'error';
      return;
    }
    if (!this.productReference || !this.productReference.trim()) {
      this.adminMessage = 'Product reference is required';
      this.adminMessageType = 'error';
      return;
    }
    if (!this.selectedSubCategoryId) {
      this.adminMessage = 'Sub-category is required';
      this.adminMessageType = 'error';
      return;
    }
    if (!this.productPrice || this.productPrice <= 0) {
      this.adminMessage = 'Valid price is required';
      this.adminMessageType = 'error';
      return;
    }
    if (!this.productDescription || !this.productDescription.trim()) {
      this.adminMessage = 'Product description is required';
      this.adminMessageType = 'error';
      return;
    }

    const formData = new FormData();
    formData.append('name', this.productName.trim());
    formData.append('reference', this.productReference.trim());
    formData.append('sub_category_id', this.selectedSubCategoryId.toString());
    formData.append('price', this.productPrice.toString());
    formData.append('description', this.productDescription.trim());
    this.stores.forEach((s) => {
      formData.append(`stock[${s.id}]`, String(this.productStock[s.id] ?? 0));
    });
    if (this.productImage) {
      formData.append('image', this.productImage);
    }

    this.productService.updateProduct(this.product.id, formData).subscribe({
      next: () => {
        this.adminMessage = 'Product updated successfully!';
        this.adminMessageType = 'success';
        // Tell the parent to re-fetch (no full page reload).
        this.productUpdated.emit();
        setTimeout(() => this.closeProductModal(), 900);
      },
      error: (err) => {
        this.adminMessage = err.error?.message || 'Failed to update product';
        this.adminMessageType = 'error';
      }
    });
  }

  executeDelete(): void {
    this.productService.deleteProduct(this.product.id).subscribe({
      next: () => {
        this.closeDeleteConfirmModal();
        this.productUpdated.emit();
        this.closeModal.emit();
      },
      error: (err) => {
        this.adminMessage = err.error?.message || 'Failed to delete product';
        this.adminMessageType = 'error';
        this.closeDeleteConfirmModal();
      }
    });
  }
  
  onClose(): void {
    this.closeModal.emit();  // Emit event to close the modal
  }

  toggleWishlist(): void {
    this.wishlistService.toggle(this.product);
  }

  isInWishlist(): boolean {
    return this.wishlistService.isInWishlist(this.product.id);
  }

  addToCart(): void {
    this.cartService.add(this.product, 1);
  }

  isInCart(): boolean {
    return this.cartService.isInCart(this.product.id);
  }
  
}
