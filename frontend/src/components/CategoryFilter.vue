<template>
  <div class="category-filter">
    <div class="label">Categories</div>
    
    <div class="checkbox-group">
      <label 
        v-for="category in store.categories"
        :key="category.id"
        class="checkbox-label"
      >
        <input 
          type="checkbox" 
          :checked="selectedCategories.includes(category.id)"
          @change="toggleCategory(category.id)"
          class="checkbox-input"
        />
        <span 
          class="color-indicator"
          :style="{ backgroundColor: category.color }"
        ></span>
        <span class="category-name">{{ category.name }}</span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBudgetStore } from '../stores/budgetStore'

const emit = defineEmits<{
  'categories-selected': [ids: number[]]
}>()

const store = useBudgetStore()
const selectedCategories = ref<number[]>([])

const toggleCategory = (categoryId: number): void => {
  const index = selectedCategories.value.indexOf(categoryId)
  if (index > -1) {
    selectedCategories.value.splice(index, 1)
  } else {
    selectedCategories.value.push(categoryId)
  }
  emit('categories-selected', selectedCategories.value)
}

onMounted(async () => {
  await store.fetchCategories()
  // Default: select all categories
  selectedCategories.value = store.categories.map(cat => cat.id)
  emit('categories-selected', selectedCategories.value)
})
</script>

<style scoped>
.category-filter {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95rem;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 200px;
  overflow-y: auto;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  user-select: none;
}

.checkbox-label:hover {
  background-color: #f5f7fa;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #3498db;
}

.color-indicator {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  display: inline-block;
  flex-shrink: 0;
}

.category-name {
  font-size: 0.95rem;
  color: #2c3e50;
  font-weight: 500;
}
</style>
