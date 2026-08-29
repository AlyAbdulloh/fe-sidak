import { JobTitle } from './job-title.model';

export type EmployeeStatus = 'active' | 'inactive';
export type Gender = 'male' | 'female';

export interface Employee {
  id: number;
  employeeCode: string;
  name: string;
  email?: string | null;
  jobTitleId: number;
  jobTitle?: JobTitle;
  gender: Gender;
  phoneNumber?: string | null;
  address?: string | null;
  hireDate?: string | null;
  birthDate?: string | null;
  status: EmployeeStatus;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface CreateEmployeeRequest {
  employeeCode?: string;
  name: string;
  jobTitleId: number;
  email?: string;
  gender?: Gender;
  phoneNumber?: string;
  address?: string;
  hireDate?: string;
  birthDate?: string;
  status?: EmployeeStatus;
}

export interface UpdateEmployeeRequest {
  employeeCode?: string;
  name?: string;
  jobTitleId?: number;
  email?: string;
  gender?: Gender;
  phoneNumber?: string;
  address?: string;
  hireDate?: string;
  birthDate?: string;
  status?: EmployeeStatus;
}

export interface EmployeeQuery {
  page?: number;
  limit?: number;
  search?: string;
  jobTitleId?: number;
  departmentId?: number;
  status?: EmployeeStatus;
}
