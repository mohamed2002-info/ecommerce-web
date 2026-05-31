import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Product } from '../Models/product.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private apiUrl = environment.apiUrl;
  private wishlistSubject = new BehaviorSubject<number[]>([]);
  public wishlist$ = this.wishlistSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadFromApi();
  }

  toggle(product: Product): void {
    const userId = this.getUserId();
    if (!userId) return;

    this.http
      .post(`${this.apiUrl}/wishlist/toggle`, {
        user_id: userId,
        product_id: product.id
      })
      .subscribe(() => this.loadFromApi());
  }

  remove(productId: number): void {
    const userId = this.getUserId();
    if (!userId) return;

    this.http
      .delete(`${this.apiUrl}/wishlist/${productId}`, {
        params: { user_id: userId }
      })
      .subscribe(() => this.loadFromApi());
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
    const userId = this.getUserId();
    if (!userId) return;

    this.http
      .delete(`${this.apiUrl}/wishlist`, { params: { user_id: userId } })
      .subscribe(() => this.loadFromApi());
  }

  private loadFromApi(): void {
    const userId = this.getUserId();
    if (!userId) {
      this.wishlistSubject.next([]);
      return;
    }

    this.http
      .get<{ items: { product_id: number }[] }>(`${this.apiUrl}/wishlist`, {
        params: { user_id: userId }
      })
      .subscribe({
        next: (res) => {
          const ids = (res.items || []).map(item => item.product_id);
          this.wishlistSubject.next(ids);
        },
        error: () => {
          this.wishlistSubject.next([]);
        }
      });
  }

  private getUserId(): number | null {
    const stored = sessionStorage.getItem('userId');
    if (stored && !Number.isNaN(+stored)) {
      return +stored;
    }
    const loginResponse = sessionStorage.getItem('loginResponse');
    if (loginResponse) {
      try {
        const parsed = JSON.parse(loginResponse);
        const id =
          parsed?.user?.id ??
          parsed?.data?.user?.id ??
          parsed?.id;
        if (id && !Number.isNaN(+id)) {
          return +id;
        }
      } catch {
        return null;
      }
    }
    return null;
  }
}
