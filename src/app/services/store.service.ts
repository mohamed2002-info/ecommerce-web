import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Store {
  id: number;
  name: string;
  city: string;
  slug: string;
}

@Injectable({ providedIn: 'root' })
export class StoreService {
  private apiUrl = `${environment.apiUrl}/stores`;

  constructor(private http: HttpClient) {}

  list(): Observable<Store[]> {
    return this.http.get<Store[]>(this.apiUrl);
  }
}
