
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
    private sanitizer = inject(DomSanitizer);

    features = [
    {
      title: 'لوحة التحكم',
      description: 'إحصائيات شاملة، تقارير شهرية، ومتابعة فورية.',
      link: '/dashboard',
      icon: 'chart-pie',
      color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
    },
    {
      title: 'قائمة الطلاب',
      description: 'إدارة سجلات الطلاب، البحث، وتفاصيل الدفع.',
      link: '/students',
      icon: 'users',
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
    },
    {
      title: 'تسجيل طالب',
      description: 'إضافة طالب جديد وتحديد الأقساط الدراسية.',
      link: '/student/add',
      icon: 'user-plus',
      color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
    },
    {
      title: 'تسديد قسط',
      description: 'تسجيل الدفعات الشهرية وإصدار الوصلات.',
      link: '/pay',
      icon: 'currency-dollar',
      color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
    }
  ];

  getIcon(icon: string): SafeHtml {
    const icons: {[key: string]: string} = {
        'users': `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
        
        'user-plus': `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>`,
        
        'currency-dollar': `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="12" y1="15" x2="12" y2="15"/><line x1="12" y1="5" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="19"/></svg>`,
        
        'chart-pie': `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>`
    };
    return this.sanitizer.bypassSecurityTrustHtml(icons[icon] || '');
  }
}
