import { Component } from '@angular/core';
import { UserService } from '../../services/user.service';  // Import the UserService
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {

  email: string = '';  // Email input
  message: string = '';    // Validation message
  messageType: 'success' | 'error' = 'error';  // Message type (success or error)

  constructor(private userService: UserService, private router: Router) {}

  // Handle form submission
  onSubmit(): void {
    if (this.email) {
      sessionStorage.setItem('emailForReset', this.email);
      // Call the forgotPassword method from UserService
      this.userService.forgotPassword({ email: this.email }).subscribe({
        next: (response: any) => {
          // Handle successful response (email exists)
          this.message = 'If the email exists, you will be redirected to the reset password page.';
          this.messageType = 'success';
          this.router.navigate(['/reset-password']);  // Redirect to the reset password page
        },
        error: (err: any) => {
          // Handle error response (email not found)
          if (err.status === 404) {
            this.message = 'Email address not found. Please check and try again.';
          } else {
            this.message = 'An error occurred, please try again.';
          }
          this.messageType = 'error';  // Show error message
        }
      });
    } else {
      this.message = 'Please enter a valid email address.';
      this.messageType = 'error';  // Show error if fields are empty
    }
  }
}
