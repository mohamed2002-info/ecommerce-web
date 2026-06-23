import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaginationService {
  private itemsPerPageSubject = new BehaviorSubject<number>(14);
  private currentPageSubject = new BehaviorSubject<number>(1);
  private totalItemsSubject = new BehaviorSubject<number>(0);
  
  public itemsPerPage$: Observable<number> = this.itemsPerPageSubject.asObservable();
  public currentPage$: Observable<number> = this.currentPageSubject.asObservable();
  public totalItems$: Observable<number> = this.totalItemsSubject.asObservable();

  constructor() {
    // Load pagination settings from sessionStorage if available
    const savedItemsPerPage = sessionStorage.getItem('itemsPerPage');
    if (savedItemsPerPage) {
      const itemsPerPage = parseInt(savedItemsPerPage, 10);
      if ([14, 25, 50].includes(itemsPerPage)) {
        this.itemsPerPageSubject.next(itemsPerPage);
      }
    }
    
    const savedPage = sessionStorage.getItem('currentPage');
    if (savedPage) {
      this.currentPageSubject.next(parseInt(savedPage, 10));
    }
  }

  setItemsPerPage(items: number): void {
    if ([14, 25, 50].includes(items)) {
      this.itemsPerPageSubject.next(items);
      sessionStorage.setItem('itemsPerPage', items.toString());
      // Reset to page 1 when changing items per page
      this.setCurrentPage(1);
    }
  }

  getItemsPerPage(): number {
    return this.itemsPerPageSubject.value;
  }

  setCurrentPage(page: number): void {
    if (page >= 1) {
      this.currentPageSubject.next(page);
      sessionStorage.setItem('currentPage', page.toString());
    }
  }

  getCurrentPage(): number {
    return this.currentPageSubject.value;
  }

  getTotalPages(totalItems: number): number {
    const itemsPerPage = this.getItemsPerPage();
    return Math.ceil(totalItems / itemsPerPage);
  }

  setTotalItems(total: number): void {
    this.totalItemsSubject.next(total);
  }

  getTotalItems(): number {
    return this.totalItemsSubject.value;
  }

  getPaginatedItems<T>(items: T[]): T[] {
    const itemsPerPage = this.getItemsPerPage();
    const currentPage = this.getCurrentPage();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    // Update total items when paginating
    this.setTotalItems(items.length);
    return items.slice(startIndex, endIndex);
  }
}

