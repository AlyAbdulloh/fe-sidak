export enum UserRole {
  ADMIN = 'admin',
  HR = 'hr',
  EMPLOYEE = 'employee',
}

export interface User {
  id: number | string;
  username: string;
  role: UserRole | string;
  email?: string;
  full_name?: string;
  avatar?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponseData {
  message?: string;
  access_token: string;
  user?: User;
}
