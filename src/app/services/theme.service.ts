import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'theme';

/**
 * Owns the active color theme. Default is dark (Tech-Noir); the user's explicit
 * choice is persisted in localStorage and re-applied on every load by writing a
 * `data-theme` attribute on <html>, which the CSS token system keys off.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private themeSubject = new BehaviorSubject<Theme>(this.readInitial());
  readonly theme$ = this.themeSubject.asObservable();

  constructor() {
    this.apply(this.themeSubject.value);
  }

  get current(): Theme {
    return this.themeSubject.value;
  }

  toggle(): void {
    this.set(this.current === 'dark' ? 'light' : 'dark');
  }

  set(theme: Theme): void {
    localStorage.setItem(STORAGE_KEY, theme);
    this.apply(theme);
    this.themeSubject.next(theme);
  }

  private apply(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
  }

  private readInitial(): Theme {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    // Default to dark (matches the Tech-Noir design).
    return 'dark';
  }
}
