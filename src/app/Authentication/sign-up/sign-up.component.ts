import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})
export class SignUpComponent {

  name: string = '';
  email: string = '';
  password: string = '';
  passwordConfirmation: string = '';
  message: string = '';
  messageType: 'success' | 'error' = 'error';
  isSubmitting = false;

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit(): void {
    if (this.password !== this.passwordConfirmation) {
      this.message = 'Passwords do not match!';
      this.messageType = 'error';
      return;
    }

    if (!(this.name && this.email && this.password && this.passwordConfirmation)) {
      this.message = 'Please fill in all fields.';
      this.messageType = 'error';
      return;
    }

    this.isSubmitting = true;
    this.auth.register({
      username: this.name,
      email: this.email,
      password: this.password,
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.message = 'Account created successfully!';
        this.messageType = 'success';
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        // Surface the specific validation error from the backend (422).
        const errors = err?.error?.errors;
        if (errors) {
          const firstKey = Object.keys(errors)[0];
          this.message = errors[firstKey]?.[0] || 'Registration failed. Please check your details.';
        } else {
          this.message = 'An error occurred, please try again.';
        }
        this.messageType = 'error';
      }
    });
  }
}
