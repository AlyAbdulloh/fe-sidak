import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  EmployeeQuery
} from '../models/employee.model';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/employees`;

  getEmployees(query?: EmployeeQuery): Observable<PaginatedResponse<Employee>> {
    let params = new HttpParams();
    if (query) {
      if (query.page) params = params.set('page', query.page.toString());
      if (query.limit) params = params.set('limit', query.limit.toString());
      if (query.search) params = params.set('search', query.search);
      if (query.jobTitleId) params = params.set('jobTitleId', query.jobTitleId.toString());
      if (query.departmentId) params = params.set('departmentId', query.departmentId.toString());
      if (query.status) params = params.set('status', query.status);
    }
    return this.http.get<PaginatedResponse<Employee>>(this.apiUrl, { params });
  }

  getEmployeeById(id: number): Observable<ApiResponse<Employee>> {
    return this.http.get<ApiResponse<Employee>>(`${this.apiUrl}/${id}`);
  }

  createEmployee(payload: CreateEmployeeRequest): Observable<ApiResponse<Employee>> {
    return this.http.post<ApiResponse<Employee>>(this.apiUrl, payload);
  }

  updateEmployee(id: number, payload: UpdateEmployeeRequest): Observable<ApiResponse<Employee>> {
    return this.http.patch<ApiResponse<Employee>>(`${this.apiUrl}/${id}`, payload);
  }

  deleteEmployee(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
