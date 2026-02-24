
import { Injectable, signal, effect } from '@angular/core';
import { AppSettings } from '../models/settings.model';

const SETTINGS_KEY = 'app_settings_v1';

const defaultSettings: AppSettings = {
  schoolName: 'مدرسة المستقبل الأهلية',
  accountantName: 'مرتضى',
  academicYear: '2025-2026',
  principalName: 'أ. محمد العراقي',
  schoolLogo: null,
  showCurrencySymbol: false
};

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  settings = signal<AppSettings>(this.loadSettings());

  constructor() {
    effect(() => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings()));
    });
  }

  private loadSettings(): AppSettings {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Clean up any old data fields if they exist
      const { availableYears, ...cleanParsed } = parsed;
      return { ...defaultSettings, ...cleanParsed };
    }
    return defaultSettings;
  }

  updateSettings(newSettings: Partial<AppSettings>) {
    this.settings.update(current => ({ ...current, ...newSettings }));
  }

  resetToDefaults() {
      this.settings.set(defaultSettings);
  }
}
