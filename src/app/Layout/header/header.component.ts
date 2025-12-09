import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  showUserMenu: boolean = false;

  constructor(private router: Router) {}

  ngOnInit(): void {}

  getUserInitial(): string {
    const username = sessionStorage.getItem('username');
    if (username && username.length > 0) {
      return username.charAt(0).toUpperCase();
    }
    return 'U';
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  logout(): void {
    sessionStorage.clear();
    this.showUserMenu = false;
    this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu-container')) {
      this.showUserMenu = false;
    }
  }
}
