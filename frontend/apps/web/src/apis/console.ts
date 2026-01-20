import api from './index';

export interface ConsoleKey {
  id: number;
  name: string | null;
  key_preview: string;
  created_at: string;
}

export interface UsageSummary {
  total_requests: number;
  success_rate: number;
  avg_latency_ms: number;
  traffic: number[];
  top_endpoints: Array<{
    endpoint: string;
    method: string;
    status: string;
    count: number;
  }>;
}

export interface BillingSummary {
  total_30d: number;
  history: Array<{
    date: string;
    amount: number;
    status: string;
  }>;
  next_billing_date: string;
}

export const loginConsole = async (token: string): Promise<void> => {
  await api.post('/console/auth/login', { token });
};

export const logoutConsole = async (): Promise<void> => {
  await api.post('/console/auth/logout');
};

export const checkConsoleAuth = async (): Promise<void> => {
  await api.get('/console/auth/me');
};

export const fetchConsoleKeys = async (): Promise<ConsoleKey[]> => {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    return [
      { id: 1, name: 'Production Key (Mock)', key_preview: 'ck_live...001', created_at: '2026.01.17' },
      { id: 2, name: 'Development Key (Mock)', key_preview: 'ck_test...002', created_at: '2026.01.10' },
    ];
  }
  const response = await api.get('/console/keys');
  return response.data;
};

export const fetchUsageSummary = async (): Promise<UsageSummary> => {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    return {
      total_requests: 1240842,
      success_rate: 99.98,
      avg_latency_ms: 24,
      traffic: [30, 60, 40, 80, 50, 90, 70, 40, 100, 60, 40, 85],
      top_endpoints: [
        { endpoint: '/api/ai/generate', method: 'POST', status: '200', count: 1200 },
        { endpoint: '/api/ai/generate', method: 'POST', status: '500', count: 4 },
      ],
    };
  }
  const response = await api.get('/console/usage/summary');
  return response.data;
};

export const fetchBillingSummary = async (): Promise<BillingSummary> => {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    return {
      total_30d: 452100,
      history: [
        { date: '2026-01', amount: 154000, status: 'Paid' },
        { date: '2025-12', amount: 142000, status: 'Paid' },
        { date: '2025-11', amount: 168000, status: 'Refund' },
      ],
      next_billing_date: '2026-02-01',
    };
  }
  const response = await api.get('/console/billing/summary');
  return response.data;
};
