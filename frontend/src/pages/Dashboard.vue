<template>
  <div v-if="store.error" class="error">
    <p>{{ store.error }}</p>
  </div>

  <div v-else class="content">
    <div class="card dashboard-card">
      <h3>Dashboard</h3>
      <div class="month-controls">
        <div class="date-picker-wrapper">
          <input 
            type="month" 
            :value="store.currentMonth"
            :max="maxMonth"
            @change="handleMonthChange"
            class="date-picker"
          />
        </div>
        <MonthPicker />
      </div>
    </div>

    <div class="card upload-card">
      <FileUpload />
    </div>

    <div class="dashboard-grid">
      <div class="card total-spending">
        <h3>Total Spending</h3>
        <p class="amount">${{ store.totalSpending.toFixed(2) }}</p>
      </div>

      <div class="card transaction-count">
        <h3>Transactions</h3>
        <p class="count">{{ store.transactions.length }}</p>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="card">
        <h3>Category Breakdown</h3>
        <ChartContainer />
      </div>
    </div>

    <div class="card">
      <h3>Recent Transactions</h3>
      <TransactionList />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useBudgetStore } from '../stores/budgetStore'
import MonthPicker from '../components/MonthPicker.vue'
import FileUpload from '../components/FileUpload.vue'
import TransactionList from '../components/TransactionList.vue'
import ChartContainer from '../components/ChartContainer.vue'

const store = useBudgetStore()

const maxMonth = computed<string>(() => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
})

const handleMonthChange = async (event: Event): Promise<void> => {
  const target = event.target as HTMLInputElement
  const newMonth = target.value
  // Prevent clearing the value
  if (!newMonth) {
    target.value = store.currentMonth
    return
  }
  store.setMonth(newMonth)
  await store.refreshData()
}

onMounted(async () => {
  await store.fetchCategories()
  await store.refreshData()
})
</script>

<style scoped>
.loading,
.error {
  text-align: center;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  font-size: 1.1rem;
}

.error {
  color: #e74c3c;
  background-color: #fadbd8;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.card {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #2c3e50;
  font-size: 1.1rem;
}

.dashboard-card h3 {
  font-size: 1.8rem;
}

.total-spending .amount {
  font-size: 2.5rem;
  font-weight: bold;
  color: #27ae60;
  margin: 0;
}

.transaction-count .count {
  font-size: 2.5rem;
  font-weight: bold;
  color: #3498db;
  margin: 0;
}

.dashboard-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.5rem;
}

.dashboard-card h3 {
  margin: 0 0 1.5rem 0;
  width: 100%;
  text-align: left;
}

.upload-card {
  width: 100%;
}

.month-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 2rem;
}

.date-picker-wrapper {
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 300px;
}

.date-picker {
  width: 100%;
  padding: 0.875rem 1.25rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
  color: #2c3e50;
  cursor: pointer;
  background-color: #f9fafb;
  font-weight: 500;
  transition: all 0.2s ease;
}

.date-picker:hover {
  border-color: #3498db;
  background-color: white;
}

.date-picker:focus {
  outline: none;
  border-color: #3498db;
  background-color: white;
  box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.1);
}

.upload-card {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1.5rem;
}
</style>
