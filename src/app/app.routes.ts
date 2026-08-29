import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'employees',
        loadComponent: () => import('./features/employees/employee-list.component').then(m => m.EmployeeListComponent)
      },
      {
        path: 'departments',
        loadComponent: () => import('./features/departments/department-list.component').then(m => m.DepartmentListComponent)
      },
      {
        path: 'job-titles',
        loadComponent: () => import('./features/job-titles/job-title-list.component').then(m => m.JobTitleListComponent)
      },
      {
        path: 'audit-logs',
        loadComponent: () => import('./features/audit-logs/audit-log-list.component').then(m => m.AuditLogListComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
