import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_N8N_WEBHOOK_BASE || 'http://localhost:5678/webhook',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('invoiceBotToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-Frontend-Source'] = 'invoice-pilot-react';
  return config;
});

export default api;
