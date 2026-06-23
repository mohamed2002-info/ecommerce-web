import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Product } from '../Models/product.model';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

const GUEST_KEY = 'guestWishlist';

/**
 * Wishlist for guests AND logged-in users.
 * Guests store product ids in localStorage; on login they're merged to the
 * server wishlist and cleared.
 */
@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private apiUrl = environment.apiUrl;
  private wishlistSubject = new BehaviorSubject<number[]>([]);
  public wishlist$ = this.wishlistSubject.asObservable();

  constructor(private http: HttpClient, private auth: AuthService) {
    this.auth.user$.subscribe((user) => {
      if (user) {
        this.mergeGuestThenLoad();
      } else {
        this.wishlistSubject.next(this.readGuest());
      }
    });
  }

  toggle(product: Product): void {
    if (this.auth.isLoggedIn()) {
      this.http
        .post(`${this.apiUrl}/wishlist/toggle`, { product_id: product.id })
        .subscribe(() => this.loadFromApi());
      return;
    }
    const ids = this.readGuest();
    const idx = ids.indexOf(product.id);
    if (idx >= 0) {
      ids.splice(idx, 1);
    } else {
      ids.push(product.id);
    }
    this.writeGuest(ids);
  }

  remove(productId: number): void {
    if (this.auth.isLoggedIn()) {
      this.http
        .delete(`${this.apiUrl}/wishlist/${productId}`)
        .subscribe(() => this.loadFromApi());
      return;
    }
    this.writeGuest(this.readGuest().filter((id) => id !== productId));
  }

  isInWishlist(productId: number): boolean {
    return this.wishlistSubject.value.includes(productId);
  }

  getIds(): number[] {
    return [...this.wishlistSubject.value];
  }

  getCount(): number {
    return this.wishlistSubject.value.length;
  }

  clear(): void {
    if (this.auth.isLoggedIn()) {
      this.http
        .delete(`${this.apiUrl}/wishlist`)
        .subscribe(() => this.loadFromApi());
      return;
    }
    this.writeGuest([]);
  }

  private loadFromApi(): void {
    if (!this.auth.isLoggedIn()) {
      this.wishlistSubject.next(this.readGuest());
      return;
    }

    this.http
      .get<{ items: { product_id: number }[] }>(`${this.apiUrl}/wishlist`)
      .subscribe({
        next: (res) => this.wishlistSubject.next((res.items || []).map(i => i.product_id)),
        error: () => this.wishlistSubject.next([])
      });
  }

  private mergeGuestThenLoad(): void {
    const guest = this.readGuest();
    if (guest.length === 0) {
      this.loadFromApi();
      return;
    }
    let remaining = guest.length;
    const done = () => {
      if (--remaining <= 0) {
        localStorage.removeItem(GUEST_KEY);
        this.loadFromApi();
      }
    };
    guest.forEach((id) =>
      this.http.post(`${this.apiUrl}/wishlist`, { product_id: id }).subscribe({ next: done, error: done })
    );
  }

  private readGuest(): number[] {
    try {
      const raw = localStorage.getItem(GUEST_KEY);
      return raw ? (JSON.parse(raw) as number[]) : [];
    } catch {
      return [];
    }
  }

  private writeGuest(ids: number[]): void {
    localStorage.setItem(GUEST_KEY, JSON.stringify(ids));
    this.wishlistSubject.next(ids);
  }
}
