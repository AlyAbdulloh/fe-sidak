import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token expired or invalid credential response from backend
        console.warn('Unauthorized access - Logging out user', error);
        // Only trigger logout if not already trying to log in
        if (!req.url.includes('/auth/login')) {
          authService.logout();
        }
      } else if (error.status === 403) {
        console.error('Forbidden action - Insufficient permissions', error);
      }
      return throwError(() => error);
    })
  );
};
