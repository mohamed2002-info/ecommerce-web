import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Promotion, PromotionPayload, PromotionStatus } from '../Models/promotion.model';

/** Slim, customer-safe promotion shape for the public banner. */
export interface ActivePromotion {
  id: number;
  name: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  value: number;
  ends_at: string | null;
}

/**
 * Admin-only promotion management. All endpoints require an admin token, which
 * the AuthInterceptor attaches automatically.
 */
@Injectable({ providedIn: 'root' })
export class PromotionService {
  private apiUrl = `${environment.apiUrl}/promotions`;

  constructor(private http: HttpClient) {}

  list(): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(this.apiUrl);
  }

  /** Public: currently-live promotions for the storefront banner. */
  active(): Observable<ActivePromotion[]> {
    return this.http.get<ActivePromotion[]>(`${this.apiUrl}/active`);
  }

  get(id: number): Observable<Promotion> {
    return this.http.get<Promotion>(`${this.apiUrl}/${id}`);
  }

  create(payload: PromotionPayload): Observable<any> {
    return this.http.post(this.apiUrl, payload);
  }

  update(id: number, payload: PromotionPayload): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, payload);
  }

  setStatus(id: number, status: PromotionStatus): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/status`, { status });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
