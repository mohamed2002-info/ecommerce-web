import { Component, OnInit, HostListener } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ViewService } from '../../services/view.service';
import { SearchService, CategoryFilter, SortOption } from '../../services/search.service';
import { CategoryService } from '../../services/category.service';
import { Category, SubCategory } from '../../Models/category.model';
import { WishlistService } from '../../services/wishlist.service';
import { CartService } from '../../services/cart.service';
import { SubCategoryService } from '../../services/subcategory.service';
import { ProductService } from '../../services/product.service';
import { FilterService } from '../../services/filter.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  showUserMenu: boolean = false;
  showHelpDialog: boolean = false;
  viewMode: 'grid' | 'list' = 'grid';
  cartItemCount: number = 0; // Will be updated when cart service is implemented
  searchTerm: string = '';
  userEmail: string = '';
  categories: Category[] = [];
  isLoadingCategories = false;
  categoriesError = '';
  selectedCategoryName = '';
  selectedSubCategoryName = '';
  sortOption: SortOption = 'relevance';
  productCount = 0;
  wishlistCount = 0;
  isWishlistPage = false;
  isCartPage = false;
  isAdmin: boolean = false;
  sortOptions: { value: SortOption; label: string }[] = [
    { value: 'relevance', label: 'Pertinent' },
    { value: 'priceAsc', label: 'Price ↑' },
    { value: 'priceDesc', label: 'Price ↓' },
    { value: 'nameAsc', label: 'Name A-Z' },
    { value: 'nameDesc', label: 'Name Z-A' }
  ];
  helpOptions: string[] = [
    'Order issue',
    'Payment problem',
    'Bug report',
    'Feature request',
    'Other'
  ];
  selectedHelpOption: string = this.helpOptions[0];
  helpDescription: string = '';

  // Admin modal states
  showCategoryModal: boolean = false;
  showSubCategoryModal: boolean = false;
  showProductModal: boolean = false;
  showDeleteConfirmModal: boolean = false;
  deleteConfirmType: 'category' | 'subcategory' | 'product' | null = null;
  deleteConfirmId: number | null = null;
  deleteConfirmName: string = '';

  // Category form data
  categoryName: string = '';
  editingCategoryId: number | null = null;

  // SubCategory form data
  subCategoryName: string = '';
  selectedCategoryId: number | null = null;
  editingSubCategoryId: number | null = null;

  // Product form data
  productName: string = '';
  productReference: string = '';
  selectedSubCategoryId: number | null = null;
  productPrice: number = 0;
  productDescription: string = '';
  productImage: File | null = null;
  productImagePreview: string | null = null;

  // Messages
  adminMessage: string = '';
  adminMessageType: 'success' | 'error' = 'success';

  constructor(
    private router: Router, 
    private viewService: ViewService,
    private searchService: SearchService,
    private categoryService: CategoryService,
    private wishlistService: WishlistService,
    private cartService: CartService,
    private subCategoryService: SubCategoryService,
    private productService: ProductService,
    private filterService: FilterService
  ) {}

  ngOnInit(): void {
    // Subscribe to view mode changes
    this.viewService.viewMode$.subscribe(mode => {
      this.viewMode = mode;
    });

    this.userEmail = this.getUserEmail();
    this.isAdmin = this.checkIfAdmin();
    this.loadCategories();
    this.syncBreadcrumbFromFilter(this.searchService.getCategoryFilter());

    this.searchService.categoryFilter$.subscribe((filter) => {
      this.syncBreadcrumbFromFilter(filter);
    });

    this.searchService.sortOption$.subscribe((option) => {
      this.sortOption = option;
    });

    this.searchService.productCount$.subscribe((count) => {
      this.productCount = count;
    });

    this.wishlistService.wishlist$.subscribe((ids) => {
      this.wishlistCount = ids.length;
    });

    this.cartService.cart$.subscribe((items) => {
      this.cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    });

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects;
        this.isWishlistPage = url.includes('/wishlist');
        this.isCartPage = url.includes('/cart');
        // Refresh role check on navigation in case user logged in/out
        this.isAdmin = this.checkIfAdmin();
      }
    });
    const currentUrl = this.router.url;
    this.isWishlistPage = currentUrl.includes('/wishlist');
    this.isCartPage = currentUrl.includes('/cart');
  }

  goToWishlist(): void {
    this.router.navigate(['/wishlist']);
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewService.setViewMode(mode);
  }

  getUserInitial(): string {
    // Try multiple possible keys for username
    let username = sessionStorage.getItem('username');
    if (!username) {
      username = sessionStorage.getItem('userName');
    }
    if (!username) {
      username = sessionStorage.getItem('name');
    }
    if (!username) {
      // Try to parse user object if stored as JSON
      const userStr = sessionStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          username = user.username || user.name || user.userName;
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
    if (username && username.length > 0) {
      return username.charAt(0).toUpperCase();
    }
    return 'U';
  }

  onSearch(): void {
    this.searchService.setSearchTerm(this.searchTerm);
    // Reset to page 1 when searching
    this.viewService.setViewMode(this.viewMode); // Trigger update
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    // Real-time search as user types
    this.searchService.setSearchTerm(this.searchTerm);
  }

  onSearchKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onSearch();
    }
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  logout(): void {
    sessionStorage.clear();
    this.showUserMenu = false;
    // Clear filters on logout
    this.filterService.clearFilter();
    this.router.navigate(['/login']);
  }

  scrollToContact(): void {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  toggleHelpDialog(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.showHelpDialog = !this.showHelpDialog;
  }

  sendHelpEmail(): void {
    const subject = encodeURIComponent(this.selectedHelpOption || 'Help Request');
    const bodyLines = [
      `Issue: ${this.selectedHelpOption}`,
      '',
      'Description:',
      this.helpDescription || '(no description provided)'
    ];
    const body = encodeURIComponent(bodyLines.join('\n'));
    window.location.href = `mailto:melekbradai10@gmail.com?subject=${subject}&body=${body}`;
    this.showHelpDialog = false;
  }

  onCategoryClick(category: Category): void {
    const subIds = this.getSubCategories(category).map(sub => sub.id);
    this.setCategoryFilter({
      categoryId: category.id,
      subCategoryId: null,
      subCategoryIds: subIds
    });
  }

  onSubCategoryClick(sub: SubCategory, category: Category): void {
    this.setCategoryFilter({
      categoryId: category.id,
      subCategoryId: sub.id,
      subCategoryIds: []
    });
  }

  clearCategoryFilter(): void {
    this.searchService.clearCategoryFilter();
    this.selectedCategoryName = '';
    this.selectedSubCategoryName = '';
  }

  onSortChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.searchService.setSortOption(target.value as SortOption);
  }

  onCategoryCrumbClick(): void {
    const filter = this.searchService.getCategoryFilter();
    const category = filter?.categoryId
      ? this.categories.find(c => c.id === filter.categoryId)
      : undefined;

    if (category) {
      const subIds = this.getSubCategories(category).map(sub => sub.id);
      this.setCategoryFilter({
        categoryId: category.id,
        subCategoryId: null,
        subCategoryIds: subIds
      });
    } else {
      this.clearCategoryFilter();
    }
  }

  getSubCategories(category: Category): SubCategory[] {
    // Normalize possible backend shapes (subCategories vs sub_categories)
    const subs = (category as any).subCategories || (category as any).sub_categories;
    return subs || [];
  }

  private loadCategories(): void {
    this.isLoadingCategories = true;
    this.categoriesError = '';
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        // Ensure we always have subCategories as an array
        this.categories = (data || []).map((cat: any) => ({
          ...cat,
          subCategories: cat.subCategories || cat.sub_categories || []
        }));
        this.isLoadingCategories = false;
        this.syncBreadcrumbFromFilter(this.searchService.getCategoryFilter());
      },
      error: () => {
        this.categoriesError = 'Unable to load categories right now.';
        this.isLoadingCategories = false;
      }
    });
  }

  private setCategoryFilter(filter: CategoryFilter): void {
    // Clear search text to avoid conflicting filters
    this.searchTerm = '';
    this.searchService.setSearchTerm('');
    this.searchService.setCategoryFilter(filter);
    this.syncBreadcrumbFromFilter(filter);
    // Navigate to main listing view
    this.router.navigate(['/home']);
  }

  private syncBreadcrumbFromFilter(filter: CategoryFilter): void {
    if (!filter) {
      this.selectedCategoryName = '';
      this.selectedSubCategoryName = '';
      return;
    }
    const category = filter.categoryId
      ? this.categories.find(c => c.id === filter.categoryId)
      : undefined;
    this.selectedCategoryName = category?.name || '';

    if (filter.subCategoryId && category) {
      const sub = this.getSubCategories(category).find(s => s.id === filter.subCategoryId);
      this.selectedSubCategoryName = sub?.name || '';
    } else {
      this.selectedSubCategoryName = '';
    }
  }

  private getUserEmail(): string {
    // Try common storage keys first
    let email =
      sessionStorage.getItem('email') ||
      sessionStorage.getItem('userEmail') ||
      sessionStorage.getItem('mail');

    if (email) {
      return email;
    }

    // Try to parse loginResponse if present
    const loginResponse = sessionStorage.getItem('loginResponse');
    if (loginResponse) {
      try {
        const parsed = JSON.parse(loginResponse);
        email =
          parsed?.email ||
          parsed?.user?.email ||
          parsed?.data?.email ||
          parsed?.user?.mail;
        if (email) {
          return email;
        }
      } catch (e) {
        // ignore parse errors
      }
    }

    // Fallback: if username looks like an email, use it
    const usernameLikeEmail =
      sessionStorage.getItem('username') ||
      sessionStorage.getItem('userName') ||
      sessionStorage.getItem('name');
    if (usernameLikeEmail && usernameLikeEmail.includes('@')) {
      return usernameLikeEmail;
    }

    return '';
  }

  private checkIfAdmin(): boolean {
    // Check sessionStorage for role
    const role = sessionStorage.getItem('userRole');
    if (role) {
      return role.toLowerCase() === 'admin';
    }

    // Try to parse loginResponse if present
    const loginResponse = sessionStorage.getItem('loginResponse');
    if (loginResponse) {
      try {
        const parsed = JSON.parse(loginResponse);
        const userRole =
          parsed?.user?.role ||
          parsed?.role ||
          parsed?.data?.user?.role ||
          parsed?.data?.role;
        if (userRole) {
          return userRole.toLowerCase() === 'admin';
        }
      } catch (e) {
        // ignore parse errors
      }
    }

    return false;
  }

  // Admin modal methods
  openCategoryModal(category?: Category): void {
    if (category) {
      this.editingCategoryId = category.id;
      this.categoryName = category.name;
    } else {
      this.editingCategoryId = null;
      this.categoryName = '';
    }
    this.showCategoryModal = true;
    this.adminMessage = '';
  }

  closeCategoryModal(): void {
    this.showCategoryModal = false;
    this.categoryName = '';
    this.editingCategoryId = null;
    this.adminMessage = '';
  }

  openSubCategoryModal(subCategory?: SubCategory, categoryId?: number): void {
    if (subCategory) {
      this.editingSubCategoryId = subCategory.id;
      this.subCategoryName = subCategory.name;
      this.selectedCategoryId = categoryId || subCategory.category_id || null;
    } else {
      this.editingSubCategoryId = null;
      this.subCategoryName = '';
      this.selectedCategoryId = null;
    }
    this.showSubCategoryModal = true;
    this.adminMessage = '';
  }

  closeSubCategoryModal(): void {
    this.showSubCategoryModal = false;
    this.subCategoryName = '';
    this.selectedCategoryId = null;
    this.editingSubCategoryId = null;
    this.adminMessage = '';
  }

  openProductModal(): void {
    this.productName = '';
    this.productReference = '';
    this.selectedSubCategoryId = null;
    this.productPrice = 0;
    this.productDescription = '';
    this.productImage = null;
    this.productImagePreview = null;
    this.showProductModal = true;
    this.adminMessage = '';
  }

  closeProductModal(): void {
    this.showProductModal = false;
    this.productName = '';
    this.productReference = '';
    this.selectedSubCategoryId = null;
    this.productPrice = 0;
    this.productDescription = '';
    this.productImage = null;
    this.productImagePreview = null;
    this.adminMessage = '';
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.productImage = input.files[0];
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.productImagePreview = e.target.result;
      };
      reader.readAsDataURL(this.productImage);
    }
  }

  submitCategory(): void {
    if (!this.categoryName.trim()) {
      this.adminMessage = 'Category name is required';
      this.adminMessageType = 'error';
      return;
    }

    if (this.editingCategoryId) {
      // Update existing category
      this.categoryService.updateCategory(this.editingCategoryId, this.categoryName.trim()).subscribe({
        next: (response) => {
          this.adminMessage = 'Category updated successfully!';
          this.adminMessageType = 'success';
          this.loadCategories();
          setTimeout(() => {
            this.closeCategoryModal();
          }, 1500);
        },
        error: (err) => {
          this.adminMessage = err.error?.message || err.error?.errors?.name?.[0] || 'Failed to update category';
          this.adminMessageType = 'error';
        }
      });
    } else {
      // Create new category
      this.categoryService.createCategory(this.categoryName.trim()).subscribe({
        next: (response) => {
          this.adminMessage = 'Category created successfully!';
          this.adminMessageType = 'success';
          this.loadCategories();
          setTimeout(() => {
            this.closeCategoryModal();
          }, 1500);
        },
        error: (err) => {
          this.adminMessage = err.error?.message || err.error?.errors?.name?.[0] || 'Failed to create category';
          this.adminMessageType = 'error';
        }
      });
    }
  }

  submitSubCategory(): void {
    if (!this.subCategoryName.trim()) {
      this.adminMessage = 'Sub-category name is required';
      this.adminMessageType = 'error';
      return;
    }
    if (!this.selectedCategoryId) {
      this.adminMessage = 'Please select a category';
      this.adminMessageType = 'error';
      return;
    }

    if (this.editingSubCategoryId) {
      // Update existing sub-category
      this.subCategoryService.updateSubCategory(this.editingSubCategoryId, this.subCategoryName.trim(), this.selectedCategoryId).subscribe({
        next: (response) => {
          this.adminMessage = 'Sub-category updated successfully!';
          this.adminMessageType = 'success';
          this.loadCategories();
          setTimeout(() => {
            this.closeSubCategoryModal();
          }, 1500);
        },
        error: (err) => {
          this.adminMessage = err.error?.message || 'Failed to update sub-category';
          this.adminMessageType = 'error';
        }
      });
    } else {
      // Create new sub-category
      this.subCategoryService.createSubCategory(this.subCategoryName.trim(), this.selectedCategoryId).subscribe({
        next: (response) => {
          this.adminMessage = 'Sub-category created successfully!';
          this.adminMessageType = 'success';
          this.loadCategories();
          setTimeout(() => {
            this.closeSubCategoryModal();
          }, 1500);
        },
        error: (err) => {
          this.adminMessage = err.error?.message || 'Failed to create sub-category';
          this.adminMessageType = 'error';
        }
      });
    }
  }

  submitProduct(): void {
    if (!this.productName.trim()) {
      this.adminMessage = 'Product name is required';
      this.adminMessageType = 'error';
      return;
    }
    if (!this.productReference.trim()) {
      this.adminMessage = 'Product reference is required';
      this.adminMessageType = 'error';
      return;
    }
    if (!this.selectedSubCategoryId) {
      this.adminMessage = 'Please select a sub-category';
      this.adminMessageType = 'error';
      return;
    }
    if (!this.productPrice || this.productPrice <= 0) {
      this.adminMessage = 'Valid price is required';
      this.adminMessageType = 'error';
      return;
    }
    if (!this.productDescription.trim()) {
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
    if (this.productImage) {
      formData.append('image', this.productImage);
    }

    this.productService.createProduct(formData).subscribe({
      next: (response) => {
        this.adminMessage = 'Product created successfully!';
        this.adminMessageType = 'success';
        setTimeout(() => {
          this.closeProductModal();
          // Reload page to show new product
          window.location.reload();
        }, 1500);
      },
      error: (err) => {
        this.adminMessage = err.error?.message || err.error?.errors?.reference?.[0] || 'Failed to create product';
        this.adminMessageType = 'error';
      }
    });
  }

  getAllSubCategories(): SubCategory[] {
    const allSubs: SubCategory[] = [];
    this.categories.forEach(category => {
      const subs = this.getSubCategories(category);
      allSubs.push(...subs);
    });
    return allSubs;
  }

  // Delete confirmation methods
  confirmDeleteCategory(category: Category, event: MouseEvent): void {
    event.stopPropagation();
    this.deleteConfirmType = 'category';
    this.deleteConfirmId = category.id;
    this.deleteConfirmName = category.name;
    this.showDeleteConfirmModal = true;
  }

  confirmDeleteSubCategory(subCategory: SubCategory, event: MouseEvent): void {
    event.stopPropagation();
    this.deleteConfirmType = 'subcategory';
    this.deleteConfirmId = subCategory.id;
    this.deleteConfirmName = subCategory.name;
    this.showDeleteConfirmModal = true;
  }

  closeDeleteConfirmModal(): void {
    this.showDeleteConfirmModal = false;
    this.deleteConfirmType = null;
    this.deleteConfirmId = null;
    this.deleteConfirmName = '';
    this.adminMessage = '';
  }

  executeDelete(): void {
    if (!this.deleteConfirmType || !this.deleteConfirmId) return;

    // Clear any previous error messages
    this.adminMessage = '';

    if (this.deleteConfirmType === 'category') {
      this.categoryService.deleteCategory(this.deleteConfirmId).subscribe({
        next: () => {
          this.loadCategories();
          this.closeDeleteConfirmModal();
        },
        error: (err) => {
          this.adminMessage = err.error?.message || 'Failed to delete category';
          this.adminMessageType = 'error';
          // Keep modal open to show error message
        }
      });
    } else if (this.deleteConfirmType === 'subcategory') {
      this.subCategoryService.deleteSubCategory(this.deleteConfirmId).subscribe({
        next: () => {
          this.loadCategories();
          this.closeDeleteConfirmModal();
        },
        error: (err) => {
          this.adminMessage = err.error?.message || 'Failed to delete sub-category';
          this.adminMessageType = 'error';
          // Keep modal open to show error message
        }
      });
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const clickInsideUserMenu = target.closest('.user-menu-container');
    const clickInsideHelp = target.closest('.help-menu-container');
    const clickInsideCategoryModal = target.closest('.admin-modal');
    const clickInsideSubCategoryModal = target.closest('.admin-modal');
    const clickInsideProductModal = target.closest('.admin-modal');

    if (!clickInsideUserMenu) {
      this.showUserMenu = false;
    }
    if (!clickInsideHelp) {
      this.showHelpDialog = false;
    }
    // Don't close modals on click inside them - they have their own close buttons
  }
}
