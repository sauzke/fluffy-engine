<template>
  <div class="file-upload">
    <div
      @drop="handleDrop"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      :class="['drop-zone', { dragging: isDragging }]"
    >
      <input
        ref="fileInput"
        type="file"
        accept=".csv"
        multiple
        @change="handleFileSelect"
        style="display: none"
      />
      <div v-if="!store.uploadingFile" class="upload-content">
        <button @click="fileInput?.click()" class="btn-upload">
          📊 Upload CSV
        </button>
        <p class="drop-text">or drag and drop CSV files here (multiple allowed)</p>
      </div>
      <div v-else class="loading-container">
        <div class="spinner"></div>
        <p class="loading-text">Uploading...</p>
      </div>
    </div>

    <div v-if="store.uploadError" class="error-message">
      {{ store.uploadError }}
    </div>

    <transition name="toast-fade">
      <div v-if="showToast" class="toast" :class="toastType">
        {{ toastMessage }}
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBudgetStore } from '../stores/budgetStore'

const store = useBudgetStore()
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref<boolean>(false)
const showToast = ref<boolean>(false)
const toastMessage = ref<string>('')
const toastType = ref<'success' | 'error'>('success')

const handleFileSelect = async (e: Event): Promise<void> => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    await uploadFiles(Array.from(files))
  }
}

const handleDrop = async (e: DragEvent): Promise<void> => {
  e.preventDefault()
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    const csvFiles = Array.from(files).filter(
      (file) => file.type === 'text/csv' || file.name.endsWith('.csv')
    )
    if (csvFiles.length > 0) {
      await uploadFiles(csvFiles)
    }
  }
}

const displayToast = (message: string, type: 'success' | 'error' = 'success'): void => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true

  setTimeout(() => {
    showToast.value = false
  }, 4000)
}

const uploadFiles = async (files: File[]): Promise<void> => {
  try {
    let totalTransactions = 0
    let totalDuplicates = 0
    const failedFiles: string[] = []

    for (const file of files) {
      try {
        const result = await store.uploadFile(file)
        totalTransactions += result.transactionCount
        totalDuplicates += result.duplicateCount || 0
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error)
        failedFiles.push(file.name)
      }
    }

    // Build success message
    let message = `✓ Upload complete! ${totalTransactions} transactions imported.`
    if (totalDuplicates > 0) {
      message += ` (${totalDuplicates} duplicates skipped)`
    }
    if (failedFiles.length > 0) {
      message += `\n⚠ Failed: ${failedFiles.join(', ')}`
      displayToast(message, 'error')
    } else {
      displayToast(message, 'success')
    }

    if (fileInput.value) {
      fileInput.value.value = ''
    }
  } catch (error) {
    console.error('Upload failed:', error)
    displayToast('Upload failed. Please try again.', 'error')
  }
}

const uploadFile = async (file: File): Promise<void> => {
  await uploadFiles([file])
}
</script>

<style scoped>
.file-upload {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  position: relative;
}

.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  background-color: white;
  border: 2px dashed #3498db;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  min-height: 150px;
  justify-content: center;
}

.drop-zone.dragging {
  background-color: #ecf0f1;
  border-color: #2980b9;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: #3498db;
  font-weight: 500;
  margin: 0;
}

.btn-upload {
  background-color: #27ae60;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.btn-upload:hover {
  background-color: #229954;
}

.drop-text {
  margin: 0;
  font-size: 0.9rem;
  color: #7f8c8d;
}

.error-message {
  color: #e74c3c;
  font-size: 0.9rem;
  text-align: center;
}

.toast {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  padding: 1rem 1.5rem;
  border-radius: 4px;
  font-weight: 500;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.toast.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.toast.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.3s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
}

.upload-content{
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (max-width: 768px) {
  .drop-zone {
    padding: 0.75rem;
    min-height: 120px;
  }

  .btn-upload {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }

  .toast {
    left: 1rem;
    right: 1rem;
    max-width: none;
  }
}
</style>
