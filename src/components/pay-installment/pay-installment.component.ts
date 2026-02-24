
import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentService } from '../../services/student.service';
import { NotificationService } from '../../services/notification.service';
import { SettingsService } from '../../services/settings.service';
import { Student } from '../../models/student.model';

@Component({
  selector: 'app-pay-installment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pay-installment.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PayInstallmentComponent {
  studentService = inject(StudentService);
  notificationService = inject(NotificationService);
  settingsService = inject(SettingsService);
  
  settings = this.settingsService.settings;

  searchTerm = signal('');
  selectedStudent = signal<Student | null>(null);
  // To track what changed in this session for the receipt
  originalStudent = signal<Student | null>(null);
  
  showReceiptModal = signal(false);
  receiptId = signal<string>('');
  receiptDate = signal<string>('');
  receiptNotes = signal('');

  filteredStudents = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const students = this.studentService.students();
    if (!term) return students;
    return students.filter(s =>
      s.name.toLowerCase().includes(term)
    );
  });

  selectStudent(student: Student) {
    // Create deep copies for editing and comparison
    this.selectedStudent.set(JSON.parse(JSON.stringify(student)));
    this.originalStudent.set(JSON.parse(JSON.stringify(student)));
    this.searchTerm.set('');
  }

  updateInstallment(monthIndex: number, event: Event) {
    const input = event.target as HTMLInputElement;
    // Remove non-numeric characters (commas, spaces, etc.)
    const rawValue = input.value.replace(/[^0-9]/g, '');
    const newAmount = rawValue === '' ? 0 : Number(rawValue);

    this.selectedStudent.update(student => {
      if (student) {
        const newStudent = { ...student };
        const newInstallments = [...newStudent.installments];
        const oldAmount = newInstallments[monthIndex].amount;

        newInstallments[monthIndex] = {
            ...newInstallments[monthIndex],
            amount: newAmount,
            // Set date if payment is new and positive, clear if zeroed
            paymentDate: newAmount > 0 && oldAmount === 0 
                ? new Date().toISOString().split('T')[0] 
                : (newAmount === 0 ? null : newInstallments[monthIndex].paymentDate)
        };
        newStudent.installments = newInstallments;
        return newStudent;
      }
      return null;
    });
  }
  
  addInstallment() {
    this.selectedStudent.update(student => {
        if (student) {
            return {
                ...student,
                installments: [...student.installments, { amount: 0, paymentDate: null }]
            };
        }
        return null;
    });
  }

  savePayments() {
    const student = this.selectedStudent();
    if (student) {
      this.studentService.updateStudent(student);
      this.notificationService.show(`تم تحديث أقساط الطالب ${student.name}`);
      this.selectedStudent.set(null);
      this.originalStudent.set(null);
    }
  }
  
  cancel() {
      this.selectedStudent.set(null);
      this.originalStudent.set(null);
  }

  // Logic for the Receipt
  
  openReceiptModal() {
      // Generate ID and Date once when opening
      this.receiptId.set('#' + Math.floor(100000 + Math.random() * 900000).toString());
      // Format date without seconds
      this.receiptDate.set(new Date().toLocaleString('ar-IQ', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
      }));
      this.receiptNotes.set('');
      this.showReceiptModal.set(true);
  }

  closeReceiptModal() {
      this.showReceiptModal.set(false);
  }

  printReceipt() {
      window.print();
  }

  // Computes the difference between original state and current state
  currentPaymentDetails = computed(() => {
      const current = this.selectedStudent();
      const original = this.originalStudent();
      
      if (!current || !original) return { total: 0, items: [] };

      const items: { monthIndex: number, amount: number }[] = [];
      let total = 0;

      current.installments.forEach((inst, index) => {
          const originalAmount = original.installments[index]?.amount || 0;
          // We consider it a "New Payment" if the amount increased
          if (inst.amount > originalAmount) {
              const diff = inst.amount - originalAmount;
              items.push({
                  monthIndex: index + 1,
                  amount: diff
              });
              total += diff;
          }
      });

      return { total, items };
  });

  totalPaid = computed(() => {
    const student = this.selectedStudent();
    return student ? this.studentService.calculateTotalPaid(student) : 0;
  });

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'IQD', minimumFractionDigits: 0 }).format(amount);
  }

  formatReceiptNumber(amount: number): string {
    return new Intl.NumberFormat('ar-IQ', { style: 'decimal', minimumFractionDigits: 0 }).format(amount);
  }

  formatNumber(amount: number): string {
    return new Intl.NumberFormat('en-US').format(amount);
  }
}
