import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ViewService {
  private viewModeSubject = new BehaviorSubject<'grid' | 'list'>('grid');
  public viewMode$: Observable<'grid' | 'list'> = this.viewModeSubject.asObservable();

  constructor() {
    // Load view mode from sessionStorage if available
    const savedViewMode = sessionStorage.getItem('viewMode') as 'grid' | 'list';
    if (savedViewMode === 'grid' || savedViewMode === 'list') {
      this.viewModeSubject.next(savedViewMode);
    }
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewModeSubject.next(mode);
    sessionStorage.setItem('viewMode', mode);
  }

  getViewMode(): 'grid' | 'list' {
    return this.viewModeSubject.value;
  }
}

