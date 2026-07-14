// API Service for Kebele Management System

const API_BASE = '/api/v1';

export interface APIErrorDetail {
  [key: string]: string | string[];
}

export class APIError extends Error {
  status: number;
  details?: APIErrorDetail;

  constructor(message: string, status: number, details?: APIErrorDetail) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.details = details;
  }
}

// Token Storage Helpers
export const getAccessToken = () => localStorage.getItem('access_token');
export const getRefreshToken = () => localStorage.getItem('refresh_token');

export const setTokens = (access: string, refresh?: string) => {
  localStorage.setItem('access_token', access);
  if (refresh) {
    localStorage.setItem('refresh_token', refresh);
  }
};

export const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

// Handle token refreshing logic
async function refreshAccessToken(): Promise<string> {
  const refresh = getRefreshToken();
  if (!refresh) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${API_BASE}/auth/token/refresh/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    clearTokens();
    window.location.href = '/login?expired=true';
    throw new Error('Session expired. Please log in again.');
  }

  const data = await response.json();
  setTokens(data.access);
  return data.access;
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiRequest(endpoint: string, options: RequestOptions = {}): Promise<any> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const headers = new Headers(options.headers || {});

  // Add auth header if token exists and not skipped
  const token = getAccessToken();
  if (token && !options.skipAuth) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set default Content-Type if not sending FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const fetchOptions = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, fetchOptions);

    if (response.status === 401 && getRefreshToken() && !options.skipAuth) {
      // Access token expired, attempt refresh
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newAccessToken = await refreshAccessToken();
          isRefreshing = false;
          onRefreshed(newAccessToken);
        } catch (error) {
          isRefreshing = false;
          clearTokens();
          window.location.href = '/login?expired=true';
          throw error;
        }
      }

      // Queue request until refresh completes
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(async (newToken) => {
          try {
            headers.set('Authorization', `Bearer ${newToken}`);
            const retryResponse = await fetch(url, { ...options, headers });
            resolve(await handleResponse(retryResponse));
          } catch (err) {
            reject(err);
          }
        });
      });
    }

    return await handleResponse(response);
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    // Network failure
    throw new APIError('Network error or connection timeout. Please check your internet connection.', 0);
  }
}

async function handleResponse(response: Response) {
  if (response.status === 204) {
    return null;
  }

  let data: any;
  const contentType = response.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (response.ok) {
    return data;
  }

  // Server error handling
  const status = response.status;
  let errorMessage = 'An unexpected error occurred.';
  let details: APIErrorDetail | undefined;

  if (status === 400 && data && typeof data === 'object') {
    details = data as APIErrorDetail;
    // Extract first error message for user convenience
    const firstKey = Object.keys(data)[0];
    if (firstKey) {
      const fieldError = data[firstKey];
      errorMessage = Array.isArray(fieldError) ? fieldError[0] : String(fieldError);
      // Format: "field: error message"
      if (firstKey !== 'non_field_errors' && firstKey !== 'detail') {
        const formattedKey = firstKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        errorMessage = `${formattedKey}: ${errorMessage}`;
      }
    }
  } else if (data && typeof data === 'object' && data.detail) {
    errorMessage = data.detail;
  } else if (status === 403) {
    errorMessage = 'Permission denied. You do not have access to this resource.';
  } else if (status === 404) {
    errorMessage = 'Requested resource not found.';
  } else if (status >= 500) {
    errorMessage = 'Server error. Our team has been notified. Please try again later.';
  }

  throw new APIError(errorMessage, status, details);
}
