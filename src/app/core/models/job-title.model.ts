import { Department } from './department.model';

export interface JobTitle {
  id: number;
  titleName: string;
  departmentId: number;
  department?: Department;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface CreateJobTitleDto {
  titleName: string;
  departmentId: number;
}

export interface UpdateJobTitleDto {
  titleName?: string;
  departmentId?: number;
}

export interface JobTitleQuery {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: number;
}
