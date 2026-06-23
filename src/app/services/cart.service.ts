import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Product } from '../Models/product.model';
import { AuthService } from './auth.service';

interface CartLine {
  id: number;          // product id
  quantity: number;
  product?: Product;
  unitPrice?: number;  // server-computed (promo-aware) unit price when logged in
}

const GUEST_KEY = 'guestCart';

/**
 * Cart that works for guests AND logged-in users.
 *
 * - Guest: items live in localStorage so anyone can browse and add to cart
 *   without an account. Pricing is derived from the product's promo fields.
 * - Logged in: items live on the server (promotion-aware, authoritative).
 *
 * On login, the guest cart is merged into the server cart and cleared.
 */
@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = environment.apiUrl;
  private cartSubject = new BehaviorSubject<CartLine[]>([]);
  public cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient, private auth: AuthService) {
    this.auth.user$.subscribe((user) => {
      if (user) {
        // Merge any guest cart into the server, then load the server cart.
        this.mergeGuestCartThenLoad();
      } else {
        // Logged out (or initial guest load): show the local guest cart.
        this.cartSubject.next(this.readGuest());
      }
    });
  }

  add(product: Product, quantity: number = 1): void {
    if (this.auth.isLoggedIn()) {
      this.http
        .post(`${this.apiUrl}/cart`, { product_id: product.id, quantity })
        .subscribe(() => this.loadFromApi());
      return;
    }
    // Guest: update localStorage.
    const items = this.readGuest();
    const existing = items.find((i) => i.id === product.id);
    if (existing) {
      existing.quantity += quantity;
      existing.product = product;
    } else {
      items.push({ id: product.id, quantity, product });
    }
    this.writeGuest(items);
  }

  update(productId: number, quantity: number): void {
    if (this.auth.isLoggedIn()) {
      this.http
        .put(`${this.apiUrl}/cart/${productId}`, { quantity })
        .subscribe(() => this.loadFromApi());
      return;
    }
    const items = this.readGuest();
    const item = items.find((i) => i.id === productId);
    if (item) {
      item.quantity = quantity;
      this.writeGuest(items);
    }
  }

  remove(productId: number): void {
    if (this.auth.isLoggedIn()) {
      this.http
        .delete(`${this.apiUrl}/cart/${productId}`)
        .subscribe(() => this.loadFromApi());
      return;
    }
    this.writeGuest(this.readGuest().filter((i) => i.id !== productId));
  }

  clear(): void {
    if (this.auth.isLoggedIn()) {
      this.http
        .delete(`${this.apiUrl}/cart`)
        .subscribe(() => this.loadFromApi());
      return;
    }
    this.writeGuest([]);
  }

  getCount(): number {
    return this.cartSubject.value.reduce((sum, item) => sum + item.quantity, 0);
  }

  isInCart(productId: number): boolean {
    return this.cartSubject.value.some(item => item.id === productId);
  }

  /** True when there is anything to check out. */
  hasItems(): boolean {
    return this.cartSubject.value.length > 0;
  }

  confirmOrder(): Observable<any> {
    // Checkout always requires a logged-in user (enforced by the backend too).
    if (!this.auth.isLoggedIn()) {
      return new Observable(observer => {
        observer.error({ status: 401, message: 'Please log in to complete your order.' });
      });
    }
    return this.http.post(`${this.apiUrl}/orders/confirm`, {});
  }

  reload(): void {
    if (this.auth.isLoggedIn()) {
      this.loadFromApi();
    } else {
      this.cartSubject.next(this.readGuest());
    }
  }

  // ---- server cart ----
  private loadFromApi(): void {
    if (!this.auth.isLoggedIn()) {
      this.cartSubject.next(this.readGuest());
      return;
    }

    this.http
      .get<{ items: { product_id: number; quantity: number; product?: Product; unit_price?: number }[] }>(`${this.apiUrl}/cart`)
      .subscribe({
        next: (res) => {
          const items = (res.items || []).map(i => ({
            id: i.product_id,
            quantity: i.quantity,
            product: i.product,
            unitPrice: i.unit_price
          }));
          this.cartSubject.next(items);
        },
        error: () => this.cartSubject.next([])
      });
  }

  /** On login: push guest items to the server, clear guest cart, then load. */
  private mergeGuestCartThenLoad(): void {
    const guest = this.readGuest();
    if (guest.length === 0) {
      this.loadFromApi();
      return;
    }

    const requests = guest.map((i) =>
      this.http.post(`${this.apiUrl}/cart`, { product_id: i.id, quantity: i.quantity })
    );

    let remaining = requests.length;
    const done = () => {
      if (--remaining <= 0) {
        localStorage.removeItem(GUEST_KEY);
        this.loadFromApi();
      }
    };
    requests.forEach((req) => req.subscribe({ next: done, error: done }));
  }

  // ---- guest cart (localStorage) ----
  private readGuest(): CartLine[] {
    try {
      const raw = localStorage.getItem(GUEST_KEY);
      return raw ? (JSON.parse(raw) as CartLine[]) : [];
    } catch {
      return [];
    }
  }

  private writeGuest(items: CartLine[]): void {
    localStorage.setItem(GUEST_KEY, JSON.stringify(items));
    this.cartSubject.next(items);
  }
}
