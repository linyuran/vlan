<template>
  <div>
    <el-row :gutter="20">
      <!-- 宿主机1 -->
      <el-col :span="12">
        <h3>宿主机1</h3>
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>虚拟机网络接口表</span>
            </div>
          </template>
          <el-table :data="host1VmList" style="width: 100%">
            <el-table-column label="虚拟机名称" prop="vmName" />
            <el-table-column label="网络接口" prop="portName" />
            <el-table-column label="VLAN标签" prop="port">
              <template #default="{ row }">
                <el-tag v-if="row.port" type="success">{{ row.port }}</el-tag>
                <el-tag v-else type="info">未设置</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作">
              <template #default="{ row }">
                <el-button @click="() => handleEdit(row)" type="primary" size="small">修改VLAN</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card class="box-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span>VLAN分组表</span>
            </div>
          </template>
          <el-table :data="host1VlanList" style="width: 100%">
            <el-table-column label="VLAN标签" prop="port">
              <template #default="{ row }">
                <el-tag type="success">{{ row.port }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="虚拟机列表" prop="vms">
              <template #default="{ row }">
                <el-tag v-for="vm in row.vms" :key="vm" style="margin-right: 5px;">{{ vm }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 宿主机2 -->
      <el-col :span="12">
        <h3>宿主机2</h3>
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>虚拟机网络接口表</span>
            </div>
          </template>
          <el-table :data="host2VmList" style="width: 100%">
            <el-table-column label="虚拟机名称" prop="vmName" />
            <el-table-column label="网络接口" prop="portName" />
            <el-table-column label="VLAN标签" prop="port">
              <template #default="{ row }">
                <el-tag v-if="row.port" type="success">{{ row.port }}</el-tag>
                <el-tag v-else type="info">未设置</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作">
              <template #default="{ row }">
                <el-button @click="() => handleEdit(row)" type="primary" size="small">修改VLAN</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card class="box-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span>VLAN分组表</span>
            </div>
          </template>
          <el-table :data="host2VlanList" style="width: 100%">
            <el-table-column label="VLAN标签" prop="port">
              <template #default="{ row }">
                <el-tag type="success">{{ row.port }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="虚拟机列表" prop="vms">
              <template #default="{ row }">
                <el-tag v-for="vm in row.vms" :key="vm" style="margin-right: 5px;">{{ vm }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 错误信息显示 -->
    <el-alert
      v-if="errorMessage"
      :title="errorMessage"
      type="error"
      :description="errorDescription"
      show-icon
      :closable="false"
      style="margin-top: 20px;"
    />

    <!-- 修改VLAN弹窗 -->
    <el-dialog 
      :title="`修改 ${selectedVmName} (${selectedPortName}) 的VLAN标签`" 
      v-model="dialogVisible"
      width="30%"
      :close-on-click-modal="false"
    >
      <el-form>
        <el-form-item label="当前网络接口">
          <el-input :model-value="selectedPortName" disabled></el-input>
        </el-form-item>
        <el-form-item label="新的VLAN标签">
          <el-input-number 
            v-model="newTag" 
            :min="1" 
            :max="4094" 
            :controls="false"
            placeholder="请输入VLAN标签(1-4094)"
          ></el-input-number>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEdit" :loading="isSubmitting">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { useVmNetStore } from '../stores/networkStore'
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

const vmStore = useVmNetStore();
const dialogVisible = ref(false);
const newTag = ref('');
const errorMessage = ref('');
const errorDescription = ref('');
const isSubmitting = ref(false);
const selectedVmName = ref('');
const selectedPortName = ref('');
const selectedHostIndex = ref(null);

// 计算宿主机1的虚拟机列表
const host1VmList = computed(() => {
  return vmStore.vmList.filter(vm => vm.location === '宿主机1');
});

// 计算宿主机2的虚拟机列表
const host2VmList = computed(() => {
  return vmStore.vmList.filter(vm => vm.location === '宿主机2');
});

// 计算宿主机1的VLAN分组
const host1VlanList = computed(() => {
  const portMap = {};
  host1VmList.value.forEach(vm => {
    if (!portMap[vm.port]) {
      portMap[vm.port] = [];
    }
    portMap[vm.port].push(vm.vmName);
  });
  return Object.entries(portMap).map(([port, vms]) => ({ port, vms }));
});

// 计算宿主机2的VLAN分组
const host2VlanList = computed(() => {
  const portMap = {};
  host2VmList.value.forEach(vm => {
    if (!portMap[vm.port]) {
      portMap[vm.port] = [];
    }
    portMap[vm.port].push(vm.vmName);
  });
  return Object.entries(portMap).map(([port, vms]) => ({ port, vms }));
});

onMounted(async () => {
  try {
    console.log('开始加载数据...');
    await vmStore.loadVmNetList();
    console.log('加载完成，当前数据:', {
      vmList: vmStore.vmList,
      host1VmList: host1VmList.value,
      host2VmList: host2VmList.value,
      host1VlanList: host1VlanList.value,
      host2VlanList: host2VlanList.value
    });
  } catch (error) {
    console.error('加载数据失败:', error);
    if (error.response?.data?.error === 'Open vSwitch未安装') {
      errorMessage.value = 'Open vSwitch未安装';
      errorDescription.value = error.response.data.message;
    } else {
      errorMessage.value = '加载数据失败';
      errorDescription.value = error.message || '未知错误';
    }
  }
});

// 打开修改端口弹窗
function handleEdit(row) {
  console.log('点击修改按钮，行数据:', row);
  selectedVmName.value = row.vmName;
  selectedPortName.value = row.portName;
  selectedHostIndex.value = row.hostIndex;
  newTag.value = row.port ? parseInt(row.port) : '';
  dialogVisible.value = true;
  console.log('弹窗状态:', { 
    dialogVisible: dialogVisible.value, 
    selectedVmName: selectedVmName.value, 
    selectedPortName: selectedPortName.value,
    selectedHostIndex: selectedHostIndex.value 
  });
}

// 提交修改
async function submitEdit() {
  console.log('提交修改，当前值:', { 
    selectedPortName: selectedPortName.value, 
    newTag: newTag.value,
    selectedHostIndex: selectedHostIndex.value 
  });
  
  if (!selectedPortName.value) {
    ElMessage.error('请选择要修改的网络接口');
    return;
  }

  if (selectedHostIndex.value === undefined) {
    ElMessage.error('无法确定宿主机信息');
    return;
  }

  isSubmitting.value = true;
  try {
    console.log('开始提交修改:', { 
      portName: selectedPortName.value, 
      newTag: newTag.value,
      hostIndex: selectedHostIndex.value 
    });
    await vmStore.updateVmNetPort(selectedPortName.value, newTag.value, selectedHostIndex.value);
    ElMessage.success('修改成功');
    dialogVisible.value = false;
    // 重新加载数据
    await vmStore.loadVmNetList();
  } catch (error) {
    console.error('修改失败:', error);
    ElMessage.error(error.response?.data?.error || error.message || '修改失败');
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.el-row {
  margin-bottom: 20px;
}

.box-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.el-col {
  padding: 0 10px;
}
</style>
