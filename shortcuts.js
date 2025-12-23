// Shortcuts configuration page script
document.addEventListener('DOMContentLoaded', () => {
  const shortcutsContainer = document.getElementById('shortcutsContainer');
  const currentShortcutsDiv = document.getElementById('currentShortcuts');
  const saveBtn = document.getElementById('saveBtn');
  const resetBtn = document.getElementById('resetBtn');
  const backBtn = document.getElementById('backBtn');
  const statusMessage = document.getElementById('statusMessage');
  
  // 默认快捷键配置
  const defaultShortcuts = {
    increaseSpeed: 'Ctrl+Shift+Right',
    decreaseSpeed: 'Ctrl+Shift+Left',
    presetSpeed: 'Ctrl+Shift+Space'
  };
  
  // 快捷键描述
  const shortcutDescriptions = {
    increaseSpeed: '提高视频速度 (+0.25x)',
    decreaseSpeed: '降低视频速度 (-0.25x)',
    presetSpeed: '预设速度切换'
  };
  
  // 当前快捷键配置
  let currentShortcuts = { ...defaultShortcuts };
  
  // 正在记录的快捷键
  let recordingInput = null;
  
  // 初始化页面
  function initPage() {
    loadShortcuts();
    renderShortcutInputs();
    updateCurrentShortcutsDisplay();
  }
  
  // 加载快捷键配置
  function loadShortcuts() {
    chrome.runtime.sendMessage({ action: 'getShortcuts' }, (response) => {
      if (response && Object.keys(response).length > 0) {
        currentShortcuts = { ...response };
      } else {
        currentShortcuts = { ...defaultShortcuts };
      }
      updateCurrentShortcutsDisplay();
      renderShortcutInputs();
    });
  }
  
  // 更新当前快捷键显示
  function updateCurrentShortcutsDisplay() {
    let html = '当前快捷键：<br>';
    for (const [id, shortcut] of Object.entries(currentShortcuts)) {
      html += `• ${shortcutDescriptions[id]}: <span class="key-badge">${shortcut}</span><br>`;
    }
    currentShortcutsDiv.innerHTML = html;
  }
  
  // 渲染快捷键输入框
  function renderShortcutInputs() {
    shortcutsContainer.innerHTML = '';
    
    for (const [id, description] of Object.entries(shortcutDescriptions)) {
      const shortcutItem = document.createElement('div');
      shortcutItem.className = 'shortcut-item';
      
      shortcutItem.innerHTML = `
        <div class="shortcut-label">
          <span>${description}</span>
          <span class="key-badge">${currentShortcuts[id]}</span>
        </div>
        <div class="shortcut-description">点击输入框，然后按下想要的快捷键组合</div>
        <div class="shortcut-input-group">
          <input type="text" 
                 class="shortcut-input" 
                 id="input-${id}" 
                 placeholder="点击设置快捷键" 
                 readonly 
                 data-action="${id}"
                 value="${currentShortcuts[id]}">
          <button class="btn btn-secondary" id="record-${id}">录制</button>
        </div>
        <div class="input-hint">支持 Ctrl、Alt、Shift、Meta (Windows/Command) 键组合</div>
      `;
      
      shortcutsContainer.appendChild(shortcutItem);
      
      // 添加事件监听器
      const input = document.getElementById(`input-${id}`);
      const recordBtn = document.getElementById(`record-${id}`);
      
      input.addEventListener('click', () => startRecording(id, input, recordBtn));
      recordBtn.addEventListener('click', () => startRecording(id, input, recordBtn));
    }
  }
  
  // 开始录制快捷键
  function startRecording(actionId, input, recordBtn) {
    // 如果已经在录制其他快捷键，先停止
    if (recordingInput) {
      stopRecording();
    }
    
    recordingInput = { actionId, input, recordBtn };
    input.value = '按下快捷键...';
    input.classList.add('recording');
    recordBtn.textContent = '停止';
    recordBtn.classList.add('recording');
    
    // 添加键盘事件监听，使用捕获阶段确保能捕获所有按键
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);
    
    showStatus('正在录制快捷键，请按下想要的组合键...', 'info');
  }
  
  // 停止录制
  function stopRecording() {
    if (recordingInput) {
      const { input, recordBtn } = recordingInput;
      input.classList.remove('recording');
      recordBtn.classList.remove('recording');
      recordBtn.textContent = '录制';
      input.value = currentShortcuts[recordingInput.actionId];
      
      // 移除事件监听器，使用相同的捕获参数
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
      
      recordingInput = null;
    }
  }
  
  // 处理键盘按下事件
  function handleKeyDown(e) {
    if (!recordingInput) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // 忽略单独的修饰键按下
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
      recordingInput.input.value = '按下快捷键...';
      return;
    }
    
    const shortcut = buildShortcutStringFromEvent(e);
    
    // 验证快捷键
    if (!isValidShortcut(shortcut)) {
      showStatus('快捷键必须包含至少一个修饰键 (Ctrl/Alt/Shift/Meta)', 'error');
      return;
    }
    
    // 检查是否与其他快捷键冲突
    const conflictAction = findShortcutConflict(shortcut, recordingInput.actionId);
    if (conflictAction) {
      showStatus(`快捷键 "${shortcut}" 已被 "${shortcutDescriptions[conflictAction]}" 使用`, 'error');
      return;
    }
    
    // 更新显示
    recordingInput.input.value = shortcut;
    currentShortcuts[recordingInput.actionId] = shortcut;
    
    showStatus(`快捷键已设置: ${shortcut}`, 'success');
    
    // 停止录制
    stopRecording();
    updateCurrentShortcutsDisplay();
  }
  
  // 处理键盘释放事件
  function handleKeyUp(e) {
    if (!recordingInput) return;
    // 可以在这里添加额外的逻辑
  }
  
  // 从键盘事件构建快捷键字符串
  function buildShortcutStringFromEvent(e) {
    const parts = [];
    
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    if (e.metaKey) {
      // 检测平台并使用正确的名称
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 || 
                    navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
      parts.push(isMac ? 'Command' : 'Meta');
    }
    
    // 处理主键
    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
      let mainKey = e.key;
      
      // 特殊键映射
      const keyMap = {
        ' ': 'Space',
        'ArrowUp': 'Up',
        'ArrowDown': 'Down',
        'ArrowLeft': 'Left',
        'ArrowRight': 'Right',
        'Escape': 'Esc',
        'Delete': 'Del',
        'Insert': 'Ins',
        'Home': 'Home',
        'End': 'End',
        'PageUp': 'PageUp',
        'PageDown': 'PageDown',
        'Tab': 'Tab',
        'Enter': 'Enter',
        'Backspace': 'Backspace',
        'CapsLock': 'CapsLock',
        'NumLock': 'NumLock',
        'ScrollLock': 'ScrollLock',
        'Pause': 'Pause',
        'PrintScreen': 'PrintScreen',
        'ContextMenu': 'ContextMenu',
        'Help': 'Help',
        'F1': 'F1', 'F2': 'F2', 'F3': 'F3', 'F4': 'F4',
        'F5': 'F5', 'F6': 'F6', 'F7': 'F7', 'F8': 'F8',
        'F9': 'F9', 'F10': 'F10', 'F11': 'F11', 'F12': 'F12'
      };
      
      if (keyMap[mainKey]) {
        mainKey = keyMap[mainKey];
      } else if (mainKey.length === 1) {
        // 单个字符转换为大写
        mainKey = mainKey.toUpperCase();
      }
      
      parts.push(mainKey);
    }
    
    return parts.join('+');
  }
  
  // 验证快捷键是否有效
  function isValidShortcut(shortcut) {
    if (!shortcut) return false;
    
    // 必须包含至少一个修饰键
    const hasModifier = ['Ctrl', 'Alt', 'Shift', 'Meta', 'Command'].some(mod => 
      shortcut.includes(mod)
    );
    
    return hasModifier;
  }
  
  // 查找快捷键冲突
  function findShortcutConflict(shortcut, excludeAction) {
    for (const [actionId, actionShortcut] of Object.entries(currentShortcuts)) {
      if (actionId !== excludeAction && actionShortcut === shortcut) {
        return actionId;
      }
    }
    return null;
  }
  
  // 保存设置
  function saveSettings() {
    chrome.runtime.sendMessage({
      action: 'updateShortcuts',
      shortcuts: currentShortcuts
    }, (response) => {
      if (response && response.success) {
        showStatus('快捷键设置已保存', 'success');
        
        // 更新快捷键参考文档
        chrome.runtime.sendMessage({
          action: 'updateShortcutReference',
          shortcuts: currentShortcuts
        });
      } else {
        showStatus('保存失败，请重试', 'error');
      }
    });
  }
  
  // 重置为默认设置
  function resetSettings() {
    if (!confirm('确定要重置所有快捷键为默认设置吗？')) {
      return;
    }
    
    currentShortcuts = { ...defaultShortcuts };
    renderShortcutInputs();
    updateCurrentShortcutsDisplay();
    showStatus('已重置为默认快捷键', 'info');
  }
  
  // 显示状态消息
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    
    // 3秒后隐藏消息
    setTimeout(() => {
      statusMessage.className = 'status-message';
    }, 3000);
  }
  
  // 返回设置页面
  function goBack() {
    chrome.runtime.openOptionsPage();
    window.close();
  }
  
  // 事件监听器
  saveBtn.addEventListener('click', saveSettings);
  resetBtn.addEventListener('click', resetSettings);
  backBtn.addEventListener('click', goBack);
  
  // 页面卸载时停止录制
  window.addEventListener('beforeunload', () => {
    if (recordingInput) {
      stopRecording();
    }
  });
  
  // 页面失去焦点时也停止录制
  window.addEventListener('blur', () => {
    if (recordingInput) {
      stopRecording();
      showStatus('录制已取消（页面失去焦点）', 'info');
    }
  });
  
  // 初始化
  initPage();
});