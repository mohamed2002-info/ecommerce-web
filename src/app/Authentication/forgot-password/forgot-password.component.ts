import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {

  email: string = '';
  message: string = '';
  messageType: 'success' | 'error' = 'error';
  isSubmitting = false;

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit(): void {
    if (!this.email) {
      this.message = 'Please enter a valid email address.';
      this.messageType = 'error';
      return;
    }

    this.isSubmitting = true;
    this.auth.forgotPassword({ email: this.email }).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;
        // The backend always returns a generic message (no user enumeration).
        // For this app it also returns a single-use reset token, which we carry
        // to the reset page. In production this token would arrive by email.
        sessionStorage.setItem('emailForReset', this.email);
        if (response?.reset_token) {
          sessionStorage.setItem('resetToken', response.reset_token);
          this.router.navigate(['/reset-password']);
        } else {
          this.message = response?.message || 'If the email exists, a reset link has been sent.';
          this.messageType = 'success';
        }
      },
      error: () => {
        this.isSubmitting = false;
        this.message = 'An error occurred, please try again.';
        this.messageType = 'error';
      }
    });
  }
}
