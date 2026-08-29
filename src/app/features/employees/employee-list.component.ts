import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { EmployeeService } from '../../core/services/employee.service';
import { JobTitleService } from '../../core/services/job-title.service';
import { DepartmentService } from '../../core/services/department.service';
import { Employee, EmployeeStatus, Gender } from '../../core/models/employee.model';
import { JobTitle } from '../../core/models/job-title.model';
import { Department } from '../../core/models/department.model';
import { PaginationMeta } from '../../core/models/api-response.model';

import { ExcelExportService } from '../../core/services/excel-export.service';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgSelectModule, NgbPaginationModule],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.css'
})
export class EmployeeListComponent implements OnInit, OnDestroy {
  private employeeService = inject(EmployeeService);
  private jobTitleService = inject(JobTitleService);
  private departmentService = inject(DepartmentService);
  private excelExportService = inject(ExcelExportService);
  private fb = inject(FormBuilder);

  employees: Employee[] = [];
  jobTitles: JobTitle[] = [];
  departments: Department[] = [];
  paginationMeta?: PaginationMeta;

  // Filters
  searchTerm: string = '';
  selectedDepartmentId: number | null = null;
  selectedJobTitleId: number | null = null;
  selectedStatusFilter: string = 'all';

  // Debounce Subjects & Subscriptions
  private searchSubject = new Subject<string>();
  private jobTitleSearchSubject = new Subject<string>();
  private deptSearchSubject = new Subject<string>();
  private subscriptions: Subscription[] = [];

  page: number = 1;
  limit: number = 10;
  isLoading: boolean = false;
  isJobTitleLoading: boolean = false;
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

  selectedEmployeeId: number | null = null;
  currentEmployeeName: string = '';

  // Reactive Form with all MstEmployee fields
  employeeForm: FormGroup = this.fb.group({
    employeeCode: ['', [Validators.maxLength(100)]],
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
    email: ['', [Validators.email, Validators.maxLength(255)]],
    jobTitleId: [null, [Validators.required]],
    departmentName: [{ value: '', disabled: true }],
    gender: ['male', [Validators.required]],
    phoneNumber: ['', [Validators.maxLength(15)]],
    address: ['', [Validators.maxLength(255)]],
    hireDate: [''],
    birthDate: [''],
    status: ['active', [Validators.required]]
  });

  ngOnInit(): void {
    this.setupDebounceSearch();
    this.setupDebounceFilterTypeaheads();
    this.loadEmployees();
    this.loadJobTitles('');
    this.loadDepartments('');

    // Listen to jobTitleId value changes to auto-fill departmentName
    const jobTitleSub = this.employeeForm.get('jobTitleId')?.valueChanges.subscribe(jobTitleId => {
      this.onJobTitleChange(jobTitleId);
    });
    if (jobTitleSub) this.subscriptions.push(jobTitleSub);
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
      this.loadEmployees(searchQuery);
    });
    this.subscriptions.push(searchSub);
  }

  private setupDebounceFilterTypeaheads(): void {
    const jobSub = this.jobTitleSearchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(term => {
      this.loadJobTitles(term);
    });
    this.subscriptions.push(jobSub);

    const deptSub = this.deptSearchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(term => {
      this.loadDepartments(term);
    });
    this.subscriptions.push(deptSub);
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadEmployees();
  }

  onJobTitleSearch(event: { term: string; items: any[] }): void {
    if (event && event.term !== undefined) {
      this.jobTitleSearchSubject.next(event.term);
    }
  }

  onDeptSearch(event: { term: string; items: any[] }): void {
    if (event && event.term !== undefined) {
      this.deptSearchSubject.next(event.term);
    }
  }

  loadEmployees(search: string = this.searchTerm): void {
    this.isLoading = true;
    this.errorMessage = null;

    const statusQuery = this.selectedStatusFilter !== 'all' ? (this.selectedStatusFilter as EmployeeStatus) : undefined;

    this.employeeService.getEmployees({
      page: this.page,
      limit: this.limit,
      search: search,
      departmentId: this.selectedDepartmentId || undefined,
      jobTitleId: this.selectedJobTitleId || undefined,
      status: statusQuery
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.employees = res.data || [];
        this.paginationMeta = res.meta;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Gagal memuat data karyawan dari server.';
      }
    });
  }

  loadJobTitles(search: string = ''): void {
    this.isJobTitleLoading = true;
    this.jobTitleService.getJobTitles({
      page: 1,
      limit: 100,
      search: search
    }).subscribe({
      next: (res) => {
        this.isJobTitleLoading = false;
        this.jobTitles = res.data || [];
      },
      error: () => {
        this.isJobTitleLoading = false;
      }
    });
  }

  loadDepartments(search: string = ''): void {
    this.isDeptLoading = true;
    this.departmentService.getDepartments({
      page: 1,
      limit: 100,
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

  // Auto-fill departmentName based on selected jobTitleId
  onJobTitleChange(jobTitleId: number | null): void {
    if (!jobTitleId) {
      this.employeeForm.patchValue({ departmentName: '' }, { emitEvent: false });
      return;
    }
    const foundJob = this.jobTitles.find(j => j.id === Number(jobTitleId));
    const deptName = foundJob?.department?.deptName || '-';
    this.employeeForm.patchValue({ departmentName: deptName }, { emitEvent: false });
  }

  // Validation Helper Methods for Bootstrap Classes
  isControlInvalid(controlName: string): boolean {
    const control = this.employeeForm.get(controlName);
    return !!(control && control.invalid && (control.touched || control.dirty || this.isFormSubmitted));
  }

  private formatDateForInput(dateStr?: string | null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  }

  // Create Modal Actions
  openCreateModal(): void {
    this.isFormSubmitted = false;
    this.employeeForm.reset({
      employeeCode: '',
      name: '',
      email: '',
      jobTitleId: null,
      departmentName: '',
      gender: 'male',
      phoneNumber: '',
      address: '',
      hireDate: '',
      birthDate: '',
      status: 'active'
    });
    this.errorMessage = null;
    this.isCreateModalOpen = true;
    this.loadJobTitles('');
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
    this.isFormSubmitted = false;
  }

  submitCreate(): void {
    this.isFormSubmitted = true;
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    const formVal = this.employeeForm.getRawValue();
    this.isSubmitting = true;
    this.errorMessage = null;

    this.employeeService.createEmployee({
      employeeCode: formVal.employeeCode ? formVal.employeeCode.trim() : undefined,
      name: formVal.name.trim(),
      email: formVal.email ? formVal.email.trim() : undefined,
      jobTitleId: Number(formVal.jobTitleId),
      gender: formVal.gender,
      phoneNumber: formVal.phoneNumber ? formVal.phoneNumber.trim() : undefined,
      address: formVal.address ? formVal.address.trim() : undefined,
      hireDate: formVal.hireDate || undefined,
      birthDate: formVal.birthDate || undefined,
      status: formVal.status
    }).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.closeCreateModal();
        this.showSuccessToast(res.message || 'Karyawan berhasil ditambahkan.');
        this.loadEmployees();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Gagal menambahkan karyawan.';
      }
    });
  }

  // Edit Modal Actions
  openEditModal(employee: Employee): void {
    this.isFormSubmitted = false;
    this.selectedEmployeeId = employee.id;
    this.currentEmployeeName = employee.name;

    const deptName = employee.jobTitle?.department?.deptName || '';

    this.employeeForm.reset({
      employeeCode: employee.employeeCode,
      name: employee.name,
      email: employee.email || '',
      jobTitleId: employee.jobTitleId,
      departmentName: deptName,
      gender: employee.gender || 'male',
      phoneNumber: employee.phoneNumber || '',
      address: employee.address || '',
      hireDate: this.formatDateForInput(employee.hireDate),
      birthDate: this.formatDateForInput(employee.birthDate),
      status: employee.status
    });

    this.errorMessage = null;
    this.isEditModalOpen = true;
    this.loadJobTitles('');
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.selectedEmployeeId = null;
    this.isFormSubmitted = false;
  }

  submitEdit(): void {
    this.isFormSubmitted = true;
    if (this.employeeForm.invalid || !this.selectedEmployeeId) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    const formVal = this.employeeForm.getRawValue();
    this.isSubmitting = true;
    this.errorMessage = null;

    this.employeeService.updateEmployee(this.selectedEmployeeId, {
      employeeCode: formVal.employeeCode.trim(),
      name: formVal.name.trim(),
      email: formVal.email ? formVal.email.trim() : undefined,
      jobTitleId: Number(formVal.jobTitleId),
      gender: formVal.gender,
      phoneNumber: formVal.phoneNumber ? formVal.phoneNumber.trim() : undefined,
      address: formVal.address ? formVal.address.trim() : undefined,
      hireDate: formVal.hireDate || undefined,
      birthDate: formVal.birthDate || undefined,
      status: formVal.status
    }).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.closeEditModal();
        this.showSuccessToast(res.message || 'Data karyawan berhasil diperbarui.');
        this.loadEmployees();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Gagal memperbarui data karyawan.';
      }
    });
  }

  // Delete Modal Actions
  openDeleteModal(employee: Employee): void {
    this.selectedEmployeeId = employee.id;
    this.currentEmployeeName = employee.name;
    this.errorMessage = null;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.selectedEmployeeId = null;
  }

  submitDelete(): void {
    if (!this.selectedEmployeeId) return;

    this.isSubmitting = true;
    this.errorMessage = null;

    this.employeeService.deleteEmployee(this.selectedEmployeeId).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.closeDeleteModal();
        this.showSuccessToast(res.message || 'Karyawan berhasil dihapus.');
        this.loadEmployees();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Gagal menghapus karyawan.';
      }
    });
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadEmployees();
  }

  exportToExcel(): void {
    this.isExporting = true;
    const statusQuery = this.selectedStatusFilter !== 'all' ? (this.selectedStatusFilter as EmployeeStatus) : undefined;

    this.employeeService.getEmployees({
      page: 1,
      limit: 1000,
      search: this.searchTerm,
      departmentId: this.selectedDepartmentId || undefined,
      jobTitleId: this.selectedJobTitleId || undefined,
      status: statusQuery
    }).subscribe({
      next: (res) => {
        this.isExporting = false;
        const rawData = res.data || [];
        if (rawData.length === 0) {
          this.errorMessage = 'Tidak ada data karyawan untuk di-export.';
          return;
        }

        const formattedData = rawData.map((emp, index) => ({
          'No': index + 1,
          'NIK / Kode Karyawan': emp.employeeCode || '-',
          'Nama Lengkap': emp.name,
          'Email': emp.email || '-',
          'Jenis Kelamin': emp.gender === 'female' ? 'Perempuan' : 'Laki-laki',
          'No. Telepon': emp.phoneNumber || '-',
          'Jabatan': emp.jobTitle?.titleName || '-',
          'Departemen': emp.jobTitle?.department?.deptName || '-',
          'Alamat': emp.address || '-',
          'Tanggal Lahir': emp.birthDate ? new Date(emp.birthDate).toLocaleDateString('id-ID') : '-',
          'Tanggal Masuk': emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('id-ID') : '-',
          'Status': emp.status === 'active' ? 'Aktif' : 'Nonaktif'
        }));

        this.excelExportService.exportAsExcelFile(formattedData, 'Data_Karyawan', 'Karyawan');
        this.showSuccessToast('Data karyawan berhasil di-export ke file Excel.');
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
