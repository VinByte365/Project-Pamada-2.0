import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});
