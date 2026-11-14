import { User } from '../types';

export function buildAuthHeaders(user: Pick<User, 'id' | 'role' | 'name'> | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (user) {
    headers['x-user-id'] = user.id;
    headers['x-user-role'] = user.role;
    headers['x-user-name'] = encodeURIComponent(user.name || '');
  }
  return headers;
}

export async function catalogFetch<T = any>(
  url: string,
  options: RequestInit = {},
  user: Pick<User, 'id' | 'role' | 'name'> | null = null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (user) {
    headers['x-user-id'] = user.id;
    headers['x-user-role'] = user.role;
    // Express header values must be ASCII-safe; use ID/role + optional ASCII fallback
    headers['x-user-name'] = encodeURIComponent(user.name || '');
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data as T;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('تعذر قراءة الملف المحدد.'));
    reader.readAsDataURL(file);
  });
}
