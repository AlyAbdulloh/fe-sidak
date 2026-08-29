import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditLog, AuditLogQuery } from '../models/audit-log.model';
import { PaginatedResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/audit-logs`;

  getAuditLogs(query?: AuditLogQuery): Observable<PaginatedResponse<AuditLog>> {
    let params = new HttpParams();
    if (query) {
      if (query.page) params = params.set('page', query.page.toString());
      if (query.limit) params = params.set('limit', query.limit.toString());
      if (query.tableName) params = params.set('tableName', query.tableName);
      if (query.action) params = params.set('action', query.action);
      if (query.search) params = params.set('search', query.search);
    }
    return this.http.get<PaginatedResponse<AuditLog>>(this.apiUrl, { params });
  }
}
