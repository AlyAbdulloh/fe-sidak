/**
 * Standard Pagination Metadata returned by NestJS TransformInterceptor
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  [key: string]: any;
}

/**
 * Generic API Response matching NestJS TransformInterceptor
 */
export interface ApiResponse<T = any> {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data: T;
  meta?: PaginationMeta;
  timestamp?: string;
}

/**
 * Specialized response type for paginated endpoint results
 */
export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Standard API Error Response structure
 */
export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp?: string;
  path?: string;
}
