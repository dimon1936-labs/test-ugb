const API_URL = 'http://localhost:4000';

export interface TransferRequest {
  fromAccount: string;
  toAccount: string;
  amount: number;
  currency?: string;
}

export interface TransferSuccess {
  status: 'success';
  transactionId: string;
  from: string;
  to: string;
  amount: number;
  currency: string;
  processedAt: string;
}

export interface TransferError {
  status: 'error';
  message: string;
  errors: string[];
}

export type TransferResponse = TransferSuccess | TransferError;

export interface Report {
  reportType: string;
  generatedAt: string;
  totalTransactions: number;
  totalVolume: number;
  currency: string;
}

export async function submitTransfer(data: TransferRequest): Promise<TransferResponse> {
  try {
    const response = await fetch(`${API_URL}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    return {
      status: 'error',
      message: 'Помилка з\'єднання',
      errors: [error instanceof Error ? error.message : 'Невідома помилка'],
    };
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${API_URL}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

export async function fetchLatestReport(): Promise<Report | null> {
  try {
    const response = await fetch(`${API_URL}/report`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchTransactions(): Promise<TransferSuccess[]> {
  try {
    const response = await fetch(`${API_URL}/transactions`);
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

export interface Rate {
  cc: string;
  rate: number;
  txt: string;
}

export interface RatesResponse {
  rates: Rate[];
  fetchedAt: string;
}

export async function fetchRates(): Promise<RatesResponse | null> {
  try {
    const response = await fetch(`${API_URL}/rates`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export interface NodeRedEvent {
  id: string;
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export async function fetchEvents(): Promise<NodeRedEvent[]> {
  try {
    const response = await fetch(`${API_URL}/events`);
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

export interface NodeRedStatus {
  status: 'connected' | 'disconnected';
  url: string;
  flows: string[];
}

export async function fetchNodeRedStatus(): Promise<NodeRedStatus | null> {
  try {
    const response = await fetch(`${API_URL}/node-red/status`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
