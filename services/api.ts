export interface User {
    id: string;
    email: string;
    full_name: string;
    organization_id?: string;
    gemini_api_key?: string;
}

export interface ResourceShare {
    id: string;
    resource_type: 'document' | 'playbook';
    resource_id: string;
    target_organization_id: string;
    permission: 'read' | 'write';
    shared_by_user_id: string;
    created_at: string;
}

export interface ResourceShareList {
    shares: ResourceShare[];
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

    private async requestNoContent(endpoint: string, options: RequestInit = {}): Promise<void> {
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
    }

    async getMe(): Promise<User> {
        return this.request<User>('/users/me');
    }

    // ============================================================
    // DOCUMENT SHARING
    // ============================================================

    async shareDocument(
        documentId: string,
        targetOrgId: string,
        permission: 'read' | 'write' = 'read'
    ): Promise<ResourceShare> {
        return this.request<ResourceShare>(`/documents/${documentId}/share`, {
            method: 'POST',
            body: JSON.stringify({
                target_organization_id: targetOrgId,
                permission,
            }),
        });
    }

    async getDocumentShares(documentId: string): Promise<ResourceShare[]> {
        const response = await this.request<ResourceShareList>(`/documents/${documentId}/shares`);
        return response.shares;
    }

    async revokeDocumentShare(documentId: string, targetOrgId: string): Promise<void> {
        return this.requestNoContent(`/documents/${documentId}/shares/${targetOrgId}`, {
            method: 'DELETE',
        });
    }

    // ============================================================
    // PLAYBOOK SHARING
    // ============================================================

    async sharePlaybook(
        playbookId: string,
        targetOrgId: string,
        permission: 'read' | 'write' = 'read'
    ): Promise<ResourceShare> {
        return this.request<ResourceShare>(`/playbooks/${playbookId}/share`, {
            method: 'POST',
            body: JSON.stringify({
                target_organization_id: targetOrgId,
                permission,
            }),
        });
    }

    async getPlaybookShares(playbookId: string): Promise<ResourceShare[]> {
        const response = await this.request<ResourceShareList>(`/playbooks/${playbookId}/shares`);
        return response.shares;
    }

    async revokePlaybookShare(playbookId: string, targetOrgId: string): Promise<void> {
        return this.requestNoContent(`/playbooks/${playbookId}/shares/${targetOrgId}`, {
            method: 'DELETE',
        });
    }
}

export const api = new ApiClient();

