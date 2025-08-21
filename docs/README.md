# ToDoListBDD 文件目錄

本目錄包含 ToDoListBDD 專案的完整技術文件，採用分層結構組織不同類型的文件。

## 📋 文件結構總覽

```
docs/
├── 📄 核心規範文件
├── 📁 workflows/          # 開發流程文件
└── 📁 wireframes/         # 介面設計文件
```

## 📄 核心文件

### 產品規範
- **[prd-final.md](./prd-final.md)** - 🎯 **產品需求文件**（最終版）
  - 專案目標與背景
  - 功能性與非功能性需求
  - 技術架構概述

### 技術規範
- **[architecture.md](./architecture.md)** - 🏗️ **系統架構設計**
  - Angular 19 + .NET 9 CQRS 架構
  - 資料庫設計與 API 規範
  
- **[front-end-spec-simplified.md](./front-end-spec-simplified.md)** - 🎨 **前端技術規範**
  - UI/UX 設計原則
  - 元件架構與互動設計

### BDD 與測試
- **[bdd-specifications.md](./bdd-specifications.md)** - 🧪 **BDD 場景規範**
  - 使用者故事與驗收標準
  - Gherkin 測試場景定義
  
- **[bdd-testing-strategy.md](./bdd-testing-strategy.md)** - 🔬 **測試策略**
  - BDD 測試流程與工具
  - 自動化測試架構

### 專案管理
- **[sprint-change-proposal.md](./sprint-change-proposal.md)** - 📝 **Sprint 變更提案**
  - 變更請求範本
  - 影響分析流程

## 📁 子目錄

### workflows/ - 開發流程文件
工作流程指南與最佳實踐：

- **[change-management-workflow.md](./workflows/change-management-workflow.md)** - 🔄 變更管理流程
- **[epic-story-planning-workflow.md](./workflows/epic-story-planning-workflow.md)** - 📊 Epic/Story 規劃流程  
- **[story-driven-development-workflow.md](./workflows/story-driven-development-workflow.md)** - 🚀 故事驅動開發流程

### wireframes/ - 介面設計文件
UI/UX 設計規範與線框圖：

- **[README-simplified.md](./wireframes/README-simplified.md)** - 📐 線框圖說明（簡化版）

## 🗃️ 歷史文件（參考用）

以下文件保留作為開發歷史參考：

- **[brief.md](./brief.md)** - 📋 初始專案簡報
- **[req.md](./req.md)** - 📝 最初需求摘要

## 🚀 快速導航

### 新手開始
1. 閱讀 [prd-final.md](./prd-final.md) 瞭解專案概述
2. 參考 [workflows/story-driven-development-workflow.md](./workflows/story-driven-development-workflow.md) 瞭解開發流程
3. 查看 [bdd-specifications.md](./bdd-specifications.md) 瞭解功能需求

### 開發人員
1. 查看 [architecture.md](./architecture.md) 瞭解系統架構
2. 參考 [front-end-spec-simplified.md](./front-end-spec-simplified.md) 進行前端開發
3. 依照 [bdd-testing-strategy.md](./bdd-testing-strategy.md) 執行測試

### 專案管理
1. 使用 [workflows/change-management-workflow.md](./workflows/change-management-workflow.md) 處理變更
2. 參考 [sprint-change-proposal.md](./sprint-change-proposal.md) 提出變更請求
3. 依照 [workflows/epic-story-planning-workflow.md](./workflows/epic-story-planning-workflow.md) 規劃功能

## 📝 文件維護

- **更新頻率**: 依專案進度即時更新
- **版本控制**: 所有文件變更都應記錄在 git commit 中
- **審查流程**: 重要規範變更需要團隊審查

---

*最後更新: 2025-08-21*