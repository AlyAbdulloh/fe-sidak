import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { JobTitleService } from '../../core/services/job-title.service';
import { DepartmentService } from '../../core/services/department.service';
import { JobTitle } from '../../core/models/job-title.model';
import { Department } from '../../core/models/department.model';
import { PaginationMeta } from '../../core/models/api-response.model';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

import { ExcelExportService } from '../../core/services/excel-export.service';

@Component({
  selector: 'app-job-title-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgSelectModule, NgbPaginationModule],
  templateUrl: './job-title-list.component.html',
  styleUrl: './job-title-list.component.css'
})
export class JobTitleListComponent implements OnInit, OnDestroy {
  private jobTitleService = inject(JobTitleService);
  private departmentService = inject(DepartmentService);
  private excelExportService = inject(ExcelExportService);
  private fb = inject(FormBuilder);

  jobTitles: JobTitle[] = [];
  departments: Department[] = [];
  paginationMeta?: PaginationMeta;

  // Filter States
  searchTerm: string = '';
  selectedDepartmentId: number | null = null;

  // Debounce Subjects
  private searchSubject = new Subject<string>();
  private deptSearchSubject = new Subject<string>();
  private subscriptions: Subscription[] = [];

  page: number = 1;
  limit: number = 10;
  isLoading: boolean = false;
  isDeptLoading: boolean = false;
  isExporting: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Modal States
  isCreateModalOpen: boolean = false;
  isEditModalOpen: boolean = false;
  isDeleteModalOpen: boolean = false;
  isSubmitting: boolean = false;
  isFormSubmitted: boolean = false;

  currentJobTitle: { titleName: string; departmentId: number | null } = {
    titleName: '',
    departmentId: null
  };
  selectedJobTitleId: number | null = null;

  // Reactive Form
  jobTitleForm: FormGroup = this.fb.group({
    titleName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    departmentId: [null, [Validators.required]]
  });

  ngOnInit(): void {
    this.setupDebounceSearch();
    this.setupDebounceDeptSearch();
    this.loadJobTitles();
    this.loadDepartments('');
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
      this.loadJobTitles(searchQuery, this.selectedDepartmentId);
    });
    this.subscriptions.push(searchSub);
  }

  private setupDebounceDeptSearch(): void {
    const deptSub = this.deptSearchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(deptQuery => {
      this.loadDepartments(deptQuery);
    });
    this.subscriptions.push(deptSub);
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  onDepartmentFilterChange(): void {
    this.page = 1;
    this.loadJobTitles(this.searchTerm, this.selectedDepartmentId);
  }

  onDeptSearch(event: { term: string; items: any[] }): void {
    if (event && event.term !== undefined) {
      this.deptSearchSubject.next(event.term);
    }
  }

  loadJobTitles(search: string = this.searchTerm, departmentId: number | null = this.selectedDepartmentId): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.jobTitleService.getJobTitles({
      page: this.page,
      limit: this.limit,
      search: search,
      departmentId: departmentId || undefined
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.jobTitles = response.data || [];
        this.paginationMeta = response.meta;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Gagal memuat data jabatan dari server.';
      }
    });
  }

  loadDepartments(search: string = ''): void {
    this.isDeptLoading = true;
    this.departmentService.getDepartments({
      page: 1,
      limit: 50,
      search: search
    }).subscribe({
      next: (res) => {
        this.isDeptLoading = false;
        this.departments = res.data || [];
      },
      error: () => {
        this.isDeptLoading = false;
      }
    });
  }

  // Validation Helper Methods for Bootstrap Classes
  isControlInvalid(controlName: string): boolean {
    const control = this.jobTitleForm.get(controlName);
    return !!(control && control.invalid && (control.touched || control.dirty || this.isFormSubmitted));
  }

  // Create Modal Actions
  openCreateModal(): void {
    this.isFormSubmitted = false;
    this.jobTitleForm.reset({ titleName: '', departmentId: null });
    this.currentJobTitle = { titleName: '', departmentId: null };
    this.errorMessage = null;
    this.isCreateModalOpen = true;
    this.loadDepartments('');
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
    this.isFormSubmitted = false;
  }

  submitCreate(): void {
    this.isFormSubmitted = true;
    if (this.jobTitleForm.invalid) {
      this.jobTitleForm.markAllAsTouched();
      return;
    }

    const formVal = this.jobTitleForm.value;
    this.isSubmitting = true;
    this.errorMessage = null;

    this.jobTitleService.createJobTitle({
      titleName: formVal.titleName.trim(),
      departmentId: Number(formVal.departmentId)
    }).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.closeCreateModal();
        this.showSuccessToast(res.message || 'Jabatan berhasil ditambahkan.');
        this.loadJobTitles();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Gagal menambahkan jabatan.';
      }
    });
  }

  // Edit Modal Actions
  openEditModal(jobTitle: JobTitle): void {
    this.isFormSubmitted = false;
    this.selectedJobTitleId = jobTitle.id;
    this.currentJobTitle = {
      titleName: jobTitle.titleName,
      departmentId: jobTitle.departmentId
    };
    this.jobTitleForm.reset({
      titleName: jobTitle.titleName,
      departmentId: jobTitle.departmentId
    });
    this.errorMessage = null;
    this.isEditModalOpen = true;
    this.loadDepartments('');
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.selectedJobTitleId = null;
    this.isFormSubmitted = false;
  }

  submitEdit(): void {
    this.isFormSubmitted = true;
    if (this.jobTitleForm.invalid || !this.selectedJobTitleId) {
      this.jobTitleForm.markAllAsTouched();
      return;
    }

    const formVal = this.jobTitleForm.value;
    this.isSubmitting = true;
    this.errorMessage = null;

    this.jobTitleService.updateJobTitle(this.selectedJobTitleId, {
      titleName: formVal.titleName.trim(),
      departmentId: Number(formVal.departmentId)
    }).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.closeEditModal();
        this.showSuccessToast(res.message || 'Jabatan berhasil diperbarui.');
        this.loadJobTitles();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Gagal memperbarui jabatan.';
      }
    });
  }

  // Delete Modal Actions
  openDeleteModal(jobTitle: JobTitle): void {
    this.selectedJobTitleId = jobTitle.id;
    this.currentJobTitle = {
      titleName: jobTitle.titleName,
      departmentId: jobTitle.departmentId
    };
    this.errorMessage = null;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.selectedJobTitleId = null;
  }

  submitDelete(): void {
    if (!this.selectedJobTitleId) return;

    this.isSubmitting = true;
    this.errorMessage = null;

    this.jobTitleService.deleteJobTitle(this.selectedJobTitleId).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.closeDeleteModal();
        this.showSuccessToast(res.message || 'Jabatan berhasil dihapus.');
        this.loadJobTitles();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Gagal menghapus jabatan.';
      }
    });
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadJobTitles();
  }

  exportToExcel(): void {
    this.isExporting = true;
    this.jobTitleService.getJobTitles({
      page: 1,
      limit: 1000,
      search: this.searchTerm,
      departmentId: this.selectedDepartmentId || undefined
    }).subscribe({
      next: (res) => {
        this.isExporting = false;
        const rawData = res.data || [];
        if (rawData.length === 0) {
          this.errorMessage = 'Tidak ada data jabatan untuk di-export.';
          return;
        }

        const formattedData = rawData.map((job, index) => ({
          'No': index + 1,
          'ID Jabatan': job.id,
          'Nama Jabatan': job.titleName,
          'Departemen': job.department?.deptName || '-',
          'Tanggal Dibuat': job.createdAt ? new Date(job.createdAt).toLocaleDateString('id-ID') : '-'
        }));

        this.excelExportService.exportAsExcelFile(formattedData, 'Data_Jabatan', 'Jabatan');
        this.showSuccessToast('Data jabatan berhasil di-export ke file Excel.');
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
