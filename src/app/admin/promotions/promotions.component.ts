import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PromotionService } from '../../services/promotion.service';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { AuthService } from '../../services/auth.service';
import {
  Promotion,
  PromotionDiscountType,
  PromotionPayload,
  PromotionTargetType
} from '../../Models/promotion.model';

@Component({
  selector: 'app-admin-promotions',
  templateUrl: './promotions.component.html',
  styleUrls: ['./promotions.component.css']
})
export class AdminPromotionsComponent implements OnInit {
  promotions: Promotion[] = [];
  products: { id: number; name: string }[] = [];
  categories: { id: number; name: string }[] = [];

  isLoading = false;
  loadError = '';

  // Form / modal state
  showModal = false;
  editingId: number | null = null;
  saving = false;
  formError = '';

  // Form model
  form: PromotionPayload = this.emptyForm();

  // Delete confirmation
  showDeleteModal = false;
  deleteTarget: Promotion | null = null;

  constructor(
    private promotionService: PromotionService,
    private productService: ProductService,
    private categoryService: CategoryService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Hard guard: only admins reach this page.
    if (!this.auth.isAdmin()) {
      this.router.navigate(['/home']);
      return;
    }
    this.loadPromotions();
    this.loadOptions();
  }

  private emptyForm(): PromotionPayload {
    return {
      name: '',
      description: '',
      target_type: 'products',
      category_id: null,
      product_ids: [],
      discount_type: 'percentage',
      value: 10,
      starts_at: null,
      ends_at: null,
      priority: 0,
      status: 'active'
    };
  }

  loadPromotions(): void {
    this.isLoading = true;
    this.loadError = '';
    this.promotionService.list().subscribe({
      next: (data) => {
        this.promotions = data;
        this.isLoading = false;
      },
      error: () => {
        this.loadError = 'Unable to load promotions.';
        this.isLoading = false;
      }
    });
  }

  private loadOptions(): void {
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = (data || []).map((p: any) => ({ id: p.id, name: p.name }));
      },
      error: () => {}
    });
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories = (data || []).map((c: any) => ({ id: c.id, name: c.name }));
      },
      error: () => {}
    });
  }

  // ---- Create / edit ----
  openCreate(): void {
    this.editingId = null;
    this.form = this.emptyForm();
    this.formError = '';
    this.showModal = true;
  }

  openEdit(promo: Promotion): void {
    this.editingId = promo.id;
    this.form = {
      name: promo.name,
      description: promo.description ?? '',
      target_type: promo.target_type,
      category_id: promo.category_id,
      product_ids: (promo.products || []).map((p) => p.id),
      discount_type: promo.discount_type,
      value: Number(promo.value),
      starts_at: this.toInputDate(promo.starts_at),
      ends_at: this.toInputDate(promo.ends_at),
      priority: promo.priority,
      status: promo.status
    };
    this.formError = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  onTargetTypeChange(): void {
    // Reset target-specific fields when the target type changes.
    if (this.form.target_type !== 'category') {
      this.form.category_id = null;
    }
    if (this.form.target_type !== 'product' && this.form.target_type !== 'products') {
      this.form.product_ids = [];
    }
  }

  toggleProduct(productId: number): void {
    const ids = this.form.product_ids ?? [];
    const idx = ids.indexOf(productId);
    if (idx >= 0) {
      ids.splice(idx, 1);
    } else {
      ids.push(productId);
    }
    this.form.product_ids = [...ids];
  }

  isProductSelected(productId: number): boolean {
    return (this.form.product_ids ?? []).includes(productId);
  }

  get needsProducts(): boolean {
    return this.form.target_type === 'product' || this.form.target_type === 'products';
  }

  get needsCategory(): boolean {
    return this.form.target_type === 'category';
  }

  save(): void {
    this.formError = '';

    if (!this.form.name.trim()) {
      this.formError = 'Name is required.';
      return;
    }
    if (this.form.value == null || this.form.value < 0) {
      this.formError = 'Enter a valid discount value.';
      return;
    }
    if (this.form.discount_type === 'percentage' && this.form.value > 100) {
      this.formError = 'A percentage discount cannot exceed 100.';
      return;
    }
    if (this.needsCategory && !this.form.category_id) {
      this.formError = 'Select a category.';
      return;
    }
    if (this.needsProducts && (this.form.product_ids ?? []).length === 0) {
      this.formError = 'Select at least one product.';
      return;
    }

    const payload: PromotionPayload = {
      ...this.form,
      name: this.form.name.trim(),
      value: Number(this.form.value),
      priority: Number(this.form.priority ?? 0),
      // Convert the admin's local wall-clock time to a UTC ISO instant so the
      // backend (which runs in UTC) compares against the moment they intended.
      starts_at: this.toUtcIso(this.form.starts_at),
      ends_at: this.toUtcIso(this.form.ends_at)
    };

    this.saving = true;
    const request = this.editingId
      ? this.promotionService.update(this.editingId, payload)
      : this.promotionService.create(payload);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.showModal = false;
        this.loadPromotions();
      },
      error: (err) => {
        this.saving = false;
        const errors = err?.error?.errors;
        this.formError = errors
          ? errors[Object.keys(errors)[0]][0]
          : (err?.error?.message || 'Failed to save promotion.');
      }
    });
  }

  // ---- Status toggle ----
  toggleStatus(promo: Promotion): void {
    const next = promo.status === 'active' ? 'paused' : 'active';
    this.promotionService.setStatus(promo.id, next).subscribe({
      next: () => this.loadPromotions(),
      error: () => this.loadPromotions()
    });
  }

  // ---- Delete ----
  confirmDelete(promo: Promotion): void {
    this.deleteTarget = promo;
    this.showDeleteModal = true;
  }

  closeDelete(): void {
    this.showDeleteModal = false;
    this.deleteTarget = null;
  }

  executeDelete(): void {
    if (!this.deleteTarget) {
      return;
    }
    this.promotionService.delete(this.deleteTarget.id).subscribe({
      next: () => {
        this.closeDelete();
        this.loadPromotions();
      },
      error: () => {
        this.closeDelete();
        this.loadPromotions();
      }
    });
  }

  // ---- Display helpers ----
  discountLabel(promo: Promotion): string {
    return promo.discount_type === 'percentage'
      ? `${Number(promo.value)}% off`
      : `${Number(promo.value)} DT off`;
  }

  targetLabel(promo: Promotion): string {
    switch (promo.target_type) {
      case 'all': return 'Entire catalog';
      case 'category': return `Category: ${promo.category?.name ?? '—'}`;
      case 'product':
      case 'products': return `${(promo.products || []).length} product(s)`;
      default: return promo.target_type;
    }
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  /**
   * Convert a datetime-local value (local wall-clock, no timezone) to a UTC ISO
   * string. `new Date('2026-06-10T23:33')` is interpreted in local time, so
   * `.toISOString()` yields the correct UTC instant the admin intended.
   */
  private toUtcIso(local: string | null | undefined): string | null {
    if (!local) {
      return null;
    }
    const d = new Date(local);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  /** Convert an ISO timestamp to the value a datetime-local input expects. */
  private toInputDate(iso: string | null): string | null {
    if (!iso) {
      return null;
    }
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return null;
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
