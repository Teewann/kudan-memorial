const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

function getToken() {
  return localStorage.getItem('token');
}

export async function api<T>(
  path: string,
  options: RequestInit & { formData?: FormData } = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.formData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    body: options.formData ?? options.body,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `request_failed_${res.status}`);
  }
  return res.json();
}

export function setToken(token: string) {
  localStorage.setItem('token', token);
}
export function clearToken() {
  localStorage.removeItem('token');
}
export function isLoggedIn() {
  return Boolean(getToken());
}

// Resizes an image in the browser before upload — this is what keeps photo
// storage small and list pages fast (never ship full-size photos).
export function compressImage(file: File, maxWidth = 1000): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => { img.src = reader.result as string; };
    reader.onerror = reject;
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('compress_failed'))), 'image/jpeg', 0.8);
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}
