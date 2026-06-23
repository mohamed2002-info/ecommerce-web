import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {

  email: string = '';
  token: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  message: string = '';
  messageType: 'success' | 'error' = 'error';
  isSubmitting = false;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.email = sessionStorage.getItem('emailForReset') || '';
    this.token = sessionStorage.getItem('resetToken') || '';

    if (!this.email || !this.token) {
      this.message = 'Session expired. Please restart the password reset process.';
      this.messageType = 'error';
      this.router.navigate(['/forgot-password']);
    }
  }

  onSubmit(): void {
    if (!this.newPassword || !this.confirmPassword) {
      this.message = 'Please fill in both password fields.';
      this.messageType = 'error';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.message = 'Passwords do not match.';
      this.messageType = 'error';
      return;
    }

    this.isSubmitting = true;
    this.auth.resetPassword({
      email: this.email,
      token: this.token,
      password: this.newPassword
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.message = 'Password reset successful! Redirecting to login…';
        this.messageType = 'success';
        // Clean up the single-use token from storage.
        sessionStorage.removeItem('emailForReset');
        sessionStorage.removeItem('resetToken');
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        const errors = err?.error?.errors;
        if (errors?.password) {
          this.message = errors.password[0];
        } else if (err?.error?.message) {
          this.message = err.error.message;
        } else {
          this.message = 'An error occurred, please try again.';
        }
        this.messageType = 'error';
      }
    });
  }
}
