import { ApiError, Task, TaskListResponse, User } from '../types/api';

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

let isRefreshing = false;
let refreshSubscribers: ((ok: boolean) => void)[] = [];

function subscribeTokenRefresh(cb: (ok: boolean) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(ok: boolean) {
  refreshSubscribers.forEach((cb) => cb(ok));
  refreshSubscribers = [];
}

export async function request<T>(
  url: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const headers = new Headers(options.headers || {});

  // Attach double-submit CSRF token if cookie is present
  const csrfToken = getCookie('votex_csrf_token');
  if (csrfToken && !headers.has('x-csrf-token')) {
    headers.set('x-csrf-token', csrfToken);
  }

  // Ensure JSON content type if body is string
  if (options.body && typeof options.body === 'string' && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Handle 401 Unauthorized with single-flight silent refresh mutex
  if (response.status === 401 && retry && !url.includes('/auth/login') && !url.includes('/auth/refresh')) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refRes = await fetch('/api/v1/auth/refresh', {
          method: 'POST',
          credentials: 'include',
          headers: csrfToken ? { 'x-csrf-token': csrfToken } : {},
        });
        isRefreshing = false;
        if (refRes.ok) {
          onRefreshed(true);
          return request<T>(url, options, false);
        } else {
          onRefreshed(false);
          window.dispatchEvent(new CustomEvent('votex-unauthorized'));
        }
      } catch (e) {
        isRefreshing = false;
        onRefreshed(false);
        window.dispatchEvent(new CustomEvent('votex-unauthorized'));
      }
    } else {
      // Queue requests until refresh completes
      return new Promise<T>((resolve, reject) => {
        subscribeTokenRefresh((ok) => {
          if (ok) {
            resolve(request<T>(url, options, false));
          } else {
            reject(new Error('Session expired'));
          }
        });
      });
    }
  }

  if (response.status === 204) {
    return null as unknown as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err: ApiError = data.error || {
      code: 'API_ERROR',
      message: response.statusText || 'Request failed',
    };
    throw err;
  }

  return data as T;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ user: User }>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (email: string, password: string, invite_code?: string) =>
      request<{ user: User }>('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, invite_code }),
      }),
    refresh: () =>
      request<{ user: User }>('/api/v1/auth/refresh', {
        method: 'POST',
      }),
    logout: () =>
      request<void>('/api/v1/auth/logout', {
        method: 'POST',
      }),
    me: () => request<User>('/api/v1/auth/me'),
  },
  tasks: {
    create: (formData: FormData) =>
      request<Task>('/api/v1/tasks', {
        method: 'POST',
        body: formData,
      }),
    list: (page = 1, pageSize = 20, status?: string) => {
      const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
      if (status) params.append('status', status);
      return request<TaskListResponse>(`/api/v1/tasks?${params.toString()}`);
    },
    get: (id: string) => request<Task>(`/api/v1/tasks/${id}`),
    delete: (id: string) =>
      request<void>(`/api/v1/tasks/${id}`, {
        method: 'DELETE',
      }),
  },
  studio: {
    getLanguages: () =>
      request<Array<{ code: string; name: string; native: string }>>('/api/v1/studio/languages'),
    process: (formData: FormData) =>
      request<import('../types/api').StudioResult>('/api/v1/studio/process', {
        method: 'POST',
        body: formData,
      }),
  },
};
