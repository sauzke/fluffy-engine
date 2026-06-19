<template>
  <div class="transaction-list">
    <table class="transactions-table">
      <thead>
        <tr>
          <th
            v-for="header in table.getHeaderGroups()[0]?.headers"
            :key="header.id"
            class="table-header"
          >
            <div class="header-content" v-if="!header.isPlaceholder">
              <div
                v-if="header.id === 'date' || header.id === 'amount'"
                class="sortable"
                @click="toggleSort(header.column)"
              >
                {{ header.column.columnDef.header }}
                <span class="sort-indicator" v-if="header.column.getIsSorted()">
                  {{ header.column.getIsSorted() === 'asc' ? '▲' : '▼' }}
                </span>
              </div>

              <div v-else-if="header.id === 'description'" class="header-search-wrapper">
                <span>{{ header.column.columnDef.header }}</span>
                <input
                  type="text"
                  placeholder="Filter..."
                  :value="table.getColumn('description')?.getFilterValue() ?? ''"
                  @input="table.getColumn('description')?.setFilterValue($event.target.value)"
                  class="header-filter"
                />
              </div>

              <div v-else-if="header.id === 'categoryId'" class="header-select-wrapper">
                <span>{{ header.column.columnDef.header }}</span>
                <select
                  :value="categoryFilterValue"
                  @change="updateCategoryFilter($event.target.value)"
                  class="header-filter"
                >
                  <option value="">All</option>
                  <option v-for="category in store.categories" :key="category.id" :value="category.id">
                    {{ category.name }}
                  </option>
                </select>
              </div>

              <div v-else>
                {{ header.column.columnDef.header }}
              </div>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in table.getRowModel().rows" :key="row.id" class="transaction-row">
          <td v-for="cell in row.getVisibleCells()" :key="cell.id" class="table-cell" :data-column="cell.column.id">
            <span
              v-if="cell.column.id === 'categoryId'"
              :style="{ backgroundColor: getCategoryColor(row.original) }"
              class="category-badge"
            >
              {{ getCategoryName(row.original) }}
            </span>
            <span v-else>{{ getCellValue(cell) }}</span>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="table.getRowModel().rows.length === 0" class="empty-state">
      <p>No transactions found</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { format, parseISO } from 'date-fns'
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import type { FilterFn } from '@tanstack/vue-table'
import { useBudgetStore } from '../stores/budgetStore'
import type { Transaction } from '../api/client'

const store = useBudgetStore()

const columnHelper = createColumnHelper<Transaction>()

// Custom filter function for description
const descriptionFilterFn: FilterFn<Transaction> = (row, columnId, value) => {
  if (!value) return true
  return row.original.description.toLowerCase().includes(value.toLowerCase())
}

// Custom filter function for category
const categoryFilterFn: FilterFn<Transaction> = (row, columnId, value) => {
  if (!value) return true
  return row.original.categoryId === Number(value)
}

const columns = [
  columnHelper.accessor('date', {
    header: 'Date',
    cell: ({ getValue }) => {
      const rawDate = getValue()
      if (!rawDate) return '-'
      return format(parseISO(rawDate.toString()), 'MMM dd, yyyy')
    },
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const dateA = new Date(rowA.original.date).getTime()
      const dateB = new Date(rowB.original.date).getTime()
      return dateA - dateB
    },
  }),
  columnHelper.accessor('description', {
    header: 'Description',
    cell: (info) => info.getValue(),
    enableSorting: false,
    filterFn: descriptionFilterFn,
  }),
  columnHelper.accessor('categoryId', {
    header: 'Category',
    cell: (info) => {
      const category = info.row.original.category
      return {
        name: category?.name || 'Unknown',
        color: category?.color || '#808080',
      }
    },
    enableSorting: false,
    filterFn: categoryFilterFn,
  }),
  columnHelper.accessor('amount', {
    header: 'Amount',
    cell: (info) => `$${parseFloat(info.getValue().toString()).toFixed(2)}`,
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const amountA = parseFloat(rowA.original.amount.toString())
      const amountB = parseFloat(rowB.original.amount.toString())
      return amountA - amountB
    },
  }),
]

const data = computed(() => store.transactions)
const sorting = ref([{ id: 'date', desc: true }])
const columnFilters = ref([])
const categoryFilterValue = ref<string>('')

const updateCategoryFilter = (value: string) => {
  categoryFilterValue.value = value
  const numValue = value ? Number(value) : undefined
  columnFilters.value = columnFilters.value.filter(f => f.id !== 'categoryId')
  if (numValue) {
    columnFilters.value.push({ id: 'categoryId', value: numValue })
  }
}

const getCellValue = (cell: any) => {
  const columnId = cell.column.id
  const value = cell.getValue()

  // Format date column
  if (columnId === 'date') {
    if (!value) return '-'
    try {
      return format(parseISO(value.toString()), 'MMM dd, yyyy')
    } catch {
      return '-'
    }
  }

  // Format amount column
  if (columnId === 'amount') {
    return `$${parseFloat(value.toString()).toFixed(2)}`
  }

  // Default: return as string
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'object' && value !== null) {
    return value.toString()
  }
  return String(value)
}

const getCategoryName = (transaction: Transaction) => {
  return transaction.category?.name || 'Unknown'
}

const getCategoryColor = (transaction: Transaction) => {
  return transaction.category?.color || '#808080'
}

const toggleSort = (column: any) => {
  const currentSort = column.getIsSorted()
  if (currentSort === 'asc') {
    column.toggleSorting(true) // desc
  } else if (currentSort === 'desc') {
    column.clearSorting()
  } else {
    column.toggleSorting(false) // asc
  }
}

const table = useVueTable({
  get data() {
    return data.value
  },
  columns,
  state: {
    get sorting() {
      return sorting.value
    },
    get columnFilters() {
      return columnFilters.value
    },
  },
  onSortingChange: (updater) => {
    sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater
  },
  onColumnFiltersChange: (updater) => {
    columnFilters.value = typeof updater === 'function' ? updater(columnFilters.value) : updater
  },
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getSortedRowModel: getSortedRowModel(),
  filterFns: {
    description: descriptionFilterFn,
    categoryId: categoryFilterFn,
  },
})
</script>

<style scoped>
.transaction-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.transactions-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  overflow: hidden;
}

.table-header {
  background-color: #ecf0f1;
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #bdc3c7;
  border-right: 1px solid #bdc3c7;
  position: sticky;
  top: 0;
  z-index: 10;
}

.table-header:last-child {
  border-right: none;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sortable {
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #2c3e50;
  transition: color 0.2s;
}

.sortable:hover {
  color: #3498db;
}

.sort-indicator {
  font-size: 0.75rem;
  color: #3498db;
  font-weight: bold;
}

.header-search-wrapper,
.header-select-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.header-search-wrapper span,
.header-select-wrapper span {
  font-size: 0.95rem;
  font-weight: 600;
  color: #2c3e50;
}

.header-filter {
  padding: 0.35rem 0.5rem;
  border: 1px solid #bdc3c7;
  border-radius: 3px;
  font-size: 0.8rem;
  background-color: white;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.header-filter:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 4px rgba(52, 152, 219, 0.2);
}

.transaction-row {
  border-bottom: 1px solid #ecf0f1;
  transition: background-color 0.2s;
}

.transaction-row:hover {
  background-color: #f9f9f9;
}

.table-cell {
  padding: 0.5rem 0.75rem;
  border-right: 1px solid #ecf0f1;
  color: #2c3e50;
}

.table-cell:last-child {
  border-right: none;
}

.table-cell[data-column='date'] {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.table-cell[data-column='amount'] {
  color: #e74c3c;
  font-weight: 600;
  text-align: right;
}

.table-cell[data-column='category.name'] {
  padding: 0;
}

.category-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  color: white;
  font-size: 0.85rem;
  font-weight: 500;
  margin: 0;
}

.empty-state {
  text-align: center;
  color: #7f8c8d;
  padding: 2rem;
}



@media (max-width: 768px) {
  .transactions-table {
    font-size: 0.85rem;
  }

  .table-header {
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
  }

  .table-cell {
    padding: 0.5rem 0.75rem;
  }

  .header-filter {
    font-size: 0.75rem;
    padding: 0.3rem 0.4rem;
  }
}
</style>
