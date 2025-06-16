<template>
  <div class="log-page">
    <h2>网络接口信息</h2>
    <el-button type="primary" @click="fetchIpLinks" :loading="isLoading">
      获取网络接口信息
    </el-button>

    <div class="results-container">
      <el-card v-for="result in ipLinksResults" :key="result.host" class="result-card">
        <template #header>
          <div class="card-header">
            <span>{{ result.host }} 的网络接口信息</span>
            <span class="timestamp">{{ result.timestamp }}</span>
          </div>
        </template>
        <pre class="output-text">{{ result.output || '暂无数据' }}</pre>
      </el-card>
    </div>

    <h2 style="margin-top: 30px;">网络连通性测试</h2>
    <div class="ping-buttons">
      <el-button type="success" @click="pingBaidu" :loading="isPingingBaidu">
        宿主机1 Ping www.baidu.com
      </el-button>
      <el-button type="success" @click="pingGoogle" :loading="isPingingGoogle">
        宿主机2 Ping 8.8.8.8
      </el-button>
    </div>

    <div class="results-container">
      <el-card v-for="result in pingResults" :key="result.host" class="result-card">
        <template #header>
          <div class="card-header">
            <span>{{ result.host }} 的Ping测试结果</span>
            <span class="timestamp">{{ result.timestamp }}</span>
          </div>
        </template>
        <pre class="output-text">{{ result.output || '暂无数据' }}</pre>
      </el-card>
    </div>

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
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';

const ipLinksResults = ref([]);
const pingResults = ref([]);
const isLoading = ref(false);
const isPingingBaidu = ref(false);
const isPingingGoogle = ref(false);
const errorMessage = ref('');
const errorDescription = ref('');

// 格式化时间
function formatTime(date) {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

async function fetchIpLinks() {
  isLoading.value = true;
  errorMessage.value = '';
  errorDescription.value = '';
  
  try {
    console.log('开始获取网络接口信息...');
    const response = await axios.get('/api/ip-links');
    console.log('获取到的网络接口信息:', response.data);
    
    // 添加时间戳
    const currentTime = new Date();
    ipLinksResults.value = response.data.map(result => ({
      ...result,
      timestamp: formatTime(currentTime)
    }));
  } catch (error) {
    console.error('获取网络接口信息失败:', error);
    console.error('错误详情:', {
      message: error.message,
      response: error.response,
      config: error.config
    });
    errorMessage.value = '获取网络接口信息失败';
    errorDescription.value = error.response?.data?.error || error.message || '未知错误';
    ElMessage.error('获取网络接口信息失败');
  } finally {
    isLoading.value = false;
  }
}

const pingBaidu = async () => {
  isPingingBaidu.value = true;
  errorMessage.value = '';
  errorDescription.value = '';
  
  try {
    console.log('开始从宿主机1执行ping测试...');
    const response = await axios.post('http://localhost:3000/api/ping-test', {
      target: 'www.baidu.com', 
      hostIndex: 0
    });
    console.log('Ping测试结果:', response.data);
    
    const currentTime = new Date();
    pingResults.value = [{
      host: '宿主机1',
      output: response.data.output || '暂无数据',
      timestamp: formatTime(currentTime)
    }];
  } catch (error) {
    console.error('Ping测试失败:', error);
    errorMessage.value = 'Ping测试失败';
    errorDescription.value = error.response?.data?.error || error.message || '未知错误';
    ElMessage.error('Ping测试失败');
  } finally {
    isPingingBaidu.value = false;
  }
};

async function pingGoogle() {
  isPingingGoogle.value = true;
  errorMessage.value = '';
  errorDescription.value = '';
  
  try {
    console.log('开始执行宿主机2的ping测试...');
    const response = await axios.post('http://localhost:3000/api/ping-test', {
      target: '8.8.8.8',
      hostIndex: 1
    });
    
    const currentTime = new Date();
    pingResults.value = [{
      host: '宿主机2',
      output: response.data.output || '暂无数据',
      timestamp: formatTime(currentTime)
    }];
  } catch (error) {
    console.error('Ping测试失败:', error);
    errorMessage.value = 'Ping测试失败';
    errorDescription.value = error.response?.data?.error || error.message || '未知错误';
    ElMessage.error('Ping测试失败');
  } finally {
    isPingingGoogle.value = false;
  }
}
</script>

<style scoped>
.log-page {
  padding: 20px;
}

.results-container {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ping-buttons {
  margin: 20px 0;
  display: flex;
  gap: 20px;
}

.result-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timestamp {
  color: #909399;
  font-size: 12px;
}

.output-text {
  white-space: pre-wrap;
  word-break: break-all;
  font-family: monospace;
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
}
</style>
  