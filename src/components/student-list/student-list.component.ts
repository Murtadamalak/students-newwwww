
import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { Student } from '../../models/student.model';

type StudentWithCalculations = Student & { totalPaid: number; remaining: number };

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './student-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentListComponent {
  studentService = inject(StudentService);
  private router = inject(Router);

  sortKey = signal<keyof StudentWithCalculations | null>('name');
  sortDirection = signal<'asc' | 'desc'>('asc');

  studentsWithCalculations = computed(() => {
    return this.studentService.students().map(student => {
      const totalPaid = this.studentService.calculateTotalPaid(student);
      const remaining = student.totalFee - totalPaid;
      return { ...student, totalPaid, remaining };
    });
  });

  sortedStudents = computed(() => {
    const key = this.sortKey();
    const direction = this.sortDirection();
    const students = [...this.studentsWithCalculations()];

    if (!key) {
      return students;
    }

    students.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];

      let comparison = 0;
      if (valA > valB) {
        comparison = 1;
      } else if (valA < valB) {
        comparison = -1;
      }
      return direction === 'asc' ? comparison : -comparison;
    });

    return students;
  });

  applySort(key: keyof StudentWithCalculations) {
    if (this.sortKey() === key) {
      this.sortDirection.update(dir => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(key);
      this.sortDirection.set('asc');
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'IQD', minimumFractionDigits: 0 }).format(amount);
  }

  viewStudent(studentId: number): void {
    this.router.navigate(['/student', studentId]);
  }
}
