# ToDoListBDD 自動化腳本工具

## 概覽

這個目錄包含 ToDoListBDD 專案的自動化腳本工具，專為簡化需求變更管理流程而設計。

## 腳本列表

### 1. 需求到 BDD 場景轉換工具
**檔案**: `requirement-to-bdd.sh`  
**用途**: 將需求變更內容轉換為 BDD 場景範本  
**使用時機**: 收到新的需求變更時

```bash
./scripts/requirement-to-bdd.sh
```

**功能**:
- 自動識別業務功能 vs 基礎設施變更
- 生成結構化的 BDD 場景範本
- 提供 Story 建議和技術影響分析
- 輸出可直接編輯的範本檔案

### 2. BDD 影響分析工具
**檔案**: `analyze-bdd-impact.sh`  
**用途**: 分析新功能對現有 BDD 場景和 Epic/Story 的影響  
**使用時機**: 完善 BDD 場景後，開始開發前

```bash
./scripts/analyze-bdd-impact.sh "關鍵字"
```

**範例**:
```bash
./scripts/analyze-bdd-impact.sh "優先順序"
./scripts/analyze-bdd-impact.sh "搜尋"
./scripts/analyze-bdd-impact.sh "通知"
```

**功能**:
- 搜尋相關的現有 BDD 場景
- 分析 Epic 層級影響
- 建議新增的 Story
- 預估技術實作影響

### 3. 變更記錄工具
**檔案**: `log-change.sh`  
**用途**: 建立結構化的變更記錄檔案  
**使用時機**: 變更實作完成後

```bash
./scripts/log-change.sh
```

**功能**:
- 自動建立時間戳記的記錄檔案
- 提供完整的變更記錄範本
- 支援進度追蹤和經驗學習記錄
- 可選擇立即開啟編輯器

## 完整使用流程

### 步驟 1: 收到需求變更
```bash
# 啟動需求分析工具
./scripts/requirement-to-bdd.sh

# 輸入需求內容，例如：
# 用戶希望可以為每個任務設定優先順序（高、中、低），
# 並且可以按優先順序排序任務列表。
```

### 步驟 2: 完善 BDD 場景
編輯生成的範本檔案 `temp-scenario-YYYYMMDD_HHMMSS.md`，完善 BDD 場景內容。

### 步驟 3: 更新 BDD 規格文件
將完成的場景複製到 `docs/bdd-specifications.md`

### 步驟 4: 影響分析
```bash
# 分析新功能的影響
./scripts/analyze-bdd-impact.sh "優先順序"
```

### 步驟 5: 開始開發
根據影響分析的建議，按照 `docs/story-driven-development-workflow.md` 開始 Story 開發。

### 步驟 6: 記錄變更
```bash
# 完成開發後記錄變更
./scripts/log-change.sh
```

## 腳本相依性

### 系統需求
- **作業系統**: Linux, macOS, Windows (with Git Bash/WSL)
- **必要工具**: bash, grep, sed, date
- **可選工具**: VS Code (code 命令), 記事本 (notepad 命令)

### 檔案相依性
- `docs/bdd-specifications.md` - BDD 規格文件
- `docs/story-driven-development-workflow.md` - Story 開發流程
- `docs/change-logs/` - 變更記錄目錄（自動建立）

## 腳本權限設定

### Windows (Git Bash)
```bash
# 不需要特別設定權限
```

### Linux/macOS
```bash
# 設定執行權限
chmod +x scripts/*.sh
```

## 故障排除

### 常見問題

#### 1. 腳本無法執行
**問題**: `bash: ./scripts/script-name.sh: Permission denied`  
**解決**: 
```bash
chmod +x scripts/script-name.sh
```

#### 2. 找不到 BDD 規格檔案
**問題**: `找不到 docs/bdd-specifications.md 檔案`  
**解決**: 確認在專案根目錄執行腳本

#### 3. 中文輸入問題
**問題**: 中文字元顯示異常  
**解決**: 確認終端支援 UTF-8 編碼

### 除錯模式
```bash
# 使用除錯模式執行腳本
bash -x scripts/requirement-to-bdd.sh
```

## 自訂化

### 修改範本內容
編輯腳本檔案中的 `cat > "$FILE" << EOF` 區塊，可以自訂輸出範本的格式和內容。

### 新增關鍵字識別
在 `requirement-to-bdd.sh` 和 `analyze-bdd-impact.sh` 中的 `grep` 條件可以新增更多關鍵字。

### 整合其他工具
腳本設計為可擴展的，可以整合 Jira API、Slack 通知等外部工具。

## 貢獻指南

### 新增腳本
1. 在 `scripts/` 目錄建立新腳本
2. 遵循現有的命名規範
3. 加入適當的說明註解
4. 更新此 README.md

### 改善現有腳本
1. 保持向後相容性
2. 加入適當的錯誤處理
3. 更新相關文件

## 版本歷史

- **v1.0.0** (2025-08-21): 初始版本
  - 需求到 BDD 場景轉換工具
  - BDD 影響分析工具
  - 變更記錄工具

## 聯絡資訊

如有問題或建議，請透過專案 Issue 系統回報。