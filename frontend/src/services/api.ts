const API_BASE = '/api';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('sahakar_token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Request failed' }));
    const errorMessage = errorData.error || `HTTP ${res.status}`;

    // Handle expired or invalid session token gracefully
    if (res.status === 401 || (res.status === 403 && errorMessage.toLowerCase().includes('token'))) {
      localStorage.removeItem('sahakar_token');
      localStorage.removeItem('sahakar_user');
      window.dispatchEvent(new CustomEvent('sahakar:session_expired'));
    }

    throw new Error(errorMessage);
  }

  return res.json();
}
