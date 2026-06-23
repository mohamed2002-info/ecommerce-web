import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FilterService } from '../../services/filter.service';
import { SearchService } from '../../services/search.service';
import { PaginationService } from '../../services/pagination.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  message: string = '';
  messageType: 'success' | 'error' = 'error';
  isSubmitting = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private filterService: FilterService,
    private searchService: SearchService,
    private paginationService: PaginationService
  ) {}

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.message = 'Please enter your email and password.';
      this.messageType = 'error';
      return;
    }

    this.isSubmitting = true;
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.message = 'Login successful!';
        this.messageType = 'success';

        // Reset global search/filter/pagination state after login
        this.filterService.clearFilter();
        this.searchService.clearSearch();
        this.searchService.clearCategoryFilter();
        this.searchService.setSortOption('relevance');
        this.paginationService.setCurrentPage(1);

        // Return to where the user came from (e.g. /cart for checkout), else home.
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/home';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        if (err.status === 401) {
          this.message = err.error?.message || 'Invalid credentials';
        } else if (err.status === 422) {
          this.message = 'Please enter a valid email and password.';
        } else {
          this.message = 'An error occurred, please try again.';
        }
        this.messageType = 'error';
      }
    });
  }
}
