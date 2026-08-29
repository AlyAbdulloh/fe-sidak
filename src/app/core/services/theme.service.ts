import { Injectable, signal } from '@angular/core';
import { STORAGE_KEYS } from '../constants/api.constants';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  // Sidebar collapsed state signal
  readonly isSidebarCollapsed = signal<boolean>(
    localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true'
  );

  // Dark mode state signal
  readonly isDarkMode = signal<boolean>(
    localStorage.getItem(STORAGE_KEYS.THEME_MODE) === 'dark'
  );

  constructor() {
    this.applyTheme(this.isDarkMode());
  }

  toggleSidebar(): void {
    const newState = !this.isSidebarCollapsed();
    this.isSidebarCollapsed.set(newState);
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(newState));
  }

  setSidebarCollapsed(collapsed: boolean): void {
    this.isSidebarCollapsed.set(collapsed);
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(collapsed));
  }

  toggleDarkMode(): void {
    const newDark = !this.isDarkMode();
    this.isDarkMode.set(newDark);
    localStorage.setItem(STORAGE_KEYS.THEME_MODE, newDark ? 'dark' : 'light');
    this.applyTheme(newDark);
  }

  private applyTheme(isDark: boolean): void {
    if (isDark) {
      document.body.classList.add('dark-theme');
      document.documentElement.setAttribute('data-bs-theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      document.documentElement.setAttribute('data-bs-theme', 'light');
    }
  }
}
