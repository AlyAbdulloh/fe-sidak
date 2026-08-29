import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AuditLogService } from '../../core/services/audit-log.service';
import { AuditLog, AuditAction } from '../../core/models/audit-log.model';
import { PaginationMeta } from '../../core/models/api-response.model';
import { ExcelExportService } from '../../core/services/excel-export.service';

@Component({
  selector: 'app-audit-log-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbPaginationModule],
  templateUrl: './audit-log-list.component.html',
  styleUrl: './audit-log-list.component.css'
})
export class AuditLogListComponent implements OnInit, OnDestroy {
  private auditLogService = inject(AuditLogService);
  private excelExportService = inject(ExcelExportService);

  auditLogs: AuditLog[] = [];
  paginationMeta?: PaginationMeta;

  searchTerm: string = '';
  selectedTableName: string = 'all';
  selectedActionFilter: string = 'all';

  private searchSubject = new Subject<string>();
  private subscriptions: Subscription[] = [];

  page: number = 1;
  limit: number = 10;
  isLoading: boolean = false;
  isExporting: boolean = false;
  errorMessage: string | null = null;

  // Detail Modal State
  selectedLog: AuditLog | null = null;
  isDetailModalOpen: boolean = false;

  ngOnInit(): void {
    this.setupDebounceSearch();
    this.loadAuditLogs();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupDebounceSearch(): void {
    const searchSub = this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(searchQuery => {
      this.page = 1;
      this.loadAuditLogs(searchQuery);
    });
    this.subscriptions.push(searchSub);
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadAuditLogs();
  }

  loadAuditLogs(search: string = this.searchTerm): void {
    this.isLoading = true;
    this.errorMessage = null;

    const tableQuery = this.selectedTableName !== 'all' ? this.selectedTableName : undefined;
    const actionQuery = this.selectedActionFilter !== 'all' ? (this.selectedActionFilter as AuditAction) : undefined;

    this.auditLogService.getAuditLogs({
      page: this.page,
      limit: this.limit,
      search: search,
      tableName: tableQuery,
      action: actionQuery
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.auditLogs = res.data || [];
        this.paginationMeta = res.meta;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Gagal memuat data riwayat audit log.';
      }
    });
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadAuditLogs();
  }

  openDetailModal(log: AuditLog): void {
    this.selectedLog = log;
    this.isDetailModalOpen = true;
  }

  closeDetailModal(): void {
    this.isDetailModalOpen = false;
    this.selectedLog = null;
  }

  getTableLabel(tableName: string): string {
    switch (tableName) {
      case 'mst_employees': return 'Data Karyawan';
      case 'mst_departments': return 'Departemen';
      case 'mst_job_titles': return 'Jabatan';
      default: return tableName;
    }
  }

  exportToExcel(): void {
    this.isExporting = true;
    const tableQuery = this.selectedTableName !== 'all' ? this.selectedTableName : undefined;
    const actionQuery = this.selectedActionFilter !== 'all' ? (this.selectedActionFilter as AuditAction) : undefined;

    this.auditLogService.getAuditLogs({
      page: 1,
      limit: 1000,
      search: this.searchTerm,
      tableName: tableQuery,
      action: actionQuery
    }).subscribe({
      next: (res) => {
        this.isExporting = false;
        const rawData = res.data || [];
        if (rawData.length === 0) {
          this.errorMessage = 'Tidak ada data audit log untuk di-export.';
          return;
        }

        const formattedData = rawData.map((log, index) => ({
          'No': index + 1,
          'ID Audit': log.id,
          'Waktu Perubahan': log.createdAt ? new Date(log.createdAt).toLocaleString('id-ID') : '-',
          'Nama Tabel': this.getTableLabel(log.tableName),
          'ID Record': log.recordId,
          'Aksi': log.action.toUpperCase(),
          'Diubah Oleh': log.user?.username || 'Sistem / Admin',
          'Data Lama': log.oldValues ? JSON.stringify(log.oldValues) : '-',
          'Data Baru': log.newValues ? JSON.stringify(log.newValues) : '-'
        }));

        this.excelExportService.exportAsExcelFile(formattedData, 'Riwayat_Audit_Log', 'AuditLog');
      },
      error: (err) => {
        this.isExporting = false;
        this.errorMessage = err.error?.message || 'Gagal mengeksport data audit log ke Excel.';
      }
    });
  }

  formatJson(obj: any): string {
    if (!obj) return '-';
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  }
}
