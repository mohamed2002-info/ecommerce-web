import { Component } from '@angular/core';
import { UserService } from '../../services/user.service'; 
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  message: string = '';
  messageType: 'success' | 'error' = 'error';

  constructor(private userService: UserService, private router: Router) {}

  onSubmit(): void {
    if (this.email && this.password) {
      this.userService.login({ email: this.email, password: this.password }).subscribe({
        next: (response: any) => {
          this.message = 'Login successful!';
          this.messageType = 'success';
          // Store username in session storage - check multiple possible response structures
          let username = null;
          let userId: number | null = null;
          let userRole: string | null = null;
          if (response?.username) {
            username = response.username;
          } else if (response?.user?.username) {
            username = response.user.username;
          } else if (response?.data?.username) {
            username = response.data.username;
          } else if (response?.name) {
            username = response.name;
          } else if (response?.user?.name) {
            username = response.user.name;
          }
          if (response?.user?.id) {
            userId = response.user.id;
          } else if (response?.id) {
            userId = response.id;
          } else if (response?.data?.user?.id) {
            userId = response.data.user.id;
          }
          // Extract role from response
          if (response?.user?.role) {
            userRole = response.user.role;
          } else if (response?.role) {
            userRole = response.role;
          } else if (response?.data?.user?.role) {
            userRole = response.data.user.role;
          } else if (response?.data?.role) {
            userRole = response.data.role;
          }
          
          if (username) {
            sessionStorage.setItem('username', username);
          }
          if (userId) {
            sessionStorage.setItem('userId', userId.toString());
          }
          if (userRole) {
            sessionStorage.setItem('userRole', userRole);
          }
          
          // Also store the full response as user object for debugging
          if (response) {
            sessionStorage.setItem('loginResponse', JSON.stringify(response));
          }
          
          this.router.navigate(['/home']);
        },
        error: (err: any) => {
          if (err.status === 401) {
            this.message = err.error?.message || 'Invalid credentials';
          } else {
            this.message = 'An error occurred, please try again.';
          }
          this.messageType = 'error';
        }
      });
    } else {
      this.message = 'Please enter your email and password.';
      this.messageType = 'error';
    }
  }
}
