import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);

  get currentUser() {
    return this.authService.currentUser();
  }

  toggleSidebar() {
    this.themeService.toggleSidebar();
  }

  toggleDarkMode() {
    this.themeService.toggleDarkMode();
  }

  logout() {
    this.authService.logout();
  }
}
