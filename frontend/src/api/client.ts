import axios, { AxiosInstance } from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

interface Transaction {
  id: number
  description: string
  amount: number
  date: string
  external_id: string | null
  categoryId: number
  uploadId: number | null
  createdAt: string
  updatedAt: string
  category: Category
}

interface Category {
  id: number
  name: string
  color: string
  createdAt?: string
  updatedAt?: string
}

interface Upload {
  id: number
  filename: string
  filepath: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  transactionCount: number
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

interface TransactionsResponse {
  month: string
  count: number
  transactions: Transaction[]
}

interface SummaryItem {
  category: Category
  amount: number
  count: number
  percentage: string
}

interface SummaryResponse {
  month: string
  totalSpending: string
  summary: SummaryItem[]
}

interface UploadResponse {
  success: boolean
  uploadId: number
  transactionCount: number
  duplicateCount?: number
}

const client: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
})

export const transactionsAPI = {
  getTransactions(month: string) {
    return client.get<TransactionsResponse>('/transactions', { params: { month } })
  },

  getSummary(month: string) {
    return client.get<SummaryResponse>('/summary', { params: { month } })
  },

  uploadFile(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return client.post<UploadResponse>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}

export const categoriesAPI = {
  getCategories() {
    return client.get<Category[]>('/categories')
  },

  createCategory(name: string, color: string) {
    return client.post<Category>('/categories', { name, color })
  },
}

export default client
export type { Transaction, Category, Upload, TransactionsResponse, SummaryResponse, UploadResponse }
