import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS, STORAGE_KEYS } from '../constants/api.constants';
import { LoginRequest, LoginResponseData, User, UserRole } from '../models/auth.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Reactive state using Angular Signals
  private tokenSignal = signal<string | null>(this.getStoredToken());
  private userSignal = signal<User | null>(this.getStoredUser());

  // Exposed read-only signals
  readonly accessToken = this.tokenSignal.asReadonly();
  readonly currentUser = this.userSignal.asReadonly();
  readonly isLoggedIn = computed(() => !!this.tokenSignal());

  constructor() {
    // If token exists but user info is null, create standard user representation from token
    if (this.tokenSignal() && !this.userSignal()) {
      this.restoreUserFromToken(this.tokenSignal()!);
    }
  }

  /**
   * Log in user against BE authentication API
   */
  login(credentials: LoginRequest): Observable<any> {
    const url = `${environment.apiUrl}${API_ENDPOINTS.AUTH.LOGIN}`;
    
    return this.http.post<ApiResponse<LoginResponseData> | LoginResponseData>(url, credentials).pipe(
      tap((response: any) => {
        // Handle NestJS response wrapper or direct object
        const responseData = response.data ? response.data : response;
        const token = responseData.access_token;

        if (token) {
          this.setSession(token, credentials.username);
        }
      }),
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Clear user session and redirect to login page
   */
  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    this.router.navigate(['/login']);
  }

  /**
   * Get raw token string
   */
  getToken(): string | null {
    return this.tokenSignal();
  }

  private setSession(token: string, username: string): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    this.tokenSignal.set(token);

    // Decode token or create user profile object
    const userPayload = this.decodeTokenPayload(token);
    const user: User = {
      id: userPayload?.sub || '1',
      username: userPayload?.username || username,
      role: userPayload?.role || UserRole.ADMIN,
      full_name: username.charAt(0).toUpperCase() + username.slice(1),
      email: `${username}@perusahaan.com`
    };

    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    this.userSignal.set(user);
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  private getStoredUser(): User | null {
    const data = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  private restoreUserFromToken(token: string): void {
    const payload = this.decodeTokenPayload(token);
    if (payload) {
      const user: User = {
        id: payload.sub || '1',
        username: payload.username || 'admin',
        role: payload.role || UserRole.ADMIN,
        full_name: payload.username ? payload.username.toUpperCase() : 'Administrator',
        email: `${payload.username || 'admin'}@perusahaan.com`
      };
      this.userSignal.set(user);
    }
  }

  private decodeTokenPayload(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = atob(parts[1]);
      return JSON.parse(payload);
    } catch (e) {
      return null;
    }
  }
}
