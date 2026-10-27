import appConfig from 'modules/shared/services/config/appConfig';

const prefix = appConfig.storagePrefix;

export const AUTH_TOKEN_STORAGE_KEY = `${prefix}:auth-token`;
export const AUTH_SESSION_STORAGE_KEY = `${prefix}:auth-session`;
export const CONTENT_MODULES_STORAGE_KEY = `${prefix}:content-modules`;
export const USER_PROGRESS_STORAGE_KEY = `${prefix}:user-progress`;
export const UI_PREFERENCES_STORAGE_KEY = `${prefix}:ui-preferences`;
