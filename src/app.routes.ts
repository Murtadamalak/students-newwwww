
import { Routes } from '@angular/router';

export const APP_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent),
    title: 'الرئيسية'
  },
  {
    path: 'students',
    loadComponent: () => import('./components/student-list/student-list.component').then(m => m.StudentListComponent),
    title: 'قائمة الطلاب'
  },
  {
    path: 'student/add',
    loadComponent: () => import('./components/student-add/student-add.component').then(m => m.StudentAddComponent),
    title: 'إضافة طالب جديد'
  },
  {
    path: 'student/:id',
    loadComponent: () => import('./components/student-detail/student-detail.component').then(m => m.StudentDetailComponent),
    title: 'تفاصيل الطالب'
  },
  {
    path: 'pay',
    loadComponent: () => import('./components/pay-installment/pay-installment.component').then(m => m.PayInstallmentComponent),
    title: 'تسديد قسط'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'لوحة التحكم والتقارير'
  },
  {
    path: 'settings',
    loadComponent: () => import('./components/settings/settings.component').then(m => m.SettingsComponent),
    title: 'الإعدادات'
  },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
