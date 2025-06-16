const { Client } = require('ssh2');

// 定义远程连接信息
const host = '172.20.10.8';
const port = 22;
const username = 'lee';
const password = 'lee';

// 执行远程命令函数
const runVirshCommand = (host, port, username, password, command) => {
  const sshClient = new Client();

  return new Promise((resolve, reject) => {
    sshClient.on('ready', () => {
      console.log('SSH 连接成功');
      
      // 使用 sudo 执行 virsh 命令
      sshClient.exec(`echo ${password} | sudo -S ${command}`, (err, stream) => {
        if (err) {
          reject(`执行命令失败: ${err}`);
          return;
        }

        let output = '';
        let error = '';

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          error += data.toString();
        });

        stream.on('close', (code, signal) => {
          sshClient.end();
          resolve({ output, error });
        });
      });
    }).on('error', (err) => {
      reject(`SSH 连接失败: ${err}`);
    }).connect({
      host,
      port,
      username,
      password
    });
  });
};

// 控制虚拟机的启动或关闭
const controlVm = async (action, vmName, host, port, username, password) => {
  if (!['start', 'shutdown'].includes(action)) {
    return { output: '', error: `不支持的操作: ${action}` };
  }

  const command = `virsh ${action} '${vmName}'`;
  return await runVirshCommand(host, port, username, password, command);
};

// 获取所有虚拟机列表
const getVmList = async (host, port, username, password) => {
  const command = 'virsh list --all';
  return await runVirshCommand(host, port, username, password, command);
};

// 示例用法
(async () => {
  try {
    // 获取虚拟机列表
    const { output, error } = await getVmList(host, port, username, password);
    console.log("虚拟机列表：\n", output);
    if (error) console.error("错误输出：\n", error);

    // 控制虚拟机
    const vmName = 'leekvm_2';  // 替换为您的虚拟机名称
    const action = 'shutdown';  // 可选：start 或 shutdown
    const { output: vmOut, error: vmErr } = await controlVm(action, vmName, host, port, username, password);
    console.log(`执行 virsh ${action} '${vmName}' 结果：\n`, vmOut);
    if (vmErr) console.error('错误：\n', vmErr);
  } catch (err) {
    console.error('发生错误:', err);
  }
})();
