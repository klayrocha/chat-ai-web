import { InjectionToken } from '@angular/core';
import { environment } from '../environments/environment';

;

export type AppConfig = {
  apiBase: string;
};

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');

export const appConfig: AppConfig = {
  apiBase: environment.apiBase,
};
