import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { ViewService } from '../../services/view.service';
import { SearchService, CategoryFilter, SortOption } from '../../services/search.service';
import { CategoryService } from '../../services/category.service';
import { Category, SubCategory } from '../../Models/category.model';

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

  constructor(
    private router: Router, 
    private viewService: ViewService,
    private searchService: SearchService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    // Subscribe to view mode changes
    this.viewService.viewMode$.subscribe(mode => {
      this.viewMode = mode;
    });

    this.userEmail = this.getUserEmail();
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const clickInsideUserMenu = target.closest('.user-menu-container');
    const clickInsideHelp = target.closest('.help-menu-container');

    if (!clickInsideUserMenu) {
      this.showUserMenu = false;
    }
    if (!clickInsideHelp) {
      this.showHelpDialog = false;
    }
  }
}
