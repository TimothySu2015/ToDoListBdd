

## 語言要求

**重要：所有回應和文件都必須使用繁體中文。**

## 開發環境規範

### 系統環境要求

- **開發作業系統**: Windows 系統
  - 所有開發環境、工具配置、腳本命令都基於 Windows 環境
  - 使用 Windows PowerShell 或 Command Prompt 執行命令
  - 路徑分隔符號使用反斜線 `\`

### 前端開發環境

- **開發伺服器 PORT 規範**: 前端開發必須使用 `4200` PORT
  - Angular dev server 預設使用 `ng serve --port 4200`
  - 如果啟動服務或建置時發現 PORT 4200 已被佔用：
    1. **必須先停止佔用該 PORT 的服務**
    2. **再重新啟動前端開發服務**
  - Windows PORT 檢查命令：`netstat -ano | findstr :4200`
  - Windows 停止 PORT 佔用：`taskkill /PID <PID> /F`