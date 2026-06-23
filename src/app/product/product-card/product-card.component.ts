import { Component, EventEmitter, Input, Output } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Product } from 'src/app/Models/product.model';
import { WishlistService } from '../../services/wishlist.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { CURRENCY, discountPercent, effectivePrice, isOnSale, listPrice } from '../../shared/price.util';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css']
})
export class ProductCardComponent {

  @Input() product!: Product;
  @Output() productSelected = new EventEmitter<Product>();
  @Output() editProduct = new EventEmitter<Product>();
  @Output() deleteProduct = new EventEmitter<Product>();
  localUrl = environment.localUrl;
  isAdmin: boolean = false;
  currency = CURRENCY;

  constructor(
    private wishlistService: WishlistService,
    private cartService: CartService,
    private auth: AuthService
  ) {
    this.isAdmin = this.auth.isAdmin();
    this.auth.user$.subscribe(() => (this.isAdmin = this.auth.isAdmin()));
  }

  // Promotion display helpers (delegate to shared price utilities).
  get onSale(): boolean { return isOnSale(this.product); }
  get price(): number { return effectivePrice(this.product); }
  get original(): number { return listPrice(this.product); }
  get discountPercent(): number { return discountPercent(this.product); }
  get promoEndsAt(): string | null { return this.product?.promotion?.ends_at ?? null; }

  // Stock / availability helpers.
  get inStock(): boolean {
    // If the backend didn't send stock info, don't block (treat as available).
    return this.product?.in_stock !== false;
  }
  get totalStock(): number { return this.product?.total_stock ?? 0; }
  get availableCities(): string[] { return this.product?.available_stores ?? []; }
  /** "Low stock" hint when few units remain. */
  get lowStock(): boolean { return this.inStock && this.totalStock > 0 && this.totalStock <= 5; }

  onProductClick(): void {
    this.productSelected.emit(this.product);
  }

  toggleWishlist(event: MouseEvent): void {
    event.stopPropagation();
    this.wishlistService.toggle(this.product);
  }

  isInWishlist(): boolean {
    return this.wishlistService.isInWishlist(this.product.id);
  }

  addToCart(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.inStock) {
      return; // out of stock — guard (button is also disabled in the template)
    }
    this.cartService.add(this.product, 1);
  }

  isInCart(): boolean {
    return this.cartService.isInCart(this.product.id);
  }

  onEdit(event: MouseEvent): void {
    event.stopPropagation();
    this.editProduct.emit(this.product);
  }

  onDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.deleteProduct.emit(this.product);
  }
}
