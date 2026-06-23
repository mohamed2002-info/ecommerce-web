import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ProductService } from '../../services/product.service'; // Import the product service
import { Product } from 'src/app/Models/product.model';
import { PaginationService } from '../../services/pagination.service';
import { SearchService, CategoryFilter, SortOption } from '../../services/search.service';
import { FilterService } from '../../services/filter.service';
import { CategoryService } from '../../services/category.service';
import { SubCategoryService } from '../../services/subcategory.service';
import { Category, SubCategory } from '../../Models/category.model';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { StoreService, Store } from '../../services/store.service';

@Component({
  selector: 'app-product-grid',
  templateUrl: './product-grid.component.html',
  styleUrls: ['./product-grid.component.css']
})
export class ProductGridComponent implements OnInit, OnDestroy {

  allProducts: Product[] = [];  // All products from API
  filteredProducts: Product[] = [];  // Filtered products based on search
  products: Product[] = [];  // Paginated products to display
  selectedProduct: Product | null = null;
  categoryFilter: CategoryFilter = this.searchService.getCategoryFilter();
  sortOption: SortOption = this.searchService.getSortOption();
  
  // Admin states
  isAdmin: boolean = false;
  showProductModal: boolean = false;
  showDeleteConfirmModal: boolean = false;
  productToDelete: Product | null = null;
  categories: Category[] = [];
  
  // Product form data
  editingProductId: number | null = null;
  productName: string = '';
  productReference: string = '';
  selectedSubCategoryId: number | null = null;
  productPrice: number = 0;
  productDescription: string = '';
  productImage: File | null = null;
  productImagePreview: string | null = null;
  adminMessage: string = '';
  adminMessageType: 'success' | 'error' = 'success';
  // Per-store stock for the edit form: { storeId: quantity }
  stores: Store[] = [];
  productStock: { [storeId: number]: number } = {};
  private subscriptions: Subscription[] = [];

  constructor(
    private productService: ProductService,
    private paginationService: PaginationService,
    private searchService: SearchService,
    private filterService: FilterService,
    private categoryService: CategoryService,
    private subCategoryService: SubCategoryService,
    private auth: AuthService,
    private storeService: StoreService
  ) {
    this.isAdmin = this.auth.isAdmin();
    this.subscriptions.push(
      this.auth.user$.subscribe(() => (this.isAdmin = this.auth.isAdmin()))
    );
  }

  ngOnInit(): void {
    this.refreshProducts();

    // Load boutiques for the admin per-store stock inputs.
    if (this.isAdmin) {
      this.storeService.list().subscribe({
        next: (stores) => (this.stores = stores || []),
        error: () => (this.stores = [])
      });
    }

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

    // Subscribe to filter changes
    const filterSub = this.filterService.filter$.subscribe(() => {
      this.applyFilters();
    });
    this.subscriptions.push(filterSub);

    if (this.isAdmin) {
      this.loadCategories();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  /** Re-fetch products from the API and re-apply current filters (fast,
   *  in-place refresh instead of a full page reload). */
  refreshProducts(): void {
    this.productService.getProducts().subscribe({
      next: (response) => {
        this.allProducts = response;
        this.applyFilters();
      },
      error: (err) => console.error('Error fetching products:', err)
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories = (data || []).map((cat: any) => ({
          ...cat,
          subCategories: cat.subCategories || cat.sub_categories || []
        }));
      },
      error: () => {
        console.error('Error loading categories');
      }
    });
  }

  getAllSubCategories(): SubCategory[] {
    const allSubs: SubCategory[] = [];
    this.categories.forEach(category => {
      const subs = category.subCategories || [];
      allSubs.push(...subs);
    });
    return allSubs;
  }

  applyFilters(): void {
    const searchTerm = this.searchService.getSearchTerm().toLowerCase().trim();
    const filter = this.searchService.getCategoryFilter();
    const productFilter = this.filterService.getFilter();
    let base = this.allProducts;

    // Apply category / sub-category filters
    if (filter?.subCategoryId) {
      base = base.filter(product => product.sub_category_id === filter.subCategoryId);
    } else if (filter?.subCategoryIds && filter.subCategoryIds.length) {
      base = base.filter(product => filter.subCategoryIds.includes(product.sub_category_id));
    }

    // Apply price filter
    base = base.filter(product => 
      product.price >= productFilter.minPrice && 
      product.price <= productFilter.maxPrice
    );

    // Apply brand filter (search in name and description)
    if (productFilter.brands.length > 0) {
      base = base.filter(product => {
        const productText = (product.name + ' ' + product.description).toLowerCase();
        return productFilter.brands.some(brand => 
          productText.includes(brand.toLowerCase())
        );
      });
    }

    // Apply processor filter (search in name and description)
    if (productFilter.processors.length > 0) {
      base = base.filter(product => {
        const productText = (product.name + ' ' + product.description).toLowerCase();
        return productFilter.processors.some(processor => 
          productText.includes(processor.toLowerCase())
        );
      });
    }

    // Apply graphic card filter (search in name and description)
    if (productFilter.graphicCards.length > 0) {
      base = base.filter(product => {
        const productText = (product.name + ' ' + product.description).toLowerCase();
        return productFilter.graphicCards.some(card => 
          productText.includes(card.toLowerCase())
        );
      });
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

  onEditProduct(product: Product): void {
    this.editingProductId = product.id;
    this.productName = product.name;
    this.productReference = product.reference;
    this.selectedSubCategoryId = product.sub_category_id;
    this.productPrice = product.price;
    this.productDescription = product.description;
    this.productImage = null;
    this.productImagePreview = product.image_url ? environment.localUrl + product.image_url : null;
    this.prefillStock(product);
    this.showProductModal = true;
    this.adminMessage = '';
  }

  /** Fill the per-store quantity inputs from the product's current stock. */
  private prefillStock(product: Product): void {
    const byStore = product.by_store || [];
    if (!this.stores.length && byStore.length) {
      this.stores = byStore.map((b) => ({ id: b.store_id, name: b.store, city: b.city, slug: '' }));
    }
    this.productStock = {};
    this.stores.forEach((s) => {
      const row = byStore.find((b) => Number(b.store_id) === Number(s.id));
      this.productStock[s.id] = row ? Number(row.quantity) : 0;
    });
  }

  onDeleteProduct(product: Product): void {
    this.productToDelete = product;
    this.showDeleteConfirmModal = true;
  }

  closeProductModal(): void {
    this.showProductModal = false;
    this.editingProductId = null;
    this.productName = '';
    this.productReference = '';
    this.selectedSubCategoryId = null;
    this.productPrice = 0;
    this.productDescription = '';
    this.productImage = null;
    this.productImagePreview = null;
    this.adminMessage = '';
  }

  closeDeleteConfirmModal(): void {
    this.showDeleteConfirmModal = false;
    this.productToDelete = null;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.productImage = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.productImagePreview = e.target.result;
      };
      reader.readAsDataURL(this.productImage);
    }
  }

  submitProduct(): void {
    // Validate all required fields
    if (!this.productName || !this.productName.trim()) {
      this.adminMessage = 'Product name is required';
      this.adminMessageType = 'error';
      return;
    }
    if (!this.productReference || !this.productReference.trim()) {
      this.adminMessage = 'Product reference is required';
      this.adminMessageType = 'error';
      return;
    }
    if (!this.selectedSubCategoryId) {
      this.adminMessage = 'Sub-category is required';
      this.adminMessageType = 'error';
      return;
    }
    if (!this.productPrice || this.productPrice <= 0) {
      this.adminMessage = 'Valid price is required';
      this.adminMessageType = 'error';
      return;
    }
    if (!this.productDescription || !this.productDescription.trim()) {
      this.adminMessage = 'Product description is required';
      this.adminMessageType = 'error';
      return;
    }

    const formData = new FormData();
    formData.append('name', this.productName.trim());
    formData.append('reference', this.productReference.trim());
    formData.append('sub_category_id', this.selectedSubCategoryId.toString());
    formData.append('price', this.productPrice.toString());
    formData.append('description', this.productDescription.trim());
    // Per-store stock as stock[storeId]=qty
    this.stores.forEach((s) => {
      formData.append(`stock[${s.id}]`, String(this.productStock[s.id] ?? 0));
    });
    if (this.productImage) {
      formData.append('image', this.productImage);
    }

    if (this.editingProductId) {
      this.productService.updateProduct(this.editingProductId, formData).subscribe({
        next: () => {
          this.adminMessage = 'Product updated successfully!';
          this.adminMessageType = 'success';
          this.refreshProducts();
          setTimeout(() => this.closeProductModal(), 900);
        },
        error: (err) => {
          this.adminMessage = err.error?.message || 'Failed to update product';
          this.adminMessageType = 'error';
        }
      });
    } else {
      this.productService.createProduct(formData).subscribe({
        next: () => {
          this.adminMessage = 'Product created successfully!';
          this.adminMessageType = 'success';
          this.refreshProducts();
          setTimeout(() => this.closeProductModal(), 900);
        },
        error: (err) => {
          this.adminMessage = err.error?.message || 'Failed to create product';
          this.adminMessageType = 'error';
        }
      });
    }
  }

  executeDelete(): void {
    if (!this.productToDelete) return;

    this.productService.deleteProduct(this.productToDelete.id).subscribe({
      next: () => {
        this.closeDeleteConfirmModal();
        this.refreshProducts();
      },
      error: (err) => {
        this.adminMessage = err.error?.message || 'Failed to delete product';
        this.adminMessageType = 'error';
        this.closeDeleteConfirmModal();
      }
    });
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
