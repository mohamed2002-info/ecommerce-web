import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CategoryFilter {
  categoryId: number | null;
  subCategoryId: number | null;
  subCategoryIds: number[];
}

export type SortOption = 'relevance' | 'priceAsc' | 'priceDesc' | 'nameAsc' | 'nameDesc';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private searchTermSubject = new BehaviorSubject<string>('');
  public searchTerm$: Observable<string> = this.searchTermSubject.asObservable();

  private categoryFilterSubject = new BehaviorSubject<CategoryFilter>({
    categoryId: null,
    subCategoryId: null,
    subCategoryIds: []
  });
  public categoryFilter$: Observable<CategoryFilter> = this.categoryFilterSubject.asObservable();

  private sortOptionSubject = new BehaviorSubject<SortOption>('relevance');
  public sortOption$: Observable<SortOption> = this.sortOptionSubject.asObservable();

  private productCountSubject = new BehaviorSubject<number>(0);
  public productCount$: Observable<number> = this.productCountSubject.asObservable();

  constructor() {}

  setSearchTerm(term: string): void {
    this.searchTermSubject.next(term);
  }

  getSearchTerm(): string {
    return this.searchTermSubject.value;
  }

  clearSearch(): void {
    this.searchTermSubject.next('');
  }

  setCategoryFilter(filter: CategoryFilter): void {
    this.categoryFilterSubject.next(filter);
  }

  getCategoryFilter(): CategoryFilter {
    return this.categoryFilterSubject.value;
  }

  clearCategoryFilter(): void {
    this.categoryFilterSubject.next({
      categoryId: null,
      subCategoryId: null,
      subCategoryIds: []
    });
  }

  setSortOption(option: SortOption): void {
    this.sortOptionSubject.next(option);
  }

  getSortOption(): SortOption {
    return this.sortOptionSubject.value;
  }

  setProductCount(count: number): void {
    this.productCountSubject.next(count);
  }

  getProductCount(): number {
    return this.productCountSubject.value;
  }
}

