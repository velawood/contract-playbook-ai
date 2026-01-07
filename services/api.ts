export interface User {
    id: string;
    email: string;
    full_name: string;
    organization_id?: string;
    gemini_api_key?: string;
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

class ApiClient {
    private token: string | null = null;

    /**
     * Set the auth token for API calls.
     * This should be called with a token from Clerk's getToken().
     */
    public setToken(token: string | null) {
        this.token = token;
    }

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
                throw new Error('Unauthorized');
            }
            const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(error.detail || `API Error: ${response.statusText}`);
        }

        return response.json();
    }

    async getMe(): Promise<User> {
        return this.request<User>('/users/me');
    }
}

export const api = new ApiClient();
