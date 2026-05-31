import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SubCategory } from '../Models/category.model';

@Injectable({
  providedIn: 'root'
})
export class SubCategoryService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getSubCategories(): Observable<SubCategory[]> {
    return this.http.get<SubCategory[]>(`${this.apiUrl}/sub-categories`);
  }

  createSubCategory(name: string, categoryId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/sub-categories`, { 
      name, 
      category_id: categoryId 
    });
  }

  updateSubCategory(id: number, name: string, categoryId: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/sub-categories/${id}`, {
      name,
      category_id: categoryId
    });
  }

  deleteSubCategory(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/sub-categories/${id}`);
  }
}

