import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CartService } from '../services/cart.service';
import { Product } from '../Models/product.model';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

type CartItem = { id: number; quantity: number; product?: Product };

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit, OnDestroy {
  items: CartItem[] = [];
  private subscriptions: Subscription[] = [];
  localUrl = environment.localUrl;
  successMessage: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;
  showConfirmModal: boolean = false;

  constructor(
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const sub = this.cartService.cart$.subscribe((items) => {
      this.items = items;
    });
    this.subscriptions.push(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  increment(item: CartItem): void {
    this.cartService.update(item.id, item.quantity + 1);
  }

  decrement(item: CartItem): void {
    if (item.quantity > 1) {
      this.cartService.update(item.id, item.quantity - 1);
    } else {
      this.cartService.remove(item.id);
    }
  }

  remove(item: CartItem): void {
    this.cartService.remove(item.id);
  }

  clear(): void {
    this.cartService.clear();
  }

  goToProducts(): void {
    this.router.navigate(['/home']);
  }

  get totalCount(): number {
    return this.items.reduce((sum, i) => sum + i.quantity, 0);
  }

  get totalPrice(): number {
    return this.items.reduce((sum, i) => sum + (i.product?.price || 0) * i.quantity, 0);
  }

  hasItems(): boolean {
    return this.items.length > 0;
  }

  openConfirmModal(): void {
    if (!this.hasItems()) {
      this.errorMessage = 'Your cart is empty. Please add items before confirming your order.';
      setTimeout(() => this.errorMessage = '', 5000);
      return;
    }
    this.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
  }

  confirmOrder(): void {
    this.showConfirmModal = false;
    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.cartService.confirmOrder().subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage = response.message || 'Order confirmed successfully! A confirmation email has been sent to your inbox.';
          // Reload cart to reflect the cleared state
          this.cartService.reload();
          // Clear messages after 5 seconds
          setTimeout(() => {
            this.successMessage = '';
          }, 5000);
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'An error occurred while confirming your order. Please try again.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }
}


