
export interface User {
    id: string;
    email: string;
    full_name: string;
    organization_id?: string;
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    full_name: string;
}

export interface BackendConfig {
    gemini_api_key?: string;
    // Add other config fields as needed
}

const API_BASE = '/api/v1';

class ApiClient {
    private token: string | null = localStorage.getItem('access_token');

    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers,
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                this.logout();
                throw new Error('Unauthorized');
            }
            const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(error.detail || `API Error: ${response.statusText}`);
        }

        return response.json();
    }

    public setToken(token: string) {
        this.token = token;
        localStorage.setItem('access_token', token);
    }

    public logout() {
        this.token = null;
        localStorage.removeItem('access_token');
        // Optional: Dispatch event or callback to update UI
    }

    public isAuthenticated(): boolean {
        return !!this.token;
    }

    // --- Auth Endpoints ---

    async login(formData: URLSearchParams): Promise<AuthResponse> {
        // FastAPI OAuth2PasswordRequestForm expects form data
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Login failed' }));
            throw new Error(error.detail || 'Login failed');
        }

        const data: AuthResponse = await response.json();
        this.setToken(data.access_token);
        return data;
    }

    async register(data: RegisterRequest): Promise<User> {
        return this.request<User>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getMe(): Promise<User> {
        return this.request<User>('/users/me');
    }

    // --- Config / LLM ---

    async getGeminiKey(): Promise<{ apiKey: string }> {
        return this.request<{ apiKey: string }>('/llm/key');
    }
}

export const api = new ApiClient();
