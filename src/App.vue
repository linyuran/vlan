<template>
  <div class="app-container">
    <Sidebar />
    <div class="content">
      <router-view />
    </div>
  </div>
</template>
<script setup>
import Sidebar from './pages/Sidebar.vue';
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
}
.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
</style>