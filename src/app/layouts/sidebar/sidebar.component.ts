import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: string;
  badgeClass?: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  themeService = inject(ThemeService);
  authService = inject(AuthService);

  get isCollapsed() {
    return this.themeService.isSidebarCollapsed();
  }

  get currentUser() {
    return this.authService.currentUser();
  }

  navSections: NavSection[] = [
    {
      title: 'UTAMA',
      items: [
        { label: 'Dashboard', icon: 'bi-grid-1x2-fill', route: '/dashboard' }
      ]
    },
    {
      title: 'MANAJEMEN SDM',
      items: [
        { label: 'Data Karyawan', icon: 'bi-people-fill', route: '/employees' },
        { label: 'Departemen & Divisi', icon: 'bi-diagram-3-fill', route: '/departments' },
        { label: 'Jabatan & Posisi', icon: 'bi-card-heading', route: '/job-titles' }
      ]
    },
    {
      title: 'RIWAYAT & AUDIT',
      items: [
        { label: 'Riwayat Audit Log', icon: 'bi-clock-history', route: '/audit-logs' }
      ]
    },
    {
      title: 'PENGATURAN',
      items: [
        { label: 'Pengaturan Sistem', icon: 'bi-gear-wide-connected', route: '/settings' }
      ]
    }
  ];

  closeMobileSidebar() {
    if (window.innerWidth < 992) {
      this.themeService.setSidebarCollapsed(true);
    }
  }
}
