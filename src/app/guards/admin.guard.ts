import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Allows the route only for logged-in admins. Non-admins are bounced to /home,
 * unauthenticated users to /login. (The backend enforces admin access too; this
 * is a UX guard, not the security boundary.)
 */
@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }
    if (!this.auth.isAdmin()) {
      this.router.navigate(['/home']);
      return false;
    }
    return true;
  }
}
