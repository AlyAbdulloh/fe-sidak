export interface Department {
  id: number;
  deptName: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  _count?: {
    employees?: number;
    jobTitles?: number;
  };
}

export interface CreateDepartmentDto {
  deptName: string;
}

export interface UpdateDepartmentDto {
  deptName: string;
}

export interface DepartmentQuery {
  page?: number;
  limit?: number;
  search?: string;
}
