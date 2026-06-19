<template>
  <div class="time-range-selector">
    <div class="label">Time Range</div>
    
    <div class="button-group">
      <button 
        class="quick-select"
        :class="{ active: selectedRange === '6-months' }"
        @click="selectRange('6-months')"
      >
        Last 6 Months
      </button>
      <button 
        class="quick-select"
        :class="{ active: selectedRange === '12-months' }"
        @click="selectRange('12-months')"
      >
        Last 12 Months
      </button>
      <button 
        class="quick-select"
        :class="{ active: selectedRange === 'custom' }"
        @click="selectRange('custom')"
      >
        Custom Range
      </button>
    </div>

    <div v-if="selectedRange === 'custom'" class="custom-range">
      <div class="input-group">
        <label for="start-month">Start Month:</label>
        <input 
          id="start-month"
          type="month"
          v-model="customStart"
          @change="updateCustomRange"
          class="month-input"
        />
      </div>
      <div class="input-group">
        <label for="end-month">End Month:</label>
        <input 
          id="end-month"
          type="month"
          v-model="customEnd"
          @change="updateCustomRange"
          class="month-input"
          :max="currentMonth"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { format, subMonths } from 'date-fns'

interface DateRange {
  startMonth: string
  endMonth: string
}

const emit = defineEmits<{
  'range-selected': [range: DateRange]
}>()

const selectedRange = ref<'6-months' | '12-months' | 'custom'>('6-months')
const customStart = ref<string>('')
const customEnd = ref<string>('')

const currentMonth = computed<string>(() => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
})

const getMonthsRange = (monthCount: number): DateRange => {
  const endDate = new Date()
  endDate.setDate(1)
  const startDate = subMonths(endDate, monthCount - 1)

  const startMonth = format(startDate, 'yyyy-MM')
  const endMonth = format(endDate, 'yyyy-MM')

  return { startMonth, endMonth }
}

const selectRange = (range: '6-months' | '12-months' | 'custom'): void => {
  selectedRange.value = range

  if (range === '6-months') {
    const dateRange = getMonthsRange(6)
    emit('range-selected', dateRange)
  } else if (range === '12-months') {
    const dateRange = getMonthsRange(12)
    emit('range-selected', dateRange)
  } else if (range === 'custom') {
    // Initialize with sensible defaults
    customEnd.value = currentMonth.value
    customStart.value = getMonthsRange(6).startMonth
  }
}

const updateCustomRange = (): void => {
  if (customStart.value && customEnd.value) {
    if (customStart.value <= customEnd.value) {
      emit('range-selected', {
        startMonth: customStart.value,
        endMonth: customEnd.value
      })
    }
  }
}

// Initialize with 6 months range
selectRange('6-months')
</script>

<style scoped>
.time-range-selector {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95rem;
}

.button-group {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.quick-select {
  padding: 0.6rem 1.2rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  background-color: white;
  color: #2c3e50;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.95rem;
}

.quick-select:hover {
  border-color: #3498db;
  background-color: #f0f8ff;
}

.quick-select.active {
  background-color: #3498db;
  color: white;
  border-color: #3498db;
}

.custom-range {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.input-group label {
  font-size: 0.9rem;
  color: #2c3e50;
  font-weight: 500;
  white-space: nowrap;
}

.month-input {
  padding: 0.6rem 0.9rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.95rem;
  color: #2c3e50;
  cursor: pointer;
  background-color: #f9fafb;
  transition: all 0.2s ease;
}

.month-input:hover {
  border-color: #3498db;
}

.month-input:focus {
  outline: none;
  border-color: #3498db;
  background-color: white;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}
</style>
