<template>
    <div class="sidebar">
      <router-link to="/" class="nav-item" active-class="active">虚拟机</router-link>
      <router-link to="/NetworkPage" class="nav-item" active-class="active">局域网信息</router-link>
      <router-link to="/LogPage" class="nav-item" active-class="active">日志</router-link>
    </div>
  </template>
  
  <style scoped>
  .sidebar {
    width: 200px;
    background-color: #2c3e50;
    color: white;
    display: flex;
    flex-direction: column;
    padding: 20px;
  }
  .nav-item {
    padding: 10px;
    color: white;
    text-decoration: none;
    margin-bottom: 10px;
    border-radius: 5px;
  }
  .nav-item:hover {
    background-color: #34495e;
  }
  .active {
    background-color: #1abc9c;
  }
  </style>