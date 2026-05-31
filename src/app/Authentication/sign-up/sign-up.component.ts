import { Component } from '@angular/core';
import { UserService } from '../../services/user.service';  // Import the UserService
import { Router } from '@angular/router';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})
export class SignUpComponent {

  name: string = '';               // Name input
  email: string = '';              // Email input
  password: string = '';           // Password input
  passwordConfirmation: string = '';  // Password confirmation input
  message: string = '';           // Validation message
  messageType: 'success' | 'error' = 'error';  // Message type (success or error)

  constructor(private userService: UserService, private router: Router) {}

  // Handle form submission
  onSubmit(): void {
    // Check if passwords match
    if (this.password !== this.passwordConfirmation) {
      this.message = 'Passwords do not match!';
      this.messageType = 'error';
      return;
    }

    // Check if all fields are filled
    if (this.name && this.email && this.password && this.passwordConfirmation) {
      // Call the register method from UserService
      this.userService.register({ 
        username: this.name,  // Send the name as username to the backend
        email: this.email, 
        password: this.password,
      }).subscribe({
        next: (response: any) => {
          // Handle successful registration response
          this.message = 'Account created successfully!';
          this.messageType = 'success';
          this.router.navigate(['/login']);  // Redirect to login page after successful sign-up
        },
        error: (err: any) => {
          // Handle error response (e.g., user already exists)
          if (err.status === 400) {
            this.message = 'User already exists. Please try another email or username.';
          } else {
            this.message = 'An error occurred, please try again.';
          }
          this.messageType = 'error';  // Show error message
        }
      });
    } else {
      this.message = 'Please fill in all fields.';
      this.messageType = 'error';  // Show error if fields are empty
    }
  }
}
