<template>
  <div class="trend-chart-container">
    <div class="chart-controls">
      <div class="chart-type-toggle">
        <button 
          class="toggle-btn"
          :class="{ active: chartType === 'line' }"
          @click="chartType = 'line'"
        >
          📈 Line Chart
        </button>
        <button 
          class="toggle-btn"
          :class="{ active: chartType === 'bar' }"
          @click="chartType = 'bar'"
        >
          📊 Bar Chart
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <p>Loading chart data...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
    </div>

    <div v-else class="chart-wrapper">
      <Line 
        v-if="chartType === 'line'"
        :data="chartData"
        :options="chartOptions"
      />
      <Bar 
        v-else
        :data="chartData"
        :options="chartOptions"
      />
    </div>

    <div class="summary-stats">
      <div class="stat">
        <span class="stat-label">Total Spending</span>
        <span class="stat-value">${{ totalSpending.toFixed(2) }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Average Monthly</span>
        <span class="stat-value">${{ averageMonthly.toFixed(2) }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Highest Month</span>
        <span class="stat-value">${{ highestMonth.toFixed(2) }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Lowest Month</span>
        <span class="stat-value">${{ lowestMonth.toFixed(2) }}</span>
      </div>
    </div>

    <div class="category-stats-panel">
      <h3>Statistics by Category</h3>
      <div class="category-stats-grid">
        <div v-for="cat in categoryStats" :key="cat.id" class="category-stat-card">
          <div class="category-header">
            <div class="category-color" :style="{ backgroundColor: cat.color }"></div>
            <h4>{{ cat.name }}</h4>
          </div>
          <div class="category-metrics">
            <div class="metric-row">
              <span class="metric-label">Total:</span>
              <span class="metric-value">${{ cat.total.toFixed(2) }}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Average:</span>
              <span class="metric-value">${{ cat.average.toFixed(2) }}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Highest:</span>
              <span class="metric-value">${{ cat.highest.toFixed(2) }}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Lowest:</span>
              <span class="metric-value">${{ cat.lowest.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Line, Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { useBudgetStore } from '../stores/budgetStore'
import { eachMonthOfInterval, format, parseISO } from 'date-fns'
import type { SummaryItem } from '../api/client'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

interface DateRange {
  startMonth: string
  endMonth: string
}

interface CategoryData {
  name: string
  color: string
  amount: number
}

interface ProcessedMonth {
  month: string
  categories: Record<string, CategoryData>
}

interface CategoryLookupItem {
  name: string
  color: string
}

interface CategoryStatItem {
  id: string
  name: string
  color: string
  total: number
  average: number
  highest: number
  lowest: number
}

const props = defineProps<{
  dateRange: DateRange
}>()

const store = useBudgetStore()
const chartType = ref<'line' | 'bar'>('line')
const loading = ref<boolean>(false)
const error = ref<string>('')
const monthlyData = ref<SummaryItem[][]>([])

const getMonthRange = (): string[] => {
  if (!props.dateRange.startMonth || !props.dateRange.endMonth) {
    return []
  }

  const startDate = parseISO(props.dateRange.startMonth + '-01')
  const endDate = parseISO(props.dateRange.endMonth + '-01')

  return eachMonthOfInterval({
    start: startDate,
    end: endDate
  }).map(date => format(date, 'yyyy-MM'))
}

const fetchChartData = async (): Promise<void> => {
  loading.value = true
  error.value = ''
  monthlyData.value = []

  try {
    const months = getMonthRange()

    // Fetch summary data for each month
    const data = await Promise.all(
      months.map(month => store.fetchSummaryByMonth(month))
    )

    monthlyData.value = data
  } catch (err) {
    error.value = 'Failed to load trend data'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const getMonthlyTotalByCategories = (summaries: SummaryItem[][]): ProcessedMonth[] => {
  const months = getMonthRange()

  return months.map((month, idx) => {
    const summary = summaries[idx] || []
    const categoryData: Record<string, CategoryData> = {}

    summary.forEach(item => {
      const categoryId = item.category?.id || item.category?.id
      const categoryName = item.category?.name || 'Unknown'
      const categoryColor = item.category?.color || '#999'

      categoryData[categoryId] = {
        name: categoryName,
        color: categoryColor,
        amount: parseFloat(item.amount.toString() || '0')
      }
    })

    return {
      month,
      categories: categoryData
    }
  })
}

const processedData = computed<ProcessedMonth[]>(() => {
  return getMonthlyTotalByCategories(monthlyData.value)
})

const categoryLookup = computed<Record<string, CategoryLookupItem>>(() => {
  const lookup: Record<string, CategoryLookupItem> = {}
  store.categories.forEach(cat => {
    lookup[cat.id] = {
      name: cat.name,
      color: cat.color
    }
  })
  return lookup
})

const chartData = computed(() => {
  const months = processedData.value.map(d => format(parseISO(d.month + '-01'), 'MMM yyyy'))
  const isLine = chartType.value === 'line'

  // Get all category IDs from processed data
  const allCategoryIds = new Set<string>()
  processedData.value.forEach(monthData => {
    Object.keys(monthData.categories).forEach(catId => {
      allCategoryIds.add(catId)
    })
  })

  // Create a dataset for each category
  const datasets = Array.from(allCategoryIds).map(categoryId => {
    const categoryInfo = categoryLookup.value[categoryId]
    const categoryName = categoryInfo?.name || 'Unknown'
    const categoryColor = categoryInfo?.color || '#999'

    const data = processedData.value.map(monthData => {
      return monthData.categories[categoryId]?.amount || 0
    })

    return {
      label: categoryName,
      data,
      borderColor: categoryColor,
      backgroundColor: isLine ? categoryColor + '20' : categoryColor + 'B3',
      ...(isLine && {
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2
      }),
      ...(!isLine && {
        borderWidth: 1
      })
    }
  })

  return {
    labels: months,
    datasets
  }
})

interface ChartOptions {
  responsive: boolean
  maintainAspectRatio: boolean
  plugins: {
    legend: {
      display: boolean
      position: 'top'
    }
    title: {
      display: boolean
    }
  }
  scales: {
    y: {
      beginAtZero: boolean
      ticks: {
        callback: (value: number) => string
      }
    }
  }
}

const chartOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      display: true,
      position: 'top'
    },
    title: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value: number) => `$${value.toFixed(0)}`
      }
    }
  }
}

const totalSpending = computed<number>(() => {
  return processedData.value.reduce((sum, monthData) => {
    const monthTotal = Object.values(monthData.categories).reduce((catSum, cat) => catSum + cat.amount, 0)
    return sum + monthTotal
  }, 0)
})

const averageMonthly = computed<number>(() => {
  if (processedData.value.length === 0) return 0
  const monthlyTotals = processedData.value.map(monthData => {
    return Object.values(monthData.categories).reduce((sum, cat) => sum + cat.amount, 0)
  })
  const nonZeroMonths = monthlyTotals.filter(total => total > 0)
  const monthsToUse = nonZeroMonths.length > 0 ? nonZeroMonths : monthlyTotals
  return monthsToUse.reduce((sum, total) => sum + total, 0) / monthsToUse.length
})

const highestMonth = computed<number>(() => {
  if (processedData.value.length === 0) return 0
  const monthlyTotals = processedData.value.map(monthData => {
    return Object.values(monthData.categories).reduce((sum, cat) => sum + cat.amount, 0)
  })
  return Math.max(...monthlyTotals)
})

const lowestMonth = computed<number>(() => {
  if (processedData.value.length === 0) return 0
  const monthlyTotals = processedData.value.map(monthData => {
    return Object.values(monthData.categories).reduce((sum, cat) => sum + cat.amount, 0)
  })
  const nonZeroMonths = monthlyTotals.filter(total => total > 0)
  const monthsToUse = nonZeroMonths.length > 0 ? nonZeroMonths : monthlyTotals
  return Math.min(...monthsToUse)
})

interface CategoryStatsRecord {
  id: string
  name: string
  color: string
  amounts: number[]
}

const categoryStats = computed<CategoryStatItem[]>(() => {
  if (processedData.value.length === 0) return []

  const stats: Record<string, CategoryStatsRecord> = {}

  // Aggregate data by category
  processedData.value.forEach(monthData => {
    Object.entries(monthData.categories).forEach(([catId, catData]) => {
      if (!stats[catId]) {
        stats[catId] = {
          id: catId,
          name: catData.name,
          color: catData.color,
          amounts: []
        }
      }
      stats[catId].amounts.push(catData.amount)
    })
  })

  // Calculate stats for each category
  return Object.values(stats).map(cat => {
    const nonZeroAmounts = cat.amounts.filter(amt => amt > 0)
    const amountsToUse = nonZeroAmounts.length > 0 ? nonZeroAmounts : cat.amounts
    const total = cat.amounts.reduce((sum, amt) => sum + amt, 0)
    const average = amountsToUse.length > 0 ? total / amountsToUse.length : 0
    const highest = Math.max(...amountsToUse)
    const lowest = Math.min(...amountsToUse)

    return {
      id: cat.id,
      name: cat.name,
      color: cat.color,
      total,
      average,
      highest,
      lowest
    }
  }).sort((a, b) => b.total - a.total)
})

// Watch for prop changes and refetch data
watch(
  () => props.dateRange,
  async () => {
    if (props.dateRange.startMonth && props.dateRange.endMonth) {
      await fetchChartData()
    }
  },
  { deep: true }
)

onMounted(async () => {
  if (props.dateRange.startMonth && props.dateRange.endMonth) {
    await fetchChartData()
  }
})
</script>

<style scoped>
.trend-chart-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
}

.chart-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-type-toggle {
  display: flex;
  gap: 0.5rem;
}

.toggle-btn {
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

.toggle-btn:hover {
  border-color: #3498db;
  background-color: #f0f8ff;
}

.toggle-btn.active {
  background-color: #3498db;
  color: white;
  border-color: #3498db;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #2c3e50;
}

.error-state {
  color: #e74c3c;
}

.chart-wrapper {
  position: relative;
  height: 500px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: center;
}

.stat-label {
  font-size: 0.85rem;
  color: #7f8c8d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
}

.category-stats-panel {
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.category-stats-panel h3 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.category-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.category-stat-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.2rem;
  transition: all 0.3s ease;
}

.category-stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #3498db;
  transform: translateY(-2px);
}

.category-header {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1rem;
  padding-bottom: 0.8rem;
  border-bottom: 2px solid #e0e0e0;
}

.category-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  flex-shrink: 0;
}

.category-header h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 1rem;
  flex: 1;
}

.category-metrics {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95rem;
}

.metric-label {
  color: #7f8c8d;
  font-weight: 500;
}

.metric-value {
  color: #2c3e50;
  font-weight: 600;
  font-size: 1rem;
}
</style>
