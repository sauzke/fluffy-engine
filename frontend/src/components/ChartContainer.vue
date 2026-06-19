<template>
  <div class="chart-container">
    <div v-if="store.summary.length === 0" class="empty-state">
      <p>No data available for this month</p>
    </div>

    <div v-else class="charts-grid">
      <div class="chart-wrapper">
        <h4>Spending by Category ($)</h4>
        <PieChart :data="pieChartData" :options="chartOptions" />
      </div>

      <div class="chart-wrapper">
        <h4>Spending Distribution (%)</h4>
        <DoughnutChart :data="doughnutChartData" :options="chartOptions" />
      </div>

      <div class="summary-table">
        <h4>Category Summary</h4>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Amount</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in store.summary" :key="item.category.id">
              <td>
                <span
                  class="color-dot"
                  :style="{ backgroundColor: item.category.color }"
                ></span>
                {{ item.category.name }}
              </td>
              <td class="amount">${{ parseFloat(item.amount).toFixed(2) }}</td>
              <td class="percentage">{{ item.percentage }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Pie as PieChart, Doughnut as DoughnutChart } from 'vue-chartjs'
import { useBudgetStore } from '../stores/budgetStore'

ChartJS.register(ArcElement, Tooltip, Legend)

const store = useBudgetStore()

interface ChartOptions {
  responsive: boolean
  maintainAspectRatio: boolean
  plugins: {
    legend: {
      position: 'bottom'
    }
  }
}

const chartOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: 'bottom',
    },
  },
}

const pieChartData = computed(() => ({
  labels: store.summary.map((item) => item.category.name),
  datasets: [
    {
      label: 'Amount ($)',
      data: store.summary.map((item) => parseFloat(item.amount.toString())),
      backgroundColor: store.summary.map((item) => item.category.color),
    },
  ],
}))

const doughnutChartData = computed(() => ({
  labels: store.summary.map((item) => item.category.name),
  datasets: [
    {
      label: 'Percentage (%)',
      data: store.summary.map((item) => parseFloat(item.percentage)),
      backgroundColor: store.summary.map((item) => item.category.color),
    },
  ],
}))
</script>

<style scoped>
.chart-container {
  width: 100%;
}

.empty-state {
  text-align: center;
  color: #7f8c8d;
  padding: 2rem;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  justify-items: center;
}

.chart-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.chart-wrapper h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #2c3e50;
  font-size: 1rem;
}

.chart-wrapper > div {
  width: 100%;
  max-width: 300px;
}

.summary-table {
  grid-column: 1 / -1;
  width: 100%;
}

.summary-table h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #2c3e50;
  font-size: 1rem;
}

.summary-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.summary-table th {
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #bdc3c7;
  background-color: #ecf0f1;
}

.summary-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #ecf0f1;
}

.color-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 0.5rem;
  vertical-align: middle;
}

.amount {
  font-weight: 600;
  color: #e74c3c;
}

.percentage {
  font-weight: 500;
  color: #3498db;
}

@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .summary-table {
    grid-column: 1;
  }
}
</style>
