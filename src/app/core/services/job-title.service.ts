import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';
import { JobTitle, CreateJobTitleDto, UpdateJobTitleDto, JobTitleQuery } from '../models/job-title.model';

@Injectable({
  providedIn: 'root',
})
export class JobTitleService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/job-titles`;

  getJobTitles(query?: JobTitleQuery): Observable<PaginatedResponse<JobTitle>> {
    let params = new HttpParams();
    if (query?.page) params = params.set('page', query.page);
    if (query?.limit) params = params.set('limit', query.limit);
    if (query?.search && query.search.trim() !== '') {
      params = params.set('search', query.search.trim());
    }
    if (query?.departmentId) {
      params = params.set('departmentId', query.departmentId);
    }

    return this.http.get<PaginatedResponse<JobTitle>>(this.baseUrl, { params });
  }

  getJobTitle(id: number): Observable<ApiResponse<JobTitle>> {
    return this.http.get<ApiResponse<JobTitle>>(`${this.baseUrl}/${id}`);
  }

  createJobTitle(dto: CreateJobTitleDto): Observable<ApiResponse<JobTitle>> {
    return this.http.post<ApiResponse<JobTitle>>(this.baseUrl, dto);
  }

  updateJobTitle(id: number, dto: UpdateJobTitleDto): Observable<ApiResponse<JobTitle>> {
    return this.http.patch<ApiResponse<JobTitle>>(`${this.baseUrl}/${id}`, dto);
  }

  deleteJobTitle(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/${id}`);
  }
}
