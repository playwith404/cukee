import api from './index';

export interface AdminConsoleToken {
  id: number;
  name: string | null;
  token_preview: string;
  created_at: string;
  is_revoked: boolean;
}

export interface AdminApiKey {
  id: number;
  owner_token_id: number;
  name: string | null;
  key_preview: string;
  created_at: string;
  is_revoked: boolean;
}

export const adminLogin = async (token: string): Promise<void> => {
  await api.post('/admin/auth/login', { token });
};

export const adminLogout = async (): Promise<void> => {
  await api.post('/admin/auth/logout');
};

export const checkAdminAuth = async (): Promise<void> => {
  await api.get('/admin/auth/me');
};

export const fetchConsoleTokens = async (): Promise<AdminConsoleToken[]> => {
  const response = await api.get('/admin/console-tokens');
  return response.data;
};

export const createConsoleToken = async (
  name?: string
): Promise<{ id: number; name: string | null; token: string; api_key: string; created_at: string; }> => {
  const response = await api.post('/admin/console-tokens', { name: name || null });
  return response.data;
};

export const revokeConsoleToken = async (tokenId: number): Promise<void> => {
  await api.post(`/admin/console-tokens/${tokenId}/revoke`);
};

export const fetchApiKeys = async (): Promise<AdminApiKey[]> => {
  const response = await api.get('/admin/api-keys');
  return response.data;
};

export const createApiKey = async (
  ownerTokenId: number,
  name?: string
): Promise<{ id: number; owner_token_id: number; name: string | null; key: string; created_at: string; }> => {
  const response = await api.post('/admin/api-keys', { owner_token_id: ownerTokenId, name: name || null });
  return response.data;
};

export const revokeApiKey = async (keyId: number): Promise<void> => {
  await api.post(`/admin/api-keys/${keyId}/revoke`);
};
