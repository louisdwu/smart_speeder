// Options page script for rule management
document.addEventListener('DOMContentLoaded', () => {
  const globalToggle = document.getElementById('globalToggle');
  const defaultSpeedInput = document.getElementById('defaultSpeed');
  const presetSpeedInput = document.getElementById('presetSpeed');
  const includeRuleInput = document.getElementById('includeRuleInput');
  const excludeRuleInput = document.getElementById('excludeRuleInput');
  const addIncludeBtn = document.getElementById('addIncludeRule');
  const addExcludeBtn = document.getElementById('addExcludeRule');
  const includeRulesList = document.getElementById('includeRulesList');
  const excludeRulesList = document.getElementById('excludeRulesList');
  const saveBtn = document.getElementById('saveBtn');
  const resetBtn = document.getElementById('resetBtn');
  const shortcutsBtn = document.getElementById('shortcutsBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFileInput = document.getElementById('importFileInput');
  const statusMessage = document.getElementById('statusMessage');
  
  let settings = {
    globalEnabled: true,
    hideFloatingBall: false,
    excludeRules: [],
    includeRules: [],
    defaultSpeed: 1.0,
    presetSpeed: 2.0
  };
  
  // Load settings from storage
  function loadSettings() {
    chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
      if (response) {
        // Ensure all required properties exist
        settings = {
          globalEnabled: response.globalEnabled !== false,
          hideFloatingBall: response.hideFloatingBall || false,
          excludeRules: Array.isArray(response.excludeRules) ? response.excludeRules : [],
          includeRules: Array.isArray(response.includeRules) ? response.includeRules : [],
          defaultSpeed: response.defaultSpeed || 1.0,
          presetSpeed: response.presetSpeed || 2.0
        };
        updateUI();
      } else {
        // If no response, use default settings
        settings = {
          globalEnabled: true,
          hideFloatingBall: false,
          excludeRules: [],
          includeRules: [],
          defaultSpeed: 1.0,
          presetSpeed: 2.0
        };
        updateUI();
      }
    });
  }
  
  // Update UI with current settings
  function updateUI() {
    // Update toggle
    if (settings.globalEnabled) {
      globalToggle.classList.add('active');
    } else {
      globalToggle.classList.remove('active');
    }
    
    // Update hide floating ball toggle
    const hideFloatingBallToggle = document.getElementById('hideFloatingBallToggle');
    if (settings.hideFloatingBall) {
      hideFloatingBallToggle.classList.add('active');
    } else {
      hideFloatingBallToggle.classList.remove('active');
    }
    
    // Update default speed
    defaultSpeedInput.value = settings.defaultSpeed;
    
    // Update preset speed
    if (presetSpeedInput) {
      presetSpeedInput.value = settings.presetSpeed;
    }
    
    // Update rules lists - ensure arrays are defined
    renderRulesList(includeRulesList, settings.includeRules || [], 'include');
    renderRulesList(excludeRulesList, settings.excludeRules || [], 'exclude');
  }
  
  // Render rules list
  function renderRulesList(container, rules, type) {
    container.innerHTML = '';
    
    // Ensure rules is an array
    if (!Array.isArray(rules) || rules.length === 0) {
      container.innerHTML = '<div class="empty-state">暂无规则</div>';
      return;
    }
    
    rules.forEach((rule, index) => {
      const item = document.createElement('div');
      item.className = 'rule-item';
      
      const ruleText = document.createElement('span');
      ruleText.className = 'rule-text';
      ruleText.textContent = rule;
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'rule-delete';
      deleteBtn.textContent = '删除';
      deleteBtn.addEventListener('click', () => {
        deleteRule(type, index);
      });
      
      item.appendChild(ruleText);
      item.appendChild(deleteBtn);
      container.appendChild(item);
    });
  }
  
  // Add rule
  function addRule(type) {
    const input = type === 'include' ? includeRuleInput : excludeRuleInput;
    const rule = input.value.trim();
    
    if (!rule) {
      showStatus('请输入正则表达式', 'error');
      return;
    }
    
    // Validate regex
    try {
      new RegExp(rule);
    } catch (e) {
      showStatus('无效的正则表达式: ' + e.message, 'error');
      return;
    }
    
    // Ensure arrays are initialized
    if (type === 'include') {
      if (!Array.isArray(settings.includeRules)) {
        settings.includeRules = [];
      }
      if (!settings.includeRules.includes(rule)) {
        settings.includeRules.push(rule);
      }
    } else {
      if (!Array.isArray(settings.excludeRules)) {
        settings.excludeRules = [];
      }
      if (!settings.excludeRules.includes(rule)) {
        settings.excludeRules.push(rule);
      }
    }
    
    input.value = '';
    updateUI();
    showStatus('规则已添加', 'success');
  }
  
  // Delete rule
  function deleteRule(type, index) {
    if (type === 'include') {
      if (Array.isArray(settings.includeRules)) {
        settings.includeRules.splice(index, 1);
      }
    } else {
      if (Array.isArray(settings.excludeRules)) {
        settings.excludeRules.splice(index, 1);
      }
    }
    updateUI();
    showStatus('规则已删除', 'success');
  }
  
  // Show status message
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    
    setTimeout(() => {
      statusMessage.className = 'status-message';
    }, 3000);
  }
  
  // Save settings
  function saveSettings() {
    const defaultSpeed = parseFloat(defaultSpeedInput.value);
    const presetSpeed = presetSpeedInput ? parseFloat(presetSpeedInput.value) : 2.0;
    
    if (isNaN(defaultSpeed) || defaultSpeed < 0.25 || defaultSpeed > 16.0) {
      showStatus('默认速度必须在 0.25 到 16.0 之间', 'error');
      return;
    }
    
    if (isNaN(presetSpeed) || presetSpeed < 0.25 || presetSpeed > 16.0) {
      showStatus('预设速度必须在 0.25 到 16.0 之间', 'error');
      return;
    }
    
    // Ensure arrays are initialized
    if (!Array.isArray(settings.includeRules)) {
      settings.includeRules = [];
    }
    if (!Array.isArray(settings.excludeRules)) {
      settings.excludeRules = [];
    }
    
    settings.defaultSpeed = defaultSpeed;
    settings.presetSpeed = presetSpeed;
    
    chrome.runtime.sendMessage({
      action: 'saveSettings',
      settings: settings
    }, (response) => {
      if (response && response.success) {
        showStatus('设置已保存', 'success');
      } else {
        showStatus('保存失败', 'error');
      }
    });
  }
  
  // Reset all settings
  function resetSettings() {
    if (!confirm('确定要重置所有设置吗？这将清除所有规则。')) {
      return;
    }
    
    settings = {
      globalEnabled: true,
      hideFloatingBall: false,
      excludeRules: [],
      includeRules: [],
      defaultSpeed: 1.0,
      presetSpeed: 2.0
    };
    
    chrome.runtime.sendMessage({
      action: 'saveSettings',
      settings: settings
    }, (response) => {
      if (response && response.success) {
        updateUI();
        showStatus('所有设置已重置', 'success');
      } else {
        showStatus('重置失败', 'error');
      }
    });
  }
  
  // Export settings
  function exportSettings() {
    // Ensure arrays are initialized before export
    if (!Array.isArray(settings.includeRules)) {
      settings.includeRules = [];
    }
    if (!Array.isArray(settings.excludeRules)) {
      settings.excludeRules = [];
    }
    
    // 获取快捷键配置
    chrome.runtime.sendMessage({ action: 'getShortcuts' }, (shortcutsResponse) => {
      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        settings: settings,
        shortcuts: shortcutsResponse || {}
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `video-speed-controller-settings-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showStatus('设置已导出', 'success');
    });
  }
  
  // Import settings
  function importSettings() {
    importFileInput.click();
  }
  
  // Handle file import
  function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const importData = JSON.parse(e.target.result);
        
        // Validate import data
        if (!importData.settings) {
          throw new Error('无效的导入文件格式');
        }
        
        const importedSettings = importData.settings;
        
        // Validate required fields - allow undefined for arrays and convert to empty arrays
        if (typeof importedSettings.globalEnabled !== 'boolean' ||
            (importedSettings.excludeRules !== undefined && !Array.isArray(importedSettings.excludeRules)) ||
            (importedSettings.includeRules !== undefined && !Array.isArray(importedSettings.includeRules)) ||
            typeof importedSettings.defaultSpeed !== 'number' ||
            typeof importedSettings.presetSpeed !== 'number') {
          throw new Error('导入的设置数据格式不正确');
        }
        
        // Normalize arrays
        if (!Array.isArray(importedSettings.excludeRules)) {
          importedSettings.excludeRules = [];
        }
        if (!Array.isArray(importedSettings.includeRules)) {
          importedSettings.includeRules = [];
        }
        
        // Validate speed values
        if (importedSettings.defaultSpeed < 0.25 || importedSettings.defaultSpeed > 16.0 ||
            importedSettings.presetSpeed < 0.25 || importedSettings.presetSpeed > 16.0) {
          throw new Error('速度值必须在 0.25 到 16.0 之间');
        }
        
        // Validate regex patterns
        for (const rule of importedSettings.excludeRules) {
          try {
            new RegExp(rule);
          } catch (e) {
            throw new Error(`无效的排除规则正则表达式: ${rule}`);
          }
        }
        
        for (const rule of importedSettings.includeRules) {
          try {
            new RegExp(rule);
          } catch (e) {
            throw new Error(`无效的生效规则正则表达式: ${rule}`);
          }
        }
        
        // Confirm import - ensure arrays are defined for length check
        const includeRulesLength = Array.isArray(importedSettings.includeRules) ? importedSettings.includeRules.length : 0;
        const excludeRulesLength = Array.isArray(importedSettings.excludeRules) ? importedSettings.excludeRules.length : 0;
        
        if (confirm(`确定要导入设置吗？\n\n导入的设置将覆盖当前设置：\n- 全局功能: ${importedSettings.globalEnabled ? '启用' : '禁用'}\n- 默认速度: ${importedSettings.defaultSpeed}x\n- 预设速度: ${importedSettings.presetSpeed}x\n- 生效规则: ${includeRulesLength} 条\n- 排除规则: ${excludeRulesLength} 条\n\n当前设置将被备份到剪贴板（如果可能）。`)) {
          
          // 尝试备份当前设置到剪贴板
          try {
            const backupData = {
              version: '1.0',
              timestamp: new Date().toISOString(),
              settings: settings
            };
            navigator.clipboard.writeText(JSON.stringify(backupData, null, 2)).catch(() => {});
          } catch (e) {
            // 忽略剪贴板错误
          }
          
          // 应用导入的设置 - 确保数据完整性
          settings = {
            globalEnabled: importedSettings.globalEnabled !== false,
            excludeRules: Array.isArray(importedSettings.excludeRules) ? importedSettings.excludeRules : [],
            includeRules: Array.isArray(importedSettings.includeRules) ? importedSettings.includeRules : [],
            defaultSpeed: importedSettings.defaultSpeed || 1.0,
            presetSpeed: importedSettings.presetSpeed || 2.0
          };
          
          // 保存基础设置
          chrome.runtime.sendMessage({
            action: 'saveSettings',
            settings: settings
          }, (response) => {
            if (response && response.success) {
              // 如果导入数据包含快捷键，也保存快捷键
              if (importData.shortcuts && Object.keys(importData.shortcuts).length > 0) {
                chrome.runtime.sendMessage({
                  action: 'updateShortcuts',
                  shortcuts: importData.shortcuts
                }, (shortcutResponse) => {
                  if (shortcutResponse && shortcutResponse.success) {
                    updateUI();
                    showStatus('设置和快捷键导入成功', 'success');
                  } else {
                    updateUI();
                    showStatus('设置导入成功，但快捷键导入失败', 'warning');
                  }
                });
              } else {
                updateUI();
                showStatus('设置导入成功', 'success');
              }
            } else {
              showStatus('导入失败', 'error');
            }
          });
        }
        
      } catch (error) {
        showStatus('导入失败: ' + error.message, 'error');
      }
      
      // 清空文件输入
      event.target.value = '';
    };
    
    reader.onerror = function() {
      showStatus('文件读取失败', 'error');
      event.target.value = '';
    };
    
    reader.readAsText(file);
  }
  
  // Event listeners
  globalToggle.addEventListener('click', () => {
    settings.globalEnabled = !settings.globalEnabled;
    updateUI();
  });
  
  const hideFloatingBallToggle = document.getElementById('hideFloatingBallToggle');
  hideFloatingBallToggle.addEventListener('click', () => {
    settings.hideFloatingBall = !settings.hideFloatingBall;
    updateUI();
  });
  
  addIncludeBtn.addEventListener('click', () => addRule('include'));
  addExcludeBtn.addEventListener('click', () => addRule('exclude'));
  
  includeRuleInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addRule('include');
  });
  
  excludeRuleInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addRule('exclude');
  });
  
  saveBtn.addEventListener('click', saveSettings);
  resetBtn.addEventListener('click', resetSettings);
  
  // 导出和导入按钮
  if (exportBtn) {
    exportBtn.addEventListener('click', exportSettings);
  }
  
  if (importBtn) {
    importBtn.addEventListener('click', importSettings);
  }
  
  if (importFileInput) {
    importFileInput.addEventListener('change', handleFileImport);
  }
  
  // 快捷键配置按钮
  if (shortcutsBtn) {
    shortcutsBtn.addEventListener('click', () => {
      // 打开快捷键配置页面
      chrome.tabs.create({ url: chrome.runtime.getURL('shortcuts.html') });
    });
  }
  
  // Initialize
  loadSettings();
});