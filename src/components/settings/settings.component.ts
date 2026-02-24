
import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  settingsService = inject(SettingsService);
  notificationService = inject(NotificationService);
  fb = inject(FormBuilder);
  
  settings = this.settingsService.settings;
  isDarkMode = signal<boolean>(document.documentElement.classList.contains('dark'));

  settingsForm = this.fb.group({
    schoolName: ['', Validators.required],
    academicYear: ['', Validators.required], // Added back as simple text
    accountantName: ['', Validators.required],
    principalName: ['', Validators.required],
    schoolLogo: [null as string | null],
    showCurrencySymbol: [false]
  });

  constructor() {
    effect(() => {
        const current = this.settingsService.settings();
        this.settingsForm.patchValue({
            schoolName: current.schoolName,
            academicYear: current.academicYear,
            accountantName: current.accountantName,
            principalName: current.principalName,
            schoolLogo: current.schoolLogo,
            showCurrencySymbol: current.showCurrencySymbol
        });
    });
  }

  onLogoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.settingsForm.patchValue({ schoolLogo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  }

  removeLogo() {
      this.settingsForm.patchValue({ schoolLogo: null });
  }

  saveSettings() {
    if (this.settingsForm.valid) {
      this.settingsService.updateSettings(this.settingsForm.value as any);
      this.notificationService.show('تم حفظ الإعدادات بنجاح');
    }
  }
  
  toggleTheme() {
      this.isDarkMode.update(v => !v);
      if (this.isDarkMode()) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
      } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
      }
  }

  // Backup Data functionality
  downloadBackup() {
      const rawStudents = localStorage.getItem('student_installments_data_v1');
      const data = {
          settings: this.settingsService.settings(),
          students: rawStudents ? JSON.parse(rawStudents) : []
      };
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      this.notificationService.show('تم تحميل نسخة احتياطية كاملة');
  }
}
