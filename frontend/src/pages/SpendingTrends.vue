<template>
  <div class="spending-trends">
    <div class="card trends-header">
      <h2>Spending Trends</h2>
    </div>

    <div class="card filters-section">
      <TimeRangeSelector @range-selected="onRangeSelected" />
    </div>

    <div class="card chart-section">
      <TrendChart 
        :date-range="selectedDateRange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TimeRangeSelector from '../components/TimeRangeSelector.vue'
import TrendChart from '../components/TrendChart.vue'

interface DateRange {
  startMonth: string
  endMonth: string
}

const selectedDateRange = ref<DateRange>({
  startMonth: '',
  endMonth: ''
})

const onRangeSelected = (range: DateRange): void => {
  selectedDateRange.value = range
}
</script>

<style scoped>
.spending-trends {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.trends-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.8rem;
}

.filters-section {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  align-items: flex-start;
}

.chart-section {
  min-height: 600px;
  flex: 1;
}

.chart-section {
  min-height: 400px;
  display: flex;
  flex-direction: column;
}
</style>
