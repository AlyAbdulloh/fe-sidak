import { Component, OnInit, OnDestroy, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { DashboardStats } from '../../core/models/dashboard.model';
import { Chart, PieController, ArcElement, Tooltip, Legend } from 'chart.js';

Chart.register(PieController, ArcElement, Tooltip, Legend);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  private dashboardService = inject(DashboardService);

  stats: DashboardStats | null = null;
  isLoading: boolean = true;
  errorMessage: string | null = null;
  pieChart: Chart | null = null;

  get currentUser() {
    return this.authService.currentUser();
  }

  currentDateFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  ngOnDestroy(): void {
    if (this.pieChart) {
      this.pieChart.destroy();
    }
  }

  loadDashboardStats(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.dashboardService.getDashboardStats().subscribe({
      next: (res) => {
        this.isLoading = false;
        this.stats = res.data;
        setTimeout(() => {
          this.renderPieChart();
        }, 100);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Gagal memuat data statistik dashboard.';
      }
    });
  }

  private renderPieChart(): void {
    if (!this.stats || !this.stats.departmentDistribution || this.stats.departmentDistribution.length === 0) {
      return;
    }

    const canvas = document.getElementById('deptPieChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.pieChart) {
      this.pieChart.destroy();
    }

    const labels = this.stats.departmentDistribution.map(d => d.deptName);
    const dataCounts = this.stats.departmentDistribution.map(d => d.employeeCount);

    const softColors = [
      '#2563eb', // Blue
      '#10b981', // Emerald
      '#f59e0b', // Amber
      '#06b6d4', // Cyan
      '#8b5cf6', // Violet
      '#ec4899', // Pink
      '#64748b'  // Slate
    ];

    this.pieChart = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: dataCounts,
          backgroundColor: softColors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              boxWidth: 10,
              padding: 16,
              font: {
                size: 12,
                family: "'Plus Jakarta Sans', sans-serif"
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const val = context.parsed || 0;
                const total = dataCounts.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                return ` ${label}: ${val} Karyawan (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }
}
