import { Employee } from './employee.model';

export interface DepartmentDistributionItem {
  id: number;
  deptName: string;
  employeeCount: number;
  percentage: number;
}

export interface DashboardStats {
  totalDepartments: number;
  totalJobTitles: number;
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  departmentDistribution: DepartmentDistributionItem[];
  recentEmployees: Employee[];
}
