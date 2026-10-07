import axios, { AxiosError } from 'axios';

interface ApiErrorBody {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

export function apiErrorMessage(error: unknown): string {
  const err = error as AxiosError<ApiErrorBody>;
  const body = err.response?.data;
  if (body?.message) {
    return `${body.message} (${body.code})`;
  }
  if (err.response) {
    return `Request failed with status ${err.response.status}`;
  }
  return err.message || 'Request failed';
}

export default client;
