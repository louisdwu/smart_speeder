// Popup script for quick settings
document.addEventListener('DOMContentLoaded', () => {
  const globalToggle = document.getElementById('globalToggle');
  const speedDisplay = document.getElementById('speedDisplay');
  const decreaseBtn = document.getElementById('decreaseBtn');
  const increaseBtn = document.getElementById('increaseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const optionsBtn = document.getElementById('optionsBtn');
  const shortcutsBtn = document.getElementById('shortcutsBtn');
  const statusIndicator = document.getElementById('statusIndicator');
  const currentUrlSpan = document.getElementById('currentUrl');
  const presetBtn = document.getElementById('presetBtn');
  const presetDisplay = document.getElementById('presetDisplay');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFileInput = document.getElementById('importFileInput');
  
  let currentSpeed = 1.0;
  let settings = {
    globalEnabled: true,
    excludeRules: [],
    includeRules: [],
    defaultSpeed: 1.0,
    presetSpeed: 2.0
  };
  
  // Load settings
  function loadSettings() {
    chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
      if (response) {
        // Ensure all required properties exist
        settings = {
          globalEnabled: response.globalEnabled !== false,
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
          excludeRules: [],
          includeRules: [],
          defaultSpeed: 1.0,
          presetSpeed: 2.0
        };
        updateUI();
      }
    });
  }
  
  // Update UI based on settings
  function updateUI() {
    // Update toggle
    if (settings.globalEnabled) {
      globalToggle.classList.add('active');
      statusIndicator.className = 'status enabled';
      statusIndicator.textContent = '✓ 全局功能已开启';
    } else {
      globalToggle.classList.remove('active');
      statusIndicator.className = 'status disabled';
      statusIndicator.textContent = '✗ 全局功能已关闭';
    }
    
    // Update speed display
    speedDisplay.textContent = `${currentSpeed.toFixed(2)}x`;
    
    // Update preset display
    if (presetDisplay) {
      presetDisplay.textContent = `${settings.presetSpeed.toFixed(2)}x`;
    }
  }
  
  // Get current tab and check if it should apply speed
  function checkCurrentTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        const url = tabs[0].url;
        currentUrlSpan.textContent = new URL(url).hostname;
        
        // Check if this URL should apply speed
        const shouldApply = shouldApplyToUrl(url);
        if (!shouldApply) {
          statusIndicator.className = 'status disabled';
          statusIndicator.textContent = '✗ 当前页面被规则排除';
        }
      }
    });
  }
  
  // Check if URL should apply speed
  function shouldApplyToUrl(url) {
    if (!settings.globalEnabled) return false;
    
    // Ensure arrays are defined
    const includeRules = Array.isArray(settings.includeRules) ? settings.includeRules : [];
    const excludeRules = Array.isArray(settings.excludeRules) ? settings.excludeRules : [];
    
    if (includeRules.length > 0) {
      return includeRules.some(rule => {
        try {
          return new RegExp(rule).test(url);
        } catch (e) {
          return false;
        }
      });
    }
    
    if (excludeRules.length > 0) {
      const isExcluded = excludeRules.some(rule => {
        try {
          return new RegExp(rule).test(url);
        } catch (e) {
          return false;
        }
      });
      if (isExcluded) return false;
    }
    
    return true;
  }
  
  // Get current speed from active tab
  function getCurrentSpeed() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        // Send message to content script to get current speed
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getSpeed' }, (response) => {
          if (response && response.speed !== undefined) {
            currentSpeed = response.speed;
            updateUI();
          } else {
            // If no response, use default
            currentSpeed = settings.defaultSpeed || 1.0;
            updateUI();
          }
        });
      }
    });
  }
  
  // Event listeners
  globalToggle.addEventListener('click', () => {
    settings.globalEnabled = !settings.globalEnabled;
    chrome.runtime.sendMessage({
      action: 'saveSettings',
      settings: settings
    }, () => {
      updateUI();
      // Notify current tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'reloadSettings' });
        }
      });
    });
  });
  
  decreaseBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'decreaseSpeed' }, (response) => {
          if (response) {
            currentSpeed = Math.max(currentSpeed - 0.25, 0.25);
            updateUI();
          }
        });
      }
    });
  });
  
  increaseBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'increaseSpeed' }, (response) => {
          if (response) {
            currentSpeed = Math.min(currentSpeed + 0.25, 16.0);
            updateUI();
          }
        });
      }
    });
  });
  
  resetBtn.addEventListener('click', () => {
    currentSpeed = settings.defaultSpeed || 1.0;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        // Send message to reset speed
        chrome.tabs.sendMessage(tabs[0].id, { action: 'increaseSpeed' }, () => {
          // Then send decrease to trigger update
          chrome.tabs.sendMessage(tabs[0].id, { action: 'decreaseSpeed' }, () => {
            updateUI();
          });
        });
      }
    });
  });
  
  optionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  // 快捷键配置按钮
  if (shortcutsBtn) {
    shortcutsBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('shortcuts.html') });
    });
  }
  
  // Preset speed toggle button
  if (presetBtn) {
    presetBtn.addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'presetSpeed' }, (response) => {
            if (response) {
              // Update current speed based on preset
              const preset = settings.presetSpeed || 2.0;
              if (Math.abs(currentSpeed - preset) < 0.01) {
                currentSpeed = 1.0;
              } else {
                currentSpeed = preset;
              }
              updateUI();
            }
          });
        }
      });
    });
  }
  
  // Export settings
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      // Ensure arrays are initialized before export
      if (!Array.isArray(settings.includeRules)) {
        settings.includeRules = [];
      }
      if (!Array.isArray(settings.excludeRules)) {
        settings.excludeRules = [];
      }
      
      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        settings: settings
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
      
      // Show temporary feedback
      const originalText = exportBtn.textContent;
      exportBtn.textContent = '✓ 已导出';
      exportBtn.style.background = '#4CAF50';
      setTimeout(() => {
        exportBtn.textContent = originalText;
        exportBtn.style.background = '#FF9800';
      }, 1500);
    });
  }
  
  // Import settings
  if (importBtn) {
    importBtn.addEventListener('click', () => {
      importFileInput.click();
    });
  }
  
  // Handle file import
  if (importFileInput) {
    importFileInput.addEventListener('change', (event) => {
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
          
          if (confirm(`确定要导入设置吗？\n\n导入的设置将覆盖当前设置：\n- 全局功能: ${importedSettings.globalEnabled ? '启用' : '禁用'}\n- 默认速度: ${importedSettings.defaultSpeed}x\n- 预设速度: ${importedSettings.presetSpeed}x\n- 生效规则: ${includeRulesLength} 条\n- 排除规则: ${excludeRulesLength} 条`)) {
            
            // 应用导入的设置 - 确保数据完整性
            settings = {
              globalEnabled: importedSettings.globalEnabled !== false,
              excludeRules: Array.isArray(importedSettings.excludeRules) ? importedSettings.excludeRules : [],
              includeRules: Array.isArray(importedSettings.includeRules) ? importedSettings.includeRules : [],
              defaultSpeed: importedSettings.defaultSpeed || 1.0,
              presetSpeed: importedSettings.presetSpeed || 2.0
            };
            
            chrome.runtime.sendMessage({
              action: 'saveSettings',
              settings: settings
            }, (response) => {
              if (response && response.success) {
                updateUI();
                // Show feedback
                const originalText = importBtn.textContent;
                importBtn.textContent = '✓ 导入成功';
                importBtn.style.background = '#4CAF50';
                setTimeout(() => {
                  importBtn.textContent = originalText;
                  importBtn.style.background = '#9C27B0';
                }, 1500);
                
                // Notify current tab
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                  if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: 'reloadSettings' });
                  }
                });
              } else {
                alert('导入失败');
              }
            });
          }
          
        } catch (error) {
          alert('导入失败: ' + error.message);
        }
        
        // 清空文件输入
        event.target.value = '';
      };
      
      reader.onerror = function() {
        alert('文件读取失败');
        event.target.value = '';
      };
      
      reader.readAsText(file);
    });
  }
  
  // Add keyboard shortcut info to the popup
  const keyboardHint = document.createElement('div');
  keyboardHint.className = 'keyboard-hint';
  keyboardHint.innerHTML = `
    💡 悬浮球提示：<br>
    • 右下角显示当前速度<br>
    • 点击悬浮球打开设置<br>
    • 悬浮球会自动隐藏在不生效的页面<br><br>
    💡 预设快捷键：<br>
    • Ctrl+Shift+Space 切换预设/正常速度
  `;
  document.body.appendChild(keyboardHint);
  
  // Initialize
  loadSettings();
  checkCurrentTab();
  getCurrentSpeed();
});