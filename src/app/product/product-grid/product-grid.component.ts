import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product.service'; // Import the product service
import { Product } from 'src/app/Models/product.model';
import { PaginationService } from '../../services/pagination.service';
import { SearchService, CategoryFilter, SortOption } from '../../services/search.service';

@Component({
  selector: 'app-product-grid',
  templateUrl: './product-grid.component.html',
  styleUrls: ['./product-grid.component.css']
})
export class ProductGridComponent implements OnInit {

  allProducts: Product[] = [];  // All products from API
  filteredProducts: Product[] = [];  // Filtered products based on search
  products: Product[] = [];  // Paginated products to display
  selectedProduct: Product | null = null;
  categoryFilter: CategoryFilter = this.searchService.getCategoryFilter();
  sortOption: SortOption = this.searchService.getSortOption();

  constructor(
    private productService: ProductService,
    private paginationService: PaginationService,
    private searchService: SearchService
  ) { }

  ngOnInit(): void {
    // Fetch products when the component initializes
    this.productService.getProducts().subscribe({
      next: (response) => {
        this.allProducts = response;  // Store all products
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error fetching products:', err);
      }
    });

    // Subscribe to search changes
    this.searchService.searchTerm$.subscribe(() => {
      this.applyFilters();
    });

    this.searchService.categoryFilter$.subscribe((filter) => {
      this.categoryFilter = filter;
      this.applyFilters();
    });

    this.searchService.sortOption$.subscribe((sort) => {
      this.sortOption = sort;
      this.applyFilters();
    });

    // Subscribe to pagination changes
    this.paginationService.itemsPerPage$.subscribe(() => {
      this.updatePaginatedProducts();
    });

    this.paginationService.currentPage$.subscribe(() => {
      this.updatePaginatedProducts();
    });
  }

  applyFilters(): void {
    const searchTerm = this.searchService.getSearchTerm().toLowerCase().trim();
    const filter = this.searchService.getCategoryFilter();
    let base = this.allProducts;

    // Apply category / sub-category filters
    if (filter?.subCategoryId) {
      base = base.filter(product => product.sub_category_id === filter.subCategoryId);
    } else if (filter?.subCategoryIds && filter.subCategoryIds.length) {
      base = base.filter(product => filter.subCategoryIds.includes(product.sub_category_id));
    }

    base = this.applySorting(base, this.searchService.getSortOption());
    
    if (!searchTerm) {
      this.filteredProducts = base;
    } else {
      this.filteredProducts = base.filter(product => {
        return (
          product.name.toLowerCase().includes(searchTerm) ||
          product.reference.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm) ||
          product.price.toString().includes(searchTerm)
        );
      });
    }
    
    // Reset to page 1 when filtering
    this.paginationService.setCurrentPage(1);
    this.updatePaginatedProducts();
    this.searchService.setProductCount(this.filteredProducts.length);
  }

  updatePaginatedProducts(): void {
    this.products = this.paginationService.getPaginatedItems(this.filteredProducts);
  }

  viewProductDetails(product: Product): void {
    this.selectedProduct = product;
  }

  closeProductDetails(): void {
    this.selectedProduct = null;
  }

  private applySorting(items: Product[], sort: SortOption): Product[] {
    const sorted = [...items];
    switch (sort) {
      case 'priceAsc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'priceDesc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'nameAsc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'nameDesc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'relevance':
      default:
        break;
    }
    return sorted;
  }
}
