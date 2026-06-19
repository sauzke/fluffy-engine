<template>
  <div class="app">
    <header class="app-header">
      <div class="hamburger" @click="menuOpen = !menuOpen">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <h1>💰 Budget Tracker</h1>
      <div class="header-right"></div>
    </header>

    <nav class="sidebar" :class="{ open: menuOpen }">
      <ul>
        <li><a href="#" @click.prevent="currentPage = 'dashboard'; menuOpen = false">Dashboard</a></li>
        <li><a href="#" @click.prevent="currentPage = 'spending-trends'; menuOpen = false">Spending Trends</a></li>
      </ul>
    </nav>

    <main class="app-main">
      <Dashboard v-if="currentPage === 'dashboard'" />
      <SpendingTrends v-else-if="currentPage === 'spending-trends'" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Dashboard from './pages/Dashboard.vue'
import SpendingTrends from './pages/SpendingTrends.vue'

const menuOpen = ref<boolean>(false)
const currentPage = ref<'dashboard' | 'spending-trends'>('dashboard')
</script>

<style scoped>
.app {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.app-header {
  background-color: #2c3e50;
  color: white;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  margin: 0;
  font-size: 1.8rem;
  flex: 1;
  text-align: center;
}

.hamburger {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  gap: 6px;
  margin-right: 1rem;
  flex-shrink: 0;
}

.hamburger span {
  width: 25px;
  height: 3px;
  background-color: white;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: 250px;
  height: 100vh;
  background-color: #34495e;
  color: white;
  padding-top: 60px;
  z-index: 999;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.2);
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.sidebar.open {
  transform: translateX(0);
}

.sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar li {
  padding: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar a {
  display: block;
  padding: 1rem 1.5rem;
  color: white;
  text-decoration: none;
  transition: background-color 0.2s ease;
  font-size: 1.1rem;
}

.sidebar a:hover {
  background-color: rgba(0, 0, 0, 0.2);
}

.header-right {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.app-main {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
}

@media (max-width: 768px) {
  .app-header {
    padding: 1rem;
    gap: 0;
  }

  .app-header h1 {
    font-size: 1.4rem;
    flex: 1;
  }

  .header-right {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-shrink: 0;
  }
}

@media (max-width: 480px) {
  .app-header h1 {
    font-size: 1.2rem;
  }

  .sidebar {
    width: 200px;
  }
}
</style>
