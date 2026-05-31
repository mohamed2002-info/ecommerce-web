import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Product } from '../Models/product.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = environment.apiUrl;
  private cartSubject = new BehaviorSubject<{ id: number; quantity: number; product?: Product }[]>([]);
  public cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadFromApi();
  }

  add(product: Product, quantity: number = 1): void {
    const userId = this.getUserId();
    if (!userId) return;

    this.http
      .post(`${this.apiUrl}/cart`, {
        user_id: userId,
        product_id: product.id,
        quantity
      })
      .subscribe(() => this.loadFromApi());
  }

  update(productId: number, quantity: number): void {
    const userId = this.getUserId();
    if (!userId) return;

    this.http
      .put(`${this.apiUrl}/cart/${productId}`, {
        user_id: userId,
        quantity
      })
      .subscribe(() => this.loadFromApi());
  }

  remove(productId: number): void {
    const userId = this.getUserId();
    if (!userId) return;

    this.http
      .delete(`${this.apiUrl}/cart/${productId}`, {
        params: { user_id: userId }
      })
      .subscribe(() => this.loadFromApi());
  }

  clear(): void {
    const userId = this.getUserId();
    if (!userId) return;

    this.http
      .delete(`${this.apiUrl}/cart`, { params: { user_id: userId } })
      .subscribe(() => this.loadFromApi());
  }

  getCount(): number {
    return this.cartSubject.value.reduce((sum, item) => sum + item.quantity, 0);
  }

  isInCart(productId: number): boolean {
    return this.cartSubject.value.some(item => item.id === productId);
  }

  confirmOrder(): Observable<any> {
    const userId = this.getUserId();
    if (!userId) {
      return new Observable(observer => {
        observer.error({ message: 'User not logged in' });
      });
    }

    return this.http.post(`${this.apiUrl}/orders/confirm`, {
      user_id: userId
    });
  }

  reload(): void {
    this.loadFromApi();
  }

  private loadFromApi(): void {
    const userId = this.getUserId();
    if (!userId) {
      this.cartSubject.next([]);
      return;
    }

    this.http
      .get<{ items: { product_id: number; quantity: number; product?: Product }[] }>(`${this.apiUrl}/cart`, {
        params: { user_id: userId }
      })
      .subscribe({
        next: (res) => {
          const items = (res.items || []).map(i => ({
            id: i.product_id,
            quantity: i.quantity,
            product: i.product
          }));
          this.cartSubject.next(items);
        },
        error: () => {
          this.cartSubject.next([]);
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


