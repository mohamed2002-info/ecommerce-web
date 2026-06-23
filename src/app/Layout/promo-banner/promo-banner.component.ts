import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, interval, Observable } from 'rxjs';
import { PromotionService, ActivePromotion } from '../../services/promotion.service';
import { TickerService } from '../../shared/ticker.service';

@Component({
  selector: 'app-promo-banner',
  templateUrl: './promo-banner.component.html',
  styleUrls: ['./promo-banner.component.css']
})
export class PromoBannerComponent implements OnInit, OnDestroy {
  promos: ActivePromotion[] = [];
  index = 0;
  dismissed = false;
  onAuthPage = false;
  tick$: Observable<number>;

  // Routes where the banner must NOT appear (full-screen auth layouts).
  private readonly hiddenRoutes = ['/login', '/sign-up', '/forgot-password', '/reset-password'];

  private rotateSub?: Subscription;
  private routerSub?: Subscription;

  constructor(
    private promotionService: PromotionService,
    private router: Router,
    ticker: TickerService
  ) {
    this.tick$ = ticker.tick$;
  }

  ngOnInit(): void {
    // Track route so we can hide on auth pages.
    this.onAuthPage = this.isHidden(this.router.url);
    this.routerSub = this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        this.onAuthPage = this.isHidden(e.urlAfterRedirects);
      }
    });

    // Don't show again this session if the user dismissed it.
    this.dismissed = sessionStorage.getItem('promoBannerDismissed') === '1';
    if (this.dismissed) {
      return;
    }

    this.promotionService.active().subscribe({
      next: (promos) => {
        this.promos = promos || [];
        this.index = 0;
        // Rotate through every live promo: advance one step every 5 seconds.
        if (this.promos.length > 1) {
          this.rotateSub = interval(5000).subscribe(() => {
            this.index = (this.index + 1) % this.promos.length;
          });
        }
      },
      error: () => (this.promos = [])
    });
  }

  ngOnDestroy(): void {
    this.rotateSub?.unsubscribe();
    this.routerSub?.unsubscribe();
  }

  get current(): ActivePromotion | null {
    return this.promos.length ? this.promos[this.index] : null;
  }

  get show(): boolean {
    return !this.dismissed && !this.onAuthPage && this.promos.length > 0;
  }

  private isHidden(url: string): boolean {
    const path = (url || '').split('?')[0];
    return this.hiddenRoutes.some((r) => path === r || path.startsWith(r + '/'));
  }

  /** Big standalone discount chip, e.g. "−20%" or "−10 DT". */
  discountChip(p: ActivePromotion): string {
    return p.discount_type === 'percentage' ? `−${p.value}%` : `−${p.value} DT`;
  }

  dismiss(): void {
    this.dismissed = true;
    sessionStorage.setItem('promoBannerDismissed', '1');
  }
}
