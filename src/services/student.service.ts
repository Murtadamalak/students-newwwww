
import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Student } from '../models/student.model';
import { SettingsService } from './settings.service';

const STORAGE_KEY = 'student_installments_data_v1';

const initialStudents: Student[] = [
  {
    id: 1,
    name: 'أحمد علي',
    class: 'الصف الخامس',
    guardianPhone: '07701234567',
    totalFee: 700000,
    notes: 'طالب متفوق',
    photoUrl: 'https://picsum.photos/seed/ahmed/200/200',
    installments: [
      { amount: 100000, paymentDate: '2025-09-05' },
      { amount: 100000, paymentDate: '2025-10-02' },
      { amount: 50000, paymentDate: '2025-11-10' },
      { amount: 50000, paymentDate: '2025-11-10' },
      { amount: 0, paymentDate: null },
      { amount: 0, paymentDate: null },
      { amount: 0, paymentDate: null },
      { amount: 0, paymentDate: null },
    ],
  },
  {
    id: 2,
    name: 'فاطمة الزهراء',
    class: 'الصف السادس',
    guardianPhone: '07809876543',
    totalFee: 850000,
    notes: '',
    photoUrl: 'https://picsum.photos/seed/fatima/200/200',
    installments: [
      { amount: 150000, paymentDate: '2025-09-08' },
      { amount: 150000, paymentDate: '2025-10-06' },
      { amount: 0, paymentDate: null },
      { amount: 0, paymentDate: null },
      { amount: 0, paymentDate: null },
      { amount: 0, paymentDate: null },
      { amount: 0, paymentDate: null },
    ],
  },
];

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  private settingsService = inject(SettingsService);

  // Contains ALL students
  private allStudentsState = signal<Student[]>(this.loadFromStorage());

  // Expose all students directly without filtering
  students = computed(() => this.allStudentsState());

  dashboardStats = computed(() => {
    const students = this.students();
    const totalIncome = students.reduce((total, student) => total + this.calculateTotalPaid(student), 0);
    const totalExpected = students.reduce((total, student) => total + student.totalFee, 0);
    const totalRemaining = totalExpected - totalIncome;
    const studentCount = students.length;

    const monthlyIncome = new Map<string, number>();
    const classIncome = new Map<string, number>();
    const yearlyGrowth = new Map<string, number>();

    students.forEach(student => {
        const studentTotalPaid = this.calculateTotalPaid(student);
        if (studentTotalPaid > 0) {
            const currentClassTotal = classIncome.get(student.class) || 0;
            classIncome.set(student.class, currentClassTotal + studentTotalPaid);
        }

        student.installments.forEach(inst => {
            if (inst.paymentDate && inst.amount > 0) {
                const monthKey = inst.paymentDate.substring(0, 7); // "YYYY-MM"
                const currentMonthTotal = monthlyIncome.get(monthKey) || 0;
                monthlyIncome.set(monthKey, currentMonthTotal + inst.amount);

                const yearKey = inst.paymentDate.substring(0, 4); // "YYYY"
                const currentYearTotal = yearlyGrowth.get(yearKey) || 0;
                yearlyGrowth.set(yearKey, currentYearTotal + inst.amount);
            }
        });
    });
    
    const monthlyIncomeArray = Array.from(monthlyIncome.entries())
        .map(([key, amount]) => ({ month: key, amount }))
        .sort((a, b) => b.month.localeCompare(a.month));

    const classIncomeArray = Array.from(classIncome.entries())
        .map(([key, amount]) => ({ className: key, amount }))
        .sort((a, b) => b.amount - a.amount);

    const yearlyGrowthArray = Array.from(yearlyGrowth.entries())
        .map(([key, amount]) => ({ year: key, amount }))
        .sort((a, b) => a.year.localeCompare(b.year));

    return {
        totalIncome,
        totalExpected,
        totalRemaining,
        studentCount,
        monthlyIncome: monthlyIncomeArray,
        classIncome: classIncomeArray,
        yearlyGrowth: yearlyGrowthArray
    };
  });

  constructor() {
    effect(() => {
      const currentStudents = this.allStudentsState();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentStudents));
      } catch (e) {
        console.error('Error saving to localStorage:', e);
      }
    });
  }

  private loadFromStorage(): Student[] {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData) as any[];
        // Map to ensure clean structure (remove old academicYear if present)
        return parsed.map(s => ({
            id: s.id,
            name: s.name,
            class: s.class,
            guardianPhone: s.guardianPhone,
            totalFee: s.totalFee,
            notes: s.notes,
            photoUrl: s.photoUrl,
            installments: s.installments
        }));
      }
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
    return initialStudents;
  }

  getStudentById(id: number) {
    return computed(() => this.allStudentsState().find((s) => s.id === id));
  }

  addStudent(studentData: Omit<Student, 'id' | 'installments'>) {
    const installments = Array.from({ length: 7 }, () => ({
      amount: 0,
      paymentDate: null as string | null
    }));

    const newStudent: Student = {
      ...studentData,
      id: Date.now(),
      installments: installments,
    };
    this.allStudentsState.update((students) => [...students, newStudent]);
  }

  updateStudent(updatedStudent: Student) {
    this.allStudentsState.update((students) =>
      students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
    );
  }

  deleteStudent(id: number) {
    this.allStudentsState.update((students) => students.filter((s) => s.id !== id));
  }

  calculateTotalPaid(student: Student): number {
    return student.installments.reduce((sum, i) => sum + i.amount, 0);
  }
}
