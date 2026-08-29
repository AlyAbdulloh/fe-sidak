export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
  },
  EMPLOYEES: {
    BASE: '/employees',
    DETAIL: (id: number | string) => `/employees/${id}`,
  },
  DEPARTMENTS: {
    BASE: '/departments',
    DETAIL: (id: number | string) => `/departments/${id}`,
  },
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  USER_DATA: 'auth_user_data',
  THEME_MODE: 'app_theme_mode',
  SIDEBAR_COLLAPSED: 'app_sidebar_collapsed',
};
