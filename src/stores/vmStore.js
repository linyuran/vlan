import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useVmStore = defineStore('vmStore', () => {
  const vmList = ref([])

  async function loadVmList() {
    try {
      const response = await axios.get('/api/vms')
      if (response.data && Array.isArray(response.data)) {
        vmList.value = response.data
      } else {
        console.error('返回数据不是一个数组:', response.data)
      }
    } catch (error) {
      console.error('加载虚拟机数据失败:', error)
    }
  }

  return {
    vmList,
    loadVmList
  }
})
