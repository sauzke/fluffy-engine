<template>
  <div class="month-picker">
    <button @click="previousMonth" class="btn-nav">← Prev</button>
    <span class="month-display">{{ formattedMonth }}</span>
    <button 
      @click="nextMonth" 
      class="btn-nav"
      :disabled="!canGoNext"
    >
      Next →
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format, addMonths, parseISO } from 'date-fns'
import { useBudgetStore } from '../stores/budgetStore'

const store = useBudgetStore()

const currentDate = computed<Date>(() => {
  return parseISO(store.currentMonth + '-01')
})

const formattedMonth = computed<string>(() => {
  return format(currentDate.value, 'MMMM yyyy')
})

const todayMonth = computed<string>(() => {
  const today = new Date()
  return format(today, 'yyyy-MM')
})

const canGoNext = computed<boolean>(() => {
  const newDate = addMonths(currentDate.value, 1)
  const newMonth = format(newDate, 'yyyy-MM')
  return newMonth <= todayMonth.value
})

const previousMonth = async (): Promise<void> => {
  const newDate = addMonths(currentDate.value, -1)
  const newMonth = format(newDate, 'yyyy-MM')
  store.setMonth(newMonth)
  await store.refreshData()
}

const nextMonth = async (): Promise<void> => {
  if (!canGoNext.value) return
  const newDate = addMonths(currentDate.value, 1)
  const newMonth = format(newDate, 'yyyy-MM')
  store.setMonth(newMonth)
  await store.refreshData()
}
</script>

<style scoped>
.month-picker {
  display: flex;
  align-items: center;
  gap: 1rem;
  background-color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.btn-nav {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background-color 0.2s;
}

.btn-nav:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn-nav:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
  opacity: 0.6;
}

.month-display {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  min-width: 150px;
  text-align: center;
}

@media (max-width: 768px) {
  .month-picker {
    flex-direction: column;
    width: 100%;
  }

  .month-display {
    min-width: auto;
  }
}
</style>
