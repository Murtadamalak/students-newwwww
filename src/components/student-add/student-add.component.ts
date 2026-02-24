
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-student-add',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './student-add.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentAddComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private studentService = inject(StudentService);
  private notificationService = inject(NotificationService);

  readonly grades = [
    'الأول الابتدائي',
    'الثاني الابتدائي',
    'الثالث الابتدائي',
    'الرابع الابتدائي',
    'الخامس الابتدائي',
    'السادس الابتدائي'
  ];

  studentForm = this.fb.group({
    name: ['', Validators.required],
    class: ['', Validators.required],
    guardianPhone: ['', Validators.required],
    totalFee: [0, [Validators.required, Validators.min(1)]],
    notes: [''],
    photoUrl: [null as string | null],
  });

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

  onSubmit(): void {
    if (this.studentForm.valid) {
      const formData = this.studentForm.value;
      const studentData = {
          name: formData.name || '',
          class: formData.class || '',
          guardianPhone: formData.guardianPhone || '',
          totalFee: formData.totalFee || 0,
          notes: formData.notes || '',
          photoUrl: formData.photoUrl || null
      };
      this.studentService.addStudent(studentData);
      this.notificationService.show('تمت إضافة الطالب بنجاح!');
      this.router.navigate(['/students']);
    }
  }
}
