import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';

export const useVmNetStore = defineStore('vmNetStore', () => {
  const vmList = ref([]);
  const vlanList = ref([]);

  // 获取虚拟机和局域网信息
  async function loadVmNetList() {
    try {
      console.log('开始请求网络数据...');
      const response = await axios.get('/api/vms-net');
      console.log('API响应数据:', response.data);
      
      if (!response.data) {
        console.error('API返回数据为空');
        return;
      }
      
      vmList.value = response.data;
      // 计算局域网表
      const portMap = {};
      response.data.forEach(vm => {
        if (!portMap[vm.port]) {
          portMap[vm.port] = [];
        }
        portMap[vm.port].push(vm.vmName);
      });
      vlanList.value = Object.entries(portMap).map(([port, vms]) => ({ port, vms }));
      console.log('处理后的数据:', {
        vmList: vmList.value,
        vlanList: vlanList.value
      });
    } catch (error) {
      console.error('加载虚拟机局域网数据失败:', error);
      if (error.response) {
        console.error('错误状态码:', error.response.status);
        console.error('错误响应数据:', error.response.data);
      }
      throw error; // 抛出错误，让调用者处理
    }
  }

  // 修改虚拟机的局域网端口
  async function updateVmNetPort(portName, newTag, hostIndex) {
    try {
      console.log('开始修改VLAN标签:', { portName, newTag, hostIndex });
      const response = await axios.post(`/api/vms-net/${portName}`, { 
        newTag,
        hostIndex 
      });
      console.log('修改VLAN标签响应:', response.data);
      return response.data;
    } catch (error) {
      console.error('修改VLAN标签失败:', error);
      throw error;  // 抛出错误，让调用者处理
    }
  }

  return {
    vmList,
    vlanList,
    loadVmNetList,
    updateVmNetPort
  };
});
