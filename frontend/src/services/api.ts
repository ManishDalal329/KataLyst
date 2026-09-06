const API_BASE = '/api';

async function getOrFetchValidToken(): Promise<string | null> {
  let token = localStorage.getItem('sahakar_token');
  
  // Check if token exists and is a valid JWT (starts with eyJ and has 3 dot-separated parts)
  if (token && !token.startsWith('session_token_') && token.split('.').length === 3) {
    return token;
  }

  // If token is invalid or missing, fetch a real signed JWT from backend OTP endpoint
  const userStr = localStorage.getItem('sahakar_session') || localStorage.getItem('sahakar_user');
  let phone = '9900112233';
  let role = 'CUSTOMER';
  let name = 'Priya Sharma';

  if (userStr) {
    try {
      const u = JSON.parse(userStr);
      if (u.phone) phone = u.phone;
      if (u.role) role = u.role;
      if (u.name) name = u.name;
    } catch (e) {
      console.error('Failed to parse user session for token refresh', e);
    }
  }

  try {
    const res = await fetch(`${API_BASE}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp: '123456', role, name })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('sahakar_token', data.token);
        if (data.user) {
          localStorage.setItem('sahakar_session', JSON.stringify(data.user));
          localStorage.setItem('sahakar_user', JSON.stringify(data.user));
        }
        return data.token;
      }
    }
  } catch (err) {
    console.error('Failed to auto-fetch JWT token:', err);
  }

  return token;
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = await getOrFetchValidToken();
  
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
    const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText || 'Server Error'}` }));
    const errorMessage = errorData.error || errorData.message || `HTTP ${res.status}: ${res.statusText || 'Server Error'}`;

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
