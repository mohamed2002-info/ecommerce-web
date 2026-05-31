import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { FilterService, ProductFilter } from '../../services/filter.service';
import { ProductService } from '../../services/product.service';
import { Product } from '../../Models/product.model';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.css']
})
export class FilterComponent implements OnInit, OnDestroy {
  minPrice: number = 0;
  maxPrice: number = 20000;
  currentMaxPrice: number = 20000;
  
  brands: { name: string; checked: boolean }[] = [
    { name: 'Asus', checked: false },
    { name: 'Lenovo', checked: false },
    { name: 'Dell', checked: false },
    { name: 'MSI', checked: false },
    { name: 'Gigabyte', checked: false },
    { name: 'HP', checked: false },
    { name: 'Apple', checked: false }
  ];

  processors: { name: string; checked: boolean }[] = [
    { name: 'Intel Core i5', checked: false },
    { name: 'Intel Core i7', checked: false },
    { name: 'Intel Core i9', checked: false },
    { name: 'AMD Ryzen 5', checked: false },
    { name: 'AMD Ryzen 7', checked: false },
    { name: 'AMD Ryzen 9', checked: false },
    { name: 'Apple M3 Pro', checked: false }
  ];

  graphicCards: { name: string; checked: boolean }[] = [
    { name: 'Nvidia GeForce', checked: false },
    { name: 'AMD Radeon', checked: false },
    { name: 'Integrated Graphic', checked: false },
    { name: 'Apple M3', checked: false }
  ];

  private subscriptions: Subscription[] = [];

  constructor(
    private filterService: FilterService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    // Load saved filter state first
    const savedFilter = this.filterService.getFilter();
    
    // Restore checkbox states
    this.brands.forEach(brand => {
      brand.checked = savedFilter.brands.includes(brand.name);
    });
    this.processors.forEach(processor => {
      processor.checked = savedFilter.processors.includes(processor.name);
    });
    this.graphicCards.forEach(card => {
      card.checked = savedFilter.graphicCards.includes(card.name);
    });

    // Load products to calculate dynamic price range
    this.productService.getProducts().subscribe({
      next: (products: Product[]) => {
        if (products && products.length > 0) {
          const prices = products.map(p => p.price);
          this.minPrice = Math.floor(Math.min(...prices));
          this.maxPrice = Math.ceil(Math.max(...prices));
          
          // Ensure saved filter is within valid range
          this.currentMaxPrice = Math.min(savedFilter.maxPrice, this.maxPrice);
          this.currentMaxPrice = Math.max(this.currentMaxPrice, this.minPrice);
          
          // Update filter service with valid range
          if (savedFilter.maxPrice > this.maxPrice || savedFilter.minPrice < this.minPrice) {
            this.filterService.setFilter({
              ...savedFilter,
              minPrice: this.minPrice,
              maxPrice: this.currentMaxPrice
            });
          }
        } else {
          // Fallback if no products
          this.minPrice = savedFilter.minPrice;
          this.currentMaxPrice = savedFilter.maxPrice;
          this.maxPrice = savedFilter.maxPrice;
        }
      },
      error: () => {
        // Fallback on error
        this.minPrice = savedFilter.minPrice;
        this.currentMaxPrice = savedFilter.maxPrice;
        this.maxPrice = savedFilter.maxPrice;
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  onPriceChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.currentMaxPrice = parseInt(target.value);
  }

  onBrandChange(brand: { name: string; checked: boolean }): void {
    brand.checked = !brand.checked;
  }

  onProcessorChange(processor: { name: string; checked: boolean }): void {
    processor.checked = !processor.checked;
  }

  onGraphicCardChange(card: { name: string; checked: boolean }): void {
    card.checked = !card.checked;
  }

  applyFilters(): void {
    const filter: ProductFilter = {
      minPrice: this.minPrice,
      maxPrice: this.currentMaxPrice,
      brands: this.brands.filter(b => b.checked).map(b => b.name),
      processors: this.processors.filter(p => p.checked).map(p => p.name),
      graphicCards: this.graphicCards.filter(g => g.checked).map(g => g.name)
    };

    this.filterService.setFilter(filter);
  }

  clearFilters(): void {
    // Reset to dynamic max price (will be set after products load)
    this.currentMaxPrice = this.maxPrice;
    this.brands.forEach(b => b.checked = false);
    this.processors.forEach(p => p.checked = false);
    this.graphicCards.forEach(g => g.checked = false);
    this.filterService.clearFilter();
    // Update filter service with current dynamic range
    this.filterService.setFilter({
      minPrice: this.minPrice,
      maxPrice: this.maxPrice,
      brands: [],
      processors: [],
      graphicCards: []
    });
  }

  getSelectedCount(): number {
    return this.brands.filter(b => b.checked).length +
           this.processors.filter(p => p.checked).length +
           this.graphicCards.filter(g => g.checked).length +
           (this.currentMaxPrice < this.maxPrice ? 1 : 0);
  }
}
