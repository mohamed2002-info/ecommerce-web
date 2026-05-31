import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';  // Import the UserService

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent {

  email: string = '';  // This will hold the email from sessionStorage
  newPassword: string = ''; // New password input
  confirmPassword: string = ''; // Confirm password input
  message: string = '';  // Validation message
  messageType: 'success' | 'error' = 'error';  // Message type (success or error)

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit(): void {
    // Retrieve the email from sessionStorage
    this.email = sessionStorage.getItem('emailForReset') || '';
    if (!this.email) {
      this.message = 'Session expired. Please restart the password reset process.';
      this.messageType = 'error';
      // Redirect to the forgot password page if email is not available
      this.router.navigate(['/forgot-password']);
    }
  }

  // Handle form submission
  onSubmit(): void {
    // Validate the passwords
    if (this.newPassword && this.confirmPassword && this.newPassword === this.confirmPassword) {
      // Proceed with updating the password
      this.userService.resetPassword({ email: this.email, password: this.newPassword }).subscribe({
        next: (response: any) => {
          this.message = 'Password reset successful!';
          this.messageType = 'success';
          // Don't redirect immediately, just show the message
        },
        error: (err: any) => {
          if (err.status === 422 && err.error.errors) {
            // Display the specific error message from backend validation
            this.message = err.error.errors.password ? err.error.errors.password[0] : 'An error occurred, please try again.';
          } else {
            this.message = 'An error occurred, please try again.';
          }
          this.messageType = 'error';
        }
      });
    } else {
      // Handle password mismatch or empty fields
      if (this.newPassword !== this.confirmPassword) {
        this.message = 'Passwords do not match.';
        this.messageType = 'error';
      } else {
        this.message = 'Please fill in both password fields.';
        this.messageType = 'error';
      }
    }
  }
}
