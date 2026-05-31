import { Component, EventEmitter, Input, Output } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Product } from 'src/app/Models/product.model';
import { WishlistService } from '../../services/wishlist.service';
import { CartService } from '../../services/cart.service';

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

  constructor(
    private wishlistService: WishlistService,
    private cartService: CartService
  ) {
    this.isAdmin = this.checkIfAdmin();
  }

  private checkIfAdmin(): boolean {
    const role = sessionStorage.getItem('userRole');
    if (role) {
      return role.toLowerCase() === 'admin';
    }
    const loginResponse = sessionStorage.getItem('loginResponse');
    if (loginResponse) {
      try {
        const parsed = JSON.parse(loginResponse);
        const userRole = parsed?.user?.role || parsed?.role || parsed?.data?.user?.role || parsed?.data?.role;
        if (userRole) {
          return userRole.toLowerCase() === 'admin';
        }
      } catch (e) {
        // ignore parse errors
      }
    }
    return false;
  }

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
