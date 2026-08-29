import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DepartmentService } from '../../core/services/department.service';
import { Department } from '../../core/models/department.model';
import { PaginationMeta } from '../../core/models/api-response.model';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

import { ExcelExportService } from '../../core/services/excel-export.service';

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbPaginationModule],
  templateUrl: './department-list.component.html',
  styleUrl: './department-list.component.css'
})
export class DepartmentListComponent implements OnInit, OnDestroy {
  private departmentService = inject(DepartmentService);
  private excelExportService = inject(ExcelExportService);
  private fb = inject(FormBuilder);

  departments: Department[] = [];
  paginationMeta?: PaginationMeta;
  
  searchTerm: string = '';
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  page: number = 1;
  limit: number = 10;
  isLoading: boolean = false;
  isExporting: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Modal State
  isCreateModalOpen: boolean = false;
  isEditModalOpen: boolean = false;
  isDeleteModalOpen: boolean = false;
  isSubmitting: boolean = false;
  isFormSubmitted: boolean = false;

  currentDepartment: Partial<Department> = { deptName: '' };
  selectedDepartmentId: number | null = null;

  // Reactive Form
  departmentForm: FormGroup = this.fb.group({
    deptName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]]
  });

  ngOnInit(): void {
    this.setupDebounceSearch();
    this.loadDepartments();
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  private setupDebounceSearch(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(searchQuery => {
      this.page = 1;
      this.loadDepartments(searchQuery);
    });
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  loadDepartments(search: string = this.searchTerm): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.departmentService.getDepartments({
      page: this.page,
      limit: this.limit,
      search: search
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.departments = response.data || [];
        this.paginationMeta = response.meta;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Gagal memuat data departemen dari server.';
      }
    });
  }

  // Validation Helper Methods for Bootstrap Classes
  isControlInvalid(controlName: string): boolean {
    const control = this.departmentForm.get(controlName);
    return !!(control && control.invalid && (control.touched || control.dirty || this.isFormSubmitted));
  }

  // Create Modal Actions
  openCreateModal(): void {
    this.isFormSubmitted = false;
    this.departmentForm.reset({ deptName: '' });
    this.currentDepartment = { deptName: '' };
    this.errorMessage = null;
    this.isCreateModalOpen = true;
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
    this.isFormSubmitted = false;
  }

  submitCreate(): void {
    this.isFormSubmitted = true;
    if (this.departmentForm.invalid) {
      this.departmentForm.markAllAsTouched();
      return;
    }

    const formVal = this.departmentForm.value;
    this.isSubmitting = true;
    this.errorMessage = null;

    this.departmentService.createDepartment({
      deptName: formVal.deptName.trim()
    }).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.closeCreateModal();
        this.showSuccessToast(res.message || 'Departemen berhasil ditambahkan.');
        this.loadDepartments();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Gagal menambahkan departemen.';
      }
    });
  }

  // Edit Modal Actions
  openEditModal(dept: Department): void {
    this.isFormSubmitted = false;
    this.selectedDepartmentId = dept.id;
    this.currentDepartment = { deptName: dept.deptName };
    this.departmentForm.reset({ deptName: dept.deptName });
    this.errorMessage = null;
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.selectedDepartmentId = null;
    this.isFormSubmitted = false;
  }

  submitEdit(): void {
    this.isFormSubmitted = true;
    if (this.departmentForm.invalid || !this.selectedDepartmentId) {
      this.departmentForm.markAllAsTouched();
      return;
    }

    const formVal = this.departmentForm.value;
    this.isSubmitting = true;
    this.errorMessage = null;

    this.departmentService.updateDepartment(this.selectedDepartmentId, {
      deptName: formVal.deptName.trim()
    }).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.closeEditModal();
        this.showSuccessToast(res.message || 'Departemen berhasil diperbarui.');
        this.loadDepartments();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Gagal memperbarui departemen.';
      }
    });
  }

  // Delete Modal Actions
  openDeleteModal(dept: Department): void {
    this.selectedDepartmentId = dept.id;
    this.currentDepartment = { deptName: dept.deptName };
    this.errorMessage = null;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.selectedDepartmentId = null;
  }

  submitDelete(): void {
    if (!this.selectedDepartmentId) return;

    this.isSubmitting = true;
    this.errorMessage = null;

    this.departmentService.deleteDepartment(this.selectedDepartmentId).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.closeDeleteModal();
        this.showSuccessToast(res.message || 'Departemen berhasil dihapus.');
        this.loadDepartments();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Gagal menghapus departemen.';
      }
    });
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadDepartments();
  }

  exportToExcel(): void {
    this.isExporting = true;
    this.departmentService.getDepartments({
      page: 1,
      limit: 1000,
      search: this.searchTerm
    }).subscribe({
      next: (res) => {
        this.isExporting = false;
        const rawData = res.data || [];
        if (rawData.length === 0) {
          this.errorMessage = 'Tidak ada data departemen untuk di-export.';
          return;
        }

        const formattedData = rawData.map((dept, index) => ({
          'No': index + 1,
          'ID Departemen': dept.id,
          'Nama Departemen': dept.deptName,
          'Tanggal Dibuat': dept.createdAt ? new Date(dept.createdAt).toLocaleDateString('id-ID') : '-'
        }));

        this.excelExportService.exportAsExcelFile(formattedData, 'Data_Departemen', 'Departemen');
        this.showSuccessToast('Data departemen berhasil di-export ke file Excel.');
      },
      error: (err) => {
        this.isExporting = false;
        this.errorMessage = err.error?.message || 'Gagal mengeksport data ke Excel.';
      }
    });
  }

  private showSuccessToast(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => {
      this.successMessage = null;
    }, 4000);
  }
}
