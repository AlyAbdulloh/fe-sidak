import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api.constants';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';
import { Department, CreateDepartmentDto, UpdateDepartmentDto, DepartmentQuery } from '../models/department.model';

@Injectable({
  providedIn: 'root',
})
export class DepartmentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}${API_ENDPOINTS.DEPARTMENTS.BASE}`;

  getDepartments(query?: DepartmentQuery): Observable<PaginatedResponse<Department>> {
    let params = new HttpParams();
    if (query?.page) params = params.set('page', query.page);
    if (query?.limit) params = params.set('limit', query.limit);
    if (query?.search && query.search.trim() !== '') {
      params = params.set('search', query.search.trim());
    }

    return this.http.get<PaginatedResponse<Department>>(this.baseUrl, { params });
  }

  getDepartment(id: number): Observable<ApiResponse<Department>> {
    return this.http.get<ApiResponse<Department>>(`${this.baseUrl}/${id}`);
  }

  createDepartment(dto: CreateDepartmentDto): Observable<ApiResponse<Department>> {
    return this.http.post<ApiResponse<Department>>(this.baseUrl, dto);
  }

  updateDepartment(id: number, dto: UpdateDepartmentDto): Observable<ApiResponse<Department>> {
    return this.http.patch<ApiResponse<Department>>(`${this.baseUrl}/${id}`, dto);
  }

  deleteDepartment(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/${id}`);
  }
}
