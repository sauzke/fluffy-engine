import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { format } from 'date-fns';
import { transactionsAPI, categoriesAPI } from '../api/client';

export const useBudgetStore = defineStore('budget', () => {
  // State
  const currentMonth = ref(format(new Date(), 'yyyy-MM'));
  const transactions = ref([]);
  const summary = ref([]);
  const categories = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const uploadingFile = ref(false);
  const uploadError = ref(null);

  // Computed
  const totalSpending = computed(() => {
    return transactions.value.reduce((sum, txn) => sum + parseFloat(txn.amount || 0), 0);
  });

  // Actions
  const setMonth = (month) => {
    currentMonth.value = month;
  };

  const fetchTransactions = async (month) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await transactionsAPI.getTransactions(month);
      transactions.value = response.data.transactions || [];
    } catch (err) {
      error.value = err.message;
      console.error('Error fetching transactions:', err);
    } finally {
      loading.value = false;
    }
  };

  const fetchSummary = async (month) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await transactionsAPI.getSummary(month);
      summary.value = response.data.summary || [];
    } catch (err) {
      error.value = err.message;
      console.error('Error fetching summary:', err);
    } finally {
      loading.value = false;
    }
  };

  const fetchSummaryByMonth = async (month) => {
    try {
      const response = await transactionsAPI.getSummary(month);
      return response.data.summary || [];
    } catch (err) {
      console.error(`Error fetching summary for ${month}:`, err);
      return [];
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getCategories();
      categories.value = response.data;
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const uploadFile = async (file) => {
    uploadingFile.value = true;
    uploadError.value = null;

    try {
      const response = await transactionsAPI.uploadFile(file);
      
      // Refresh transactions after upload
      await fetchTransactions(currentMonth.value);
      await fetchSummary(currentMonth.value);
      
      return response.data;
    } catch (err) {
      uploadError.value = err.message;
      console.error('Error uploading file:', err);
      throw err;
    } finally {
      uploadingFile.value = false;
    }
  };

  const refreshData = async () => {
    await Promise.all([
      fetchTransactions(currentMonth.value),
      fetchSummary(currentMonth.value),
    ]);
  };

  return {
    // State
    currentMonth,
    transactions,
    summary,
    categories,
    loading,
    error,
    uploadingFile,
    uploadError,

    // Computed
    totalSpending,

    // Actions
    setMonth,
    fetchTransactions,
    fetchSummary,
    fetchSummaryByMonth,
    fetchCategories,
    uploadFile,
    refreshData,
  };
});
