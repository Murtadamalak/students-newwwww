
import { Component, ChangeDetectionStrategy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { StudentService } from '../../services/student.service';
import { NotificationService } from '../../services/notification.service';
import { SettingsService } from '../../services/settings.service';
import { Student } from '../../models/student.model';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './student-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private studentService = inject(StudentService);
  private notificationService = inject(NotificationService);
  private settingsService = inject(SettingsService);
  private fb = inject(FormBuilder);
  
  settings = this.settingsService.settings;

  readonly grades = [
    'الأول الابتدائي',
    'الثاني الابتدائي',
    'الثالث الابتدائي',
    'الرابع الابتدائي',
    'الخامس الابتدائي',
    'السادس الابتدائي'
  ];

  student = computed(() => {
    const id = this.route.snapshot.paramMap.get('id');
    return this.studentService.students().find(s => s.id === Number(id));
  });

  isEditing = signal(false);
  fontSizeClass = signal('text-base');
  showPrintModal = signal(false);
  showDeleteModal = signal(false);

  readonly printDate = new Date().toLocaleDateString('ar-IQ');

  studentForm = this.fb.group({
    id: [0],
    name: ['', Validators.required],
    class: ['', Validators.required],
    guardianPhone: ['', Validators.required],
    totalFee: [0, [Validators.required, Validators.min(1)]],
    notes: [''],
    photoUrl: [null as string | null],
    installments: this.fb.array([])
  });

  constructor() {
    effect(() => {
      const currentStudent = this.student();
      if (currentStudent) {
        this.studentForm.patchValue(currentStudent);
      }
    });
  }

  totalPaid = computed(() => {
    const s = this.student();
    return s ? this.studentService.calculateTotalPaid(s) : 0;
  });

  remainingBalance = computed(() => {
    const s = this.student();
    return s ? s.totalFee - this.totalPaid() : 0;
  });

  toggleEditMode(): void {
    if (this.student()) {
        this.isEditing.set(!this.isEditing());
        if (this.isEditing()) {
            this.studentForm.patchValue(this.student()!);
        }
    }
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.studentForm.patchValue({ photoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  }
  
  saveChanges(): void {
    if (this.studentForm.valid) {
      this.studentService.updateStudent(this.studentForm.value as Student);
      this.notificationService.show('تم تحديث بيانات الطالب بنجاح!');
      this.isEditing.set(false);
    }
  }

  // Delete Functionality
  confirmDelete(): void {
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
  }

  performDelete(): void {
    const s = this.student();
    if (s) {
        this.studentService.deleteStudent(s.id);
        this.notificationService.show('تم حذف الطالب بنجاح.');
        this.router.navigate(['/students']);
    }
  }

  triggerPrint(): void {
    this.showPrintModal.set(true);
  }
  
  executePrint(): void {
      window.print();
  }
  
  closePrintModal(): void {
      this.showPrintModal.set(false);
  }

  toggleFontSize(): void {
    this.fontSizeClass.update(current => {
        if (current === 'text-base') return 'text-lg';
        if (current === 'text-lg') return 'text-xl';
        return 'text-base';
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'IQD', minimumFractionDigits: 0 }).format(amount);
  }
}
