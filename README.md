# 🎬 Smart Speeder - 智能视频速度控制器

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://github.com/louisdwu/video-speed-controller)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-red.svg)](https://github.com/louisdwu/video-speed-controller)

一个功能强大的 Chrome 扩展，用于智能控制网页视频的播放速度。支持全局开关、自定义规则、悬浮球显示、预设速度切换以及设置导出导入功能。

## ✨ 核心功能

### 🎮 智能速度控制
- **速度范围**：0.25x - 16.0x 精确控制
- **调整步长**：0.25x
- **多种控制方式**：键盘快捷键、弹出窗口、悬浮球交互

### 🌟 悬浮球显示
- **实时显示**：右下角绿色圆形按钮，实时显示当前播放速度
- **智能交互**：点击直接打开设置页面，悬停放大效果
- **状态感知**：根据规则自动调整透明度，不生效时半透明显示

### ⚡ 预设速度切换
- **一键切换**：Ctrl+Shift+Space 在预设速度和正常速度间快速切换
- **智能逻辑**：当前速度等于预设时切换到 1.0x，否则切换到预设速度
- **自定义预设**：可在设置页面修改预设值（默认 2.0x）

### 🎯 智能规则系统
- **生效规则**：仅在指定网站生效（正则表达式支持）
- **排除规则**：在指定网站不生效（正则表达式支持）
- **规则优先级**：全局开关 → 生效规则 → 排除规则 → 默认全部生效

### 📤📥 设置导出导入
- **完整备份**：导出所有设置到 JSON 文件
- **跨设备同步**：在不同设备间快速同步配置
- **数据验证**：导入时自动验证数据完整性和有效性

## ⌨️ 快捷键

| 快捷键 | 功能 | Windows/Linux | Mac |
|--------|------|---------------|-----|
| `Ctrl + Shift + Right` | 提高速度 (+0.25x) | ✅ | `Command + Shift + Right` |
| `Ctrl + Shift + Left` | 降低速度 (-0.25x) | ✅ | `Command + Shift + Left` |
| `Ctrl + Shift + Space` | 预设速度切换 | ✅ | `Command + Shift + Space` |

## 🚀 快速安装

### 方法一：开发者模式安装（推荐）

1. **克隆项目**
   ```bash
   git clone https://github.com/louisdwu/video-speed-controller.git
   cd video-speed-controller
   ```

2. **打开 Chrome 扩展管理页面**
   - 在 Chrome 地址栏输入：`chrome://extensions/`

3. **启用开发者模式**
   - 在页面右上角开启 **"开发者模式"** 开关

4. **加载扩展**
   - 点击 **"加载已解压的扩展程序"**
   - 选择本项目文件夹

### 方法二：直接下载

1. 下载 [最新版本](https://github.com/louisdwu/video-speed-controller/releases)
2. 解压到文件夹
3. 按照方法一的步骤 2-4 安装

## 📖 使用指南

### 基础使用

1. **打开任意视频网站**（YouTube、Bilibili、Netflix 等）
2. **使用快捷键控制速度**：
   - `Ctrl + Shift + →` 提高速度
   - `Ctrl + Shift + ←` 降低速度
   - `Ctrl + Shift + Space` 切换预设速度
3. **查看悬浮球**：页面右下角显示当前速度
4. **点击悬浮球**：直接打开设置页面

### 高级配置

#### 规则设置示例

**生效规则**（只在匹配网站生效）：
```
youtube\.com              # 只在 YouTube 生效
.*\.bilibili\.com         # 所有 bilibili 子域名
netflix\.com|prime\.video # 多个网站
```

**排除规则**（在匹配网站不生效）：
```
github\.com               # 在 GitHub 不生效
localhost|127\.0\.0\.1    # 本地开发环境不生效
docs\.|support\.          # 文档和支持页面不生效
```

#### 预设速度配置

1. 点击悬浮球或扩展图标打开设置
2. 修改"预设速度"值（0.25x - 16.0x）
3. 使用 `Ctrl + Shift + Space` 快速切换

## 🛠️ 技术架构

- **Manifest V3**：使用最新的 Chrome 扩展规范
- **后台服务**：监听键盘快捷键事件，处理跨标签页通信
- **内容脚本**：注入到所有网页，控制视频元素和悬浮球显示
- **存储系统**：Chrome Storage API 持久化保存设置
- **规则引擎**：基于正则表达式的 URL 匹配算法
- **动态监控**：MutationObserver 监控新增视频元素

## 📁 项目结构

```
smart_speeder/
├── manifest.json              # 扩展配置文件 (Manifest V3)
├── background.js              # 后台服务，处理快捷键和消息通信
├── content.js                 # 内容脚本，视频控制和悬浮球
├── popup.html                 # 弹出窗口界面
├── popup.js                   # 弹出窗口逻辑
├── options.html               # 设置页面界面
├── options.js                 # 设置页面逻辑
├── shortcuts.html             # 快捷键配置页面
├── shortcuts.js               # 快捷键配置逻辑
├── test.html                  # 基础功能测试页面
├── test_export_import.html    # 导出导入功能测试页面
├── test_shortcuts.html        # 快捷键功能测试页面
├── icons/                     # 扩展图标文件
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md                  # 本文档
```

## 🧪 测试

打开项目目录下的测试文件进行功能验证：

```bash
# 基础功能测试
open test.html

# 导出导入功能测试
open test_export_import.html

# 快捷键功能测试
open test_shortcuts.html
```

## ❓ 常见问题

**Q: 为什么在某些网站不起作用？**
A: 检查是否设置了排除规则，或当前网站是否在生效规则中

**Q: 快捷键无效怎么办？**
A: 确保没有与其他扩展的快捷键冲突，或尝试重新加载扩展

**Q: 悬浮球不显示怎么办？**
A: 检查全局开关状态和规则设置，确认当前页面是否在生效范围内

**Q: 如何重置所有设置？**
A: 在设置页面点击"重置所有"按钮，或导入默认配置文件

**Q: 导出的设置文件包含什么信息？**
A: 包含所有用户配置，包括开关状态、规则列表、速度设置等，不包含任何个人隐私数据

## 🌟 新功能亮点

### 悬浮球系统
- **即时可见性**：无需点击扩展图标即可查看当前速度
- **一键访问**：点击悬浮球直接进入设置页面
- **智能状态**：根据规则自动调整显示状态
- **视觉反馈**：速度变化时提供临时提示

### 预设速度切换
- **高效操作**：一键在常用速度和正常速度间切换
- **智能判断**：自动识别当前状态并执行相应操作
- **自定义配置**：支持用户自定义预设速度值

### 设置导出导入
- **设备同步**：轻松在不同设备间同步配置
- **备份保护**：防止设置丢失，支持定期备份
- **分享便利**：可与他人分享满意的配置

## 📊 效率对比

| 操作 | 传统方式 | 预设功能 | 效率提升 |
|------|----------|----------|----------|
| 切换速度 | 8次按键 | 1次按键 | 800% |
| 查看速度 | 需点击扩展 | 悬浮球显示 | 即时 |
| 状态管理 | 多步操作 | 一键访问 | 显著 |

## 🤝 贡献

欢迎提交 Issues 和 Pull Requests！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

感谢所有为本项目做出贡献的开发者和用户！

---

**Made with ❤️ for better video watching experience**

如果觉得这个项目有用，请给它一个 ⭐ Star！"# Smart-Speeder" 
