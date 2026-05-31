import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Get all products
  getProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/products`);
  }

  // Create a new product
  createProduct(productData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/products`, productData);
  }

  // Update a product
  updateProduct(id: number, productData: FormData): Observable<any> {
    // Use POST with method spoofing for FormData compatibility
    productData.append('_method', 'PUT');
    return this.http.post<any>(`${this.apiUrl}/products/${id}`, productData);
  }

  // Delete a product
  deleteProduct(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/products/${id}`);
  }
}
