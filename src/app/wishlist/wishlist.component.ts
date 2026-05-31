import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Product } from '../Models/product.model';
import { ProductService } from '../services/product.service';
import { WishlistService } from '../services/wishlist.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-wishlist',
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.css']
})
export class WishlistComponent implements OnInit, OnDestroy {
  wishlistProducts: Product[] = [];
  allProducts: Product[] = [];
  isLoading = false;
  errorMessage = '';
  selectedProduct: Product | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private productService: ProductService,
    private wishlistService: WishlistService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    const subProducts = this.productService.getProducts().subscribe({
      next: (products) => {
        this.allProducts = products;
        this.refreshWishlistProducts();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load products right now.';
        this.isLoading = false;
      }
    });

    const subWishlist = this.wishlistService.wishlist$.subscribe(() => {
      this.refreshWishlistProducts();
    });

    this.subscriptions.push(subProducts, subWishlist);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  remove(productId: number): void {
    this.wishlistService.remove(productId);
  }

  clear(): void {
    this.wishlistService.clear();
  }

  viewProductDetails(product: Product): void {
    this.selectedProduct = product;
  }

  closeProductDetails(): void {
    this.selectedProduct = null;
  }

  isEmpty(): boolean {
    return !this.isLoading && this.wishlistProducts.length === 0;
  }

  goToProducts(): void {
    this.router.navigate(['/home']);
  }

  private refreshWishlistProducts(): void {
    const ids = new Set(this.wishlistService.getIds());
    this.wishlistProducts = this.allProducts.filter(p => ids.has(p.id));
  }
}

