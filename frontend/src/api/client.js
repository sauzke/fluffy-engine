import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

export const transactionsAPI = {
  getTransactions(month) {
    return client.get('/transactions', { params: { month } });
  },

  getSummary(month) {
    return client.get('/summary', { params: { month } });
  },

  uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    return client.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const categoriesAPI = {
  getCategories() {
    return client.get('/categories');
  },

  createCategory(name, color) {
    return client.post('/categories', { name, color });
  },
};

export default client;
