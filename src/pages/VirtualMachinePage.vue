<template>
  <div class="vm-page">
    <h3>虚拟机信息</h3>
    <table>
      <thead>
        <tr>
          <th>虚拟机名称</th>
          <th>虚拟机状态</th>
          <th>虚拟机所在机器</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(vm, index) in vmStore.vmList" :key="index">
          <td>{{ vm.name }}</td>
          <td>{{ vm.status }}</td>
          <td>{{ vm.location }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { useVmStore } from '../stores/vmStore';
import { onMounted } from 'vue';

const vmStore = useVmStore();

onMounted(() => {
  vmStore.loadVmList()
  console.log(vmStore.vmList)  // 确认数据是否更新
})

</script>

<style scoped>
.vm-page {
  padding: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th, td {
  padding: 10px;
  border: 1px solid #ccc;
  text-align: left;
}
</style>
