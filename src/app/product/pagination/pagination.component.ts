import { Component, OnInit } from '@angular/core';
import { PaginationService } from '../../services/pagination.service';
import { ProductService } from '../../services/product.service';
import { SearchService, CategoryFilter } from '../../services/search.service';
import { Product } from '../../Models/product.model';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css']
})
export class PaginationComponent implements OnInit {
  itemsPerPage: number = 14;
  currentPage: number = 1;
  totalPages: number = 1;
  totalItems: number = 0;
  pageSizeOptions: number[] = [14, 25, 50];
  allProducts: Product[] = [];
  categoryFilter: CategoryFilter = this.searchService.getCategoryFilter();

  constructor(
    private paginationService: PaginationService,
    private productService: ProductService,
    private searchService: SearchService
  ) {}

  ngOnInit(): void {
    // Get all products
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.allProducts = products;
        this.updateTotalItems();
      },
      error: (err) => {
        console.error('Error fetching products for pagination:', err);
      }
    });

    // Subscribe to search changes
    this.searchService.searchTerm$.subscribe(() => {
      this.updateTotalItems();
    });

    this.searchService.categoryFilter$.subscribe((filter) => {
      this.categoryFilter = filter;
      this.updateTotalItems();
    });

    // Subscribe to pagination service
    this.paginationService.itemsPerPage$.subscribe(items => {
      this.itemsPerPage = items;
      this.calculateTotalPages();
    });

    this.paginationService.currentPage$.subscribe(page => {
      this.currentPage = page;
    });
  }

  updateTotalItems(): void {
    const searchTerm = this.searchService.getSearchTerm().toLowerCase().trim();
    const filter = this.searchService.getCategoryFilter();
    let base = this.allProducts;

    if (filter?.subCategoryId) {
      base = base.filter(product => product.sub_category_id === filter.subCategoryId);
    } else if (filter?.subCategoryIds && filter.subCategoryIds.length) {
      base = base.filter(product => filter.subCategoryIds.includes(product.sub_category_id));
    }
    
    if (!searchTerm) {
      this.totalItems = base.length;
    } else {
      this.totalItems = base.filter(product => {
        return (
          product.name.toLowerCase().includes(searchTerm) ||
          product.reference.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm) ||
          product.price.toString().includes(searchTerm)
        );
      }).length;
    }
    
    this.calculateTotalPages();
  }

  calculateTotalPages(): void {
    this.totalPages = this.paginationService.getTotalPages(this.totalItems);
    // If current page is beyond total pages, reset to page 1
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.paginationService.setCurrentPage(1);
    }
  }

  onItemsPerPageChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = parseInt(target.value, 10);
    this.paginationService.setItemsPerPage(value);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.paginationService.setCurrentPage(page);
    }
  }

  goToFirstPage(): void {
    this.goToPage(1);
  }

  goToLastPage(): void {
    this.goToPage(this.totalPages);
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }
}

