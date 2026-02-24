
import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentService } from '../../services/student.service';
import * as d3 from 'd3';

interface MonthlyPayment {
  studentName: string;
  studentClass: string;
  studentId: number;
  amount: number;
  paymentDate: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private studentService = inject(StudentService);
  stats = this.studentService.dashboardStats;

  // Tabs state
  activeTab = signal<'overview' | 'reports'>('overview');
  
  // Print Modal State
  showPrintModal = signal(false);

  // Reports State
  selectedMonth = signal<string>(this.getCurrentMonthString());

  paymentsForSelectedMonth = computed(() => {
    const month = this.selectedMonth();
    if (!month) return [];

    const payments: MonthlyPayment[] = [];
    this.studentService.students().forEach(student => {
      student.installments.forEach(inst => {
        if (inst.paymentDate && inst.paymentDate.startsWith(month)) {
          payments.push({
            studentName: student.name,
            studentClass: student.class,
            studentId: student.id,
            amount: inst.amount,
            paymentDate: inst.paymentDate
          });
        }
      });
    });
    return payments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  });

  monthlySummary = computed(() => {
    const payments = this.paymentsForSelectedMonth();
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    const count = payments.length;
    return { total, count };
  });

  // Chart Data Computation
  chartData = computed(() => {
    // Reverse to show oldest to newest (Jan -> Dec)
    const data = [...this.stats().monthlyIncome].reverse();
    
    if (data.length === 0) return null;

    const margin = { top: 30, right: 30, bottom: 50, left: 60 };
    const width = 800; // SVG ViewBox width
    const height = 350; // SVG ViewBox height
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const x = d3.scaleBand()
      .domain(data.map(d => d.month))
      .range([0, innerWidth])
      .padding(0.4);

    const maxVal = d3.max(data, d => d.amount) || 0;
    const y = d3.scaleLinear()
      .domain([0, maxVal * 1.1]) // Add 10% headroom
      .range([innerHeight, 0]);

    const bars = data.map(d => ({
      x: x(d.month) || 0,
      y: y(d.amount),
      width: x.bandwidth(),
      height: innerHeight - y(d.amount),
      amount: d.amount,
      month: d.month,
      formattedMonth: this.formatMonthShort(d.month)
    }));
    
    // Generate Y-Axis Ticks (5 ticks)
    const yTicks = y.ticks(5).map(val => ({
        y: y(val),
        value: this.formatCurrencyCompact(val)
    }));

    return { 
        width, height, margin, 
        innerWidth, innerHeight,
        bars, yTicks 
    };
  });

  pieChartData = computed(() => {
    const data = this.stats().classIncome;
    if (data.length === 0) return null;

    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2;

    const colorScale = d3.scaleOrdinal<string, string>()
      .domain(data.map(d => d.className))
      .range(['#205043', '#2b7e65', '#458B73', '#7bd4b8', '#aee8d3', '#d5f5e8']);

    const pie = d3.pie<{className: string, amount: number}>()
      .value(d => d.amount)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<{className: string, amount: number}>>()
      .innerRadius(0)
      .outerRadius(radius);

    const arcs = pie(data).map(d => ({
      path: arc(d) || '',
      centroid: arc.centroid(d),
      color: colorScale(d.data.className),
      className: d.data.className,
      amount: d.data.amount,
      percentage: ((d.data.amount / this.stats().totalIncome) * 100).toFixed(0)
    }));

    return { width, height, arcs, radius };
  });

  lineChartData = computed(() => {
    const data = this.stats().yearlyGrowth;
    if (data.length === 0) return null;

    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = 400;
    const height = 250;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const x = d3.scalePoint()
      .domain(data.map(d => d.year))
      .range([0, innerWidth])
      .padding(0.5);

    const maxVal = d3.max(data, d => d.amount) || 0;
    const minVal = d3.min(data, d => d.amount) || 0;
    const y = d3.scaleLinear()
      .domain([Math.max(0, minVal * 0.8), maxVal * 1.1])
      .range([innerHeight, 0]);

    const line = d3.line<{year: string, amount: number}>()
      .x(d => x(d.year) || 0)
      .y(d => y(d.amount));

    const path = line(data) || '';

    const points = data.map(d => ({
      cx: x(d.year) || 0,
      cy: y(d.amount),
      year: d.year,
      amount: d.amount
    }));

    const yTicks = y.ticks(4).map(val => ({
        y: y(val),
        value: this.formatCurrencyCompact(val)
    }));

    return { width, height, margin, innerWidth, innerHeight, path, points, yTicks, xTicks: data.map(d => d.year), x };
  });

  // Month Navigation Logic
  changeMonth(offset: number) {
    const [year, month] = this.selectedMonth().split('-').map(Number);
    // Create date object (Months are 0-indexed in JS, so month - 1)
    // We set day to 1 to avoid issues with different month lengths
    const date = new Date(year, month - 1 + offset, 1);
    
    const newYear = date.getFullYear();
    const newMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    this.selectedMonth.set(`${newYear}-${newMonth}`);
  }
  
  formattedSelectedMonth = computed(() => {
      const [year, month] = this.selectedMonth().split('-');
      const date = new Date(Number(year), Number(month) - 1);
      return date.toLocaleDateString('ar-IQ', { month: 'long', year: 'numeric' }); 
  });

  setTab(tab: 'overview' | 'reports') {
      this.activeTab.set(tab);
  }

  openPrintModal() {
      this.showPrintModal.set(true);
  }

  closePrintModal() {
      this.showPrintModal.set(false);
  }

  confirmPrint() {
      window.print();
  }

  private getCurrentMonthString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'IQD', minimumFractionDigits: 0 }).format(amount);
  }

  formatCurrencyCompact(amount: number): string {
      // For chart axis: 1000 -> 1k, 1000000 -> 1M (Approx) or just standard concise format
      return new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(amount);
  }

  formatMonth(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleString('ar-IQ', { month: 'long', year: 'numeric' });
  }

  formatMonthShort(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleString('ar-IQ', { month: 'short' });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
