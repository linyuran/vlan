import express from 'express';
import { Client } from 'ssh2';
import cors from 'cors';

const app = express();
const port = 3000;

// 添加CORS中间件
app.use(cors());

// SSH配置（多台宿主机）
const sshConfigs = [
  // {
  //   host: '192.168.198.12',
  //   port: 22,
  //   username: 'root',
  //   password: 'lee',
  //   name: '宿主机1'
  // },
  {
    host: '192.168.198.100',
    port: 22,
    username: 'root',
    password: '123456',
    name: '宿主机2'
  }
];

// 封装通用 SSH 执行函数
function runSSHCommand(command, hostIndex = 0) {
  return new Promise((resolve, reject) => {
    console.log(`准备执行SSH命令: ${command} (宿主机: ${sshConfigs[hostIndex].name})`);
    const conn = new Client();
    let output = '';
    let error = '';

    conn
      .on('ready', () => {
        console.log(`SSH连接成功 (宿主机: ${sshConfigs[hostIndex].name})`);
        conn.exec(command, { pty: true }, (err, stream) => {
          if (err) {
            console.error('执行命令时出错:', err);
            conn.end();
            return reject(err);
          }

          stream
            .on('data', (data) => {
              const dataStr = data.toString();
              console.log('命令输出:', dataStr);
              output += dataStr;
            })
            .stderr.on('data', (data) => {
              const errorStr = data.toString();
              console.error('命令错误:', errorStr);
              error += errorStr;
            });

          stream.on('close', (code, signal) => {
            console.log(`命令执行完成，退出码: ${code}, 信号: ${signal}`);
            conn.end();
            if (code !== 0) {
              console.error('命令执行失败，退出码:', code);
              reject(new Error(`命令执行失败，退出码: ${code}\n错误信息: ${error}`));
            } else {
              resolve({ output, error });
            }
          });
        });
      })
      .on('error', (err) => {
        console.error('SSH连接错误:', err);
        reject(err);
      })
      .connect(sshConfigs[hostIndex]);
  });
}

// 解析 virsh 输出
function parseVirshOutput(output) {
  const lines = output.split('\n').slice(2).filter(line => line.trim() !== '');
  return lines.map(line => {
    const parts = line.trim().split(/\s+/);
    return {
      name: parts[1],
      status: parts[2] === 'running' ? '开机' : '关机',
    };
  });
}

// 主接口：获取虚拟机名称、状态、所在物理机
app.get('/api/vms', async (req, res) => {
  try {
    const allVms = [];
    
    // 遍历所有宿主机
    for (let i = 0; i < sshConfigs.length; i++) {
      const { output, error } = await runSSHCommand('virsh list --all', i);
      if (error && !error.startsWith('[sudo]')) {
        console.error(`获取宿主机 ${sshConfigs[i].name} 的虚拟机列表失败:`, error);
        continue;
      }

      const vmList = parseVirshOutput(output);
      const result = vmList.map(vm => ({
        ...vm,
        location: sshConfigs[i].name,  // 使用宿主机名称
        hostIndex: i  // 添加宿主机索引
      }));

      allVms.push(...result);
    }

    res.json(allVms);
  } catch (err) {
    console.error('获取虚拟机信息失败:', err);
    res.status(500).json({ error: '无法获取虚拟机信息' });
  }
});

// 获取虚拟机的局域网端口
app.get('/api/vms-net', async (req, res) => {
  try {
    const allVmNetList = [];
    
    // 遍历所有宿主机
    for (let i = 0; i < sshConfigs.length; i++) {
      console.log(`开始获取宿主机 ${sshConfigs[i].name} 的网络信息...`);
      const { output, error } = await runSSHCommand('ovs-vsctl show', i);
      
      if (error) {
        console.error(`获取宿主机 ${sshConfigs[i].name} 的网络信息失败:`, error);
        if (error.includes('command not found')) {
          return res.status(500).json({ 
            error: 'Open vSwitch未安装',
            message: '请在目标服务器上安装Open vSwitch软件包'
          });
        }
        continue;
      }

      if (!output) {
        console.error(`宿主机 ${sshConfigs[i].name} 的网络信息为空`);
        continue;
      }

      // 解析命令输出，提取虚拟机和对应的端口
      const vmNetList = await parseNetPorts(output, i);
      console.log(`宿主机 ${sshConfigs[i].name} 的网络列表:`, vmNetList);
      
      // 添加宿主机信息
      const vmNetListWithHost = vmNetList.map(item => ({
        ...item,
        location: sshConfigs[i].name,
        hostIndex: i
      }));
      
      allVmNetList.push(...vmNetListWithHost);
    }
    
    res.json(allVmNetList);
  } catch (err) {
    console.error('获取虚拟机局域网信息失败:', err);
    res.status(500).json({ error: '无法获取虚拟机局域网信息' });
  }
});

// 修改虚拟机的端口
app.post('/api/vms-net/:portName', express.json(), async (req, res) => {
  const { portName } = req.params;
  const { newTag, hostIndex } = req.body;

  try {
    console.log(`开始修改宿主机 ${sshConfigs[hostIndex].name} 的端口 ${portName} 的VLAN标签为 ${newTag}`);
    let command;
    
    // 检查端口是否存在
    const checkPort = await runSSHCommand(`ovs-vsctl list port ${portName}`, hostIndex);
    if (checkPort.error) {
      return res.status(404).json({ error: `网络接口 ${portName} 不存在` });
    }

    if (newTag === '') {
      // 清除标签
      command = `ovs-vsctl remove port ${portName} tag `;
    } else {
      // 设置新标签
      command = `ovs-vsctl set port ${portName} tag=${newTag}`;
    }
    
    const { output, error } = await runSSHCommand(command, hostIndex);
    console.log('修改端口命令输出:', output);
    console.log('修改端口命令错误:', error);
    
    if (error) {
      console.error('修改端口命令执行错误:', error);
      return res.status(500).json({ error: error.trim() });
    }

    // 验证修改是否成功
    const verify = await runSSHCommand(`ovs-vsctl get port ${portName} tag`, hostIndex);
    const currentTag = verify.output.trim();
    console.log('验证当前标签:', currentTag);
    
    if (newTag === '') {
      // 清除标签时，期望输出是 '[]'
      if (currentTag !== '[]') {
        console.error('清除标签失败，当前标签:', currentTag);
        return res.status(500).json({ error: '清除标签失败' });
      }
    } else {
      // 设置标签时，期望输出是数字
      const tagNum = parseInt(currentTag);
      if (isNaN(tagNum) || tagNum !== parseInt(newTag)) {
        console.error('设置标签失败，当前标签:', currentTag, '期望标签:', newTag);
        return res.status(500).json({ error: '设置标签失败' });
      }
    }

    res.json({ success: true, message: '修改成功' });
  } catch (err) {
    console.error('修改虚拟机局域网端口失败:', err);
    return res.status(500).json({ error: err.message || '修改失败' });
  }
});


// 解析 ovs-vsctl show 输出
async function parseNetPorts(output, hostIndex) {
  console.log('开始解析ovs-vsctl show输出...');
  const lines = output.split('\n');
  const vmNetList = [];
  const processedPorts = new Set(); // 用于记录已处理的端口
  let currentPort = null;
  let currentTag = null;

  // 获取所有虚拟机列表
  const { output: vmListOutput } = await runSSHCommand('virsh list --all', hostIndex);
  const vmNames = vmListOutput.split('\n')
    .slice(2) // 跳过表头
    .filter(line => line.trim())
    .map(line => line.trim().split(/\s+/)[1]);

  // 为每个虚拟机获取网络接口信息
  const vmInterfaceMap = {};
  for (const vmName of vmNames) {
    const { output: interfaceOutput } = await runSSHCommand(`virsh domiflist ${vmName}`, hostIndex);
    const interfaces = interfaceOutput.split('\n')
      .slice(2) // 跳过表头
      .filter(line => line.trim())
      .map(line => {
        const [interfaceName, mac, source, model, type] = line.trim().split(/\s+/);
        return { interfaceName, vmName };
      });
    
    interfaces.forEach(iface => {
      if (iface.interfaceName.startsWith('vnet')) {
        vmInterfaceMap[iface.interfaceName] = iface.vmName;
      }
    });
  }

  console.log('虚拟机网络接口映射:', vmInterfaceMap);

  lines.forEach(line => {
    // 查找端口定义
    const portMatch = line.match(/Port\s+"([^"]+)"/);
    if (portMatch) {
      // 如果之前有端口在处理，先保存它
      if (currentPort && currentPort.startsWith('vnet') && !processedPorts.has(currentPort)) {
        vmNetList.push({
          vmName: vmInterfaceMap[currentPort] || currentPort, // 使用虚拟机名称，如果没有则使用端口名
          portName: currentPort, // 保存端口名
          port: currentTag || ''
        });
        processedPorts.add(currentPort);
      }
      // 开始处理新端口
      currentPort = portMatch[1];
      currentTag = null;
    }

    // 查找标签定义
    const tagMatch = line.match(/tag:\s*(\d+)/);
    if (tagMatch) {
      currentTag = tagMatch[1];
    }
  });

  // 处理最后一个端口
  if (currentPort && currentPort.startsWith('vnet') && !processedPorts.has(currentPort)) {
    vmNetList.push({
      vmName: vmInterfaceMap[currentPort] || currentPort,
      portName: currentPort,
      port: currentTag || ''
    });
  }

  console.log('解析完成，找到的网络端口:', vmNetList);
  return vmNetList;
}

// 获取网络接口信息
app.get('/api/ip-links', async (req, res) => {
  try {
    const results = [];
    
    // 遍历所有宿主机
    for (let i = 0; i < sshConfigs.length; i++) {
      const { output, error } = await runSSHCommand('ip link show', i);
      if (error) {
        console.error(`获取宿主机 ${sshConfigs[i].name} 的网络接口信息失败:`, error);
        continue;
      }

      // 只保留vnet相关的信息
      const vnetInfo = output.split('\n')
        .filter(line => line.includes('vnet'))
        .map(line => line.trim())
        .join('\n');

      results.push({
        host: sshConfigs[i].name,
        output: vnetInfo
      });
    }

    res.json(results);
  } catch (err) {
    console.error('获取网络接口信息失败:', err);
    res.status(500).json({ error: '无法获取网络接口信息' });
  }
});

// Ping测试接口
app.post('/api/ping-test', express.json(), async (req, res) => {
  const { target, hostIndex } = req.body;
  
  try {
    console.log(`开始从宿主机 ${sshConfigs[hostIndex].name} 执行ping测试: ${target}`);
    const { output, error } = await runSSHCommand(`ping -c 4 ${target}`, hostIndex);
    
    if (error) {
      console.error('Ping测试执行错误:', error);
      return res.status(500).json({ error: error.trim() });
    }
    
    res.json({ output, error });
  } catch (err) {
    console.error('Ping测试失败:', err);
    res.status(500).json({ error: err.message || 'Ping测试失败' });
  }
});

// 启动服务
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});