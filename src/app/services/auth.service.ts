import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface LoginResponse {
  message: string;
  token: string;
  user: AuthUser;
}

const TOKEN_KEY = 'authToken';
const USER_KEY = 'authUser';

/**
 * Single source of truth for authentication state.
 *
 * The bearer token is the only credential the app trusts; the user object is
 * cached only for display (initials, role-based UI). All identity used for
 * data access is derived server-side from the token.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;

  private userSubject = new BehaviorSubject<AuthUser | null>(this.readUser());
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => this.setSession(res.token, res.user))
    );
  }

  register(user: { username: string; email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  forgotPassword(data: { email: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, data);
  }

  resetPassword(data: { email: string; token: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, data);
  }

  /** Revoke the server-side token, then clear local state regardless of result. */
  logout(): Observable<any> {
    const req = this.http.post(`${this.apiUrl}/logout`, {});
    return new Observable((observer) => {
      req.subscribe({
        next: (r) => {
          this.clearSession();
          observer.next(r);
          observer.complete();
        },
        error: () => {
          // Even if the call fails (e.g. token already expired), drop local state.
          this.clearSession();
          observer.next(null);
          observer.complete();
        }
      });
    });
  }

  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  getUser(): AuthUser | null {
    return this.userSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return this.getUser()?.role?.toLowerCase() === 'admin';
  }

  /** Clear only local state (used by the interceptor on a 401). */
  clearSession(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    this.userSubject.next(null);
  }

  private setSession(token: string, user: AuthUser): void {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    this.userSubject.next(user);
  }

  private readUser(): AuthUser | null {
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
