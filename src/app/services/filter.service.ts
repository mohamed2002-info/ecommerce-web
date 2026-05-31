import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ProductFilter {
  minPrice: number;
  maxPrice: number;
  brands: string[];
  processors: string[];
  graphicCards: string[];
}

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  private filterSubject = new BehaviorSubject<ProductFilter>({
    minPrice: 0,
    maxPrice: 20000,
    brands: [],
    processors: [],
    graphicCards: []
  });
  public filter$: Observable<ProductFilter> = this.filterSubject.asObservable();

  constructor() {}

  setFilter(filter: ProductFilter): void {
    this.filterSubject.next(filter);
  }

  getFilter(): ProductFilter {
    return this.filterSubject.value;
  }

  clearFilter(): void {
    this.filterSubject.next({
      minPrice: 0,
      maxPrice: 20000,
      brands: [],
      processors: [],
      graphicCards: []
    });
  }
}

