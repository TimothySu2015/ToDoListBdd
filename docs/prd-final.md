# ToDoListBDD Product Requirements Document (PRD)

## 專案概述

### 專案目標

1. **主要目標**: 創建一個簡潔、美觀、高效的個人待辦清單網頁應用
2. **學習目標**: 展示 BDD 驅動的全端開發流程最佳實踐
3. **技術目標**: 提供 Angular 19 + .NET 9 (CQRS + MediatR) 的完整示範
4. **流程目標**: 實現 BDD 文件作為業務需求唯一來源的開發生態系統

### 專案背景

ToDoListBDD 是一個**開發流程示範專案**，重點在於展示如何用 BDD 方法論驅動現代全端開發。專案功能保持簡化以便專注於開發流程的最佳實踐。

### 核心理念

**分層開發流程**：
1. **基礎設施層**: 技術架構、開發環境、CI/CD（非 BDD 驅動）
2. **業務功能層**: 用戶功能實作（完全 BDD 驅動）

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-08-21 | 3.0 | BDD 驅動版 PRD，完整技術棧 | PM |

## Requirements

### Functional Requirements

1. **FR1**: 用戶可以在輸入框中快速新增待辦任務
2. **FR2**: 用戶可以點擊勾選框將任務標記為已完成
3. **FR3**: 用戶可以雙擊任務文字進行內聯編輯
4. **FR4**: 用戶可以刪除不需要的任務
5. **FR5**: 系統自動將任務資料儲存至 SQLite 資料庫
6. **FR6**: 用戶可以在待辦和已完成任務間切換檢視
7. **FR7**: 用戶可以清除所有已完成的任務
8. **FR8**: 應用支援基本的鍵盤快捷鍵操作
9. **FR9**: 系統在頁面重新載入後保持任務資料
10. **FR10**: 用戶可以使用基本的篩選功能搜尋任務

### Non-Functional Requirements

1. **NFR1**: 應用首次載入時間必須少於 2 秒
2. **NFR2**: 所有使用者操作的回應時間必須少於 200ms
3. **NFR3**: 應用必須在主流桌面和行動瀏覽器上正常運作
4. **NFR4**: 界面必須符合 WCAG 2.1 AA 無障礙標準
5. **NFR5**: 應用必須提供響應式設計，適應不同螢幕尺寸
6. **NFR6**: SQLite 資料庫必須可靠，支援並發存取
7. **NFR7**: 應用應使用現代網頁技術，展示最佳實踐
8. **NFR8**: 程式碼必須整潔、可維護，適合作為學習範例
9. **NFR9**: 所有功能必須有對應的 BDD 測試場景
10. **NFR10**: API 回應時間必須少於 100ms

## Technical Stack

### Complete Technology Stack

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Frontend Framework | Angular | 19.x | SPA 前端應用 | 現代 TypeScript、優秀的 CLI 工具、企業級框架 |
| Frontend Language | TypeScript | 5.x | 前端開發語言 | 類型安全、現代 JavaScript 功能 |
| Backend Framework | .NET | 9.x | Web API 服務 | 最新 C# 功能、高效能、跨平台 |
| CQRS Library | MediatR | 12.x | 命令查詢分離 | .NET 標準 CQRS 實作、解耦架構 |
| Database | SQLite | 3.x | 資料儲存 | 輕量級、零設定、BDD 測試友善 |
| ORM | Entity Framework Core | 9.x | 資料存取層 | SQLite 整合、CQRS 模式支援 |
| API Style | RESTful API | - | 前後端通訊 | 標準化、易於測試和文件化 |
| Frontend Testing | Jasmine + Karma | Latest | 前端單元測試 | Angular 預設測試框架 |
| Backend Testing | xUnit | Latest | 後端單元測試 | .NET 標準測試框架 |
| BDD Testing | SpecFlow + Cucumber | Latest | 行為驅動測試 | Gherkin 語法、跨技術棧一致性 |
| E2E Testing | Selenium WebDriver | Latest | 端到端測試 | 完整使用者情境驗證 |
| Build Tool (Frontend) | Angular CLI | 19.x | 前端建置工具 | 完整的開發體驗 |
| Build Tool (Backend) | .NET CLI | 9.x | 後端建置工具 | 跨平台建置和部署 |

## Service Architecture

### BDD 驅動的全端分離架構

**架構概觀：**
```
前端 (Angular 19 SPA)
    ↓ HTTP RESTful API
後端 (.NET 9 Web API + MediatR CQRS)
    ↓ Entity Framework Core
資料庫 (SQLite 檔案型資料庫)
```

**CQRS 架構層級：**
1. **API Controllers** → 接收 HTTP 請求，路由到 MediatR
2. **MediatR** → 分發 Commands (寫入) 和 Queries (讀取)
3. **Command/Query Handlers** → 業務邏輯處理
4. **Entity Framework Core** → 資料存取抽象層
5. **SQLite Database** → 實際資料儲存

**BDD 驅動開發流程：**
```
BDD 場景撰寫 → API 契約定義 → 測試腳本建立 → 前後端實作 → 驗證測試
```

## Epic 規劃

### Epic 分類

#### A. 基礎設施 Epic（非 BDD 驅動）
技術架構、開發環境建立，不涉及業務邏輯

#### B. 業務功能 Epic（BDD 驅動）
所有用戶可見功能，完全基於 BDD 場景驅動開發

### Epic 列表

#### Epic 1: 基礎設施建立（基礎設施類型）
**目標：** 建立開發所需的技術基礎設施
**範圍：** 
- 專案架構設置
- 開發環境配置  
- CI/CD 管道建立
- 測試框架基礎設施
- 部署環境準備

**特色：** 此 Epic 不使用 BDD 流程，純粹技術實作

#### Epic 2: 核心任務管理（業務功能類型）
**目標：** 實作基礎的任務 CRUD 功能
**BDD 場景來源：** `docs/bdd-specifications.md` - Scenario 1-4
**範圍：**
- 新增待辦任務
- 標記任務完成/待辦
- 編輯任務內容  
- 刪除任務

**特色：** 完全 BDD 驅動，每個 Story 基於具體 BDD 場景

#### Epic 3: 進階功能（業務功能類型）
**目標：** 提供任務管理的進階功能
**BDD 場景來源：** `docs/bdd-specifications.md` - Scenario 5-9
**範圍：**
- 任務檢視切換（待辦/已完成/全部）
- 搜尋和篩選任務
- 批量清除已完成任務
- 鍵盤快捷鍵支援
- 資料持久化和錯誤處理

**特色：** 完全 BDD 驅動

#### Epic 4: 系統優化與部署（混合類型）
**目標：** 系統整合、效能優化和生產部署
**範圍：**
- E2E BDD 測試整合（BDD 驅動）
- 效能優化（技術驅動）
- 生產環境部署（技術驅動）
- 監控和日誌（技術驅動）

**特色：** 測試部分 BDD 驅動，基礎設施部分技術驅動

## User Interface Design Goals

### Overall UX Vision

創造一個令人愉悅、直觀的待辦清單體驗，同時展示現代前端開發的最佳實踐。設計應該簡潔優雅，每個交互都有即時的視覺回饋。

### Key Interaction Paradigms

- **即時回應**: 所有操作都提供立即的 API 回應和視覺回饋
- **鍵盤友善**: 支援完整的鍵盤快捷鍵
- **錯誤處理**: 優雅的網路錯誤和 API 錯誤處理
- **載入狀態**: 清晰的載入指示器和骨架畫面
- **離線支援**: 基本的離線容錯機制

### Core Screens and Views

- **主頁面**: 包含所有核心功能的單頁面應用
- **任務管理區**: API 驅動的任務 CRUD 操作
- **狀態指示區**: 網路狀態、載入狀態、錯誤狀態

### Accessibility: WCAG AA

完全符合 WCAG 2.1 AA 標準，包括鍵盤導航、螢幕閱讀器支援、適當色彩對比。

### Target Device and Platforms: Web Responsive

完全響應式的網頁應用，支援桌面、平板、手機瀏覽器。

## 開發流程架構

### 雙軌開發流程

#### 軌道 A: 基礎設施開發流程（技術驅動）
```
需求分析 → 技術選型 → 架構設計 → 環境建置 → 框架搭建 → 測試驗證
```
**適用於：** Epic 1 - 基礎設施建立

#### 軌道 B: 業務功能開發流程（BDD 驅動）
```
BDD 場景 → Epic 規劃 → SM 產生 Story → Story 驅動 Task 開發
```
**適用於：** Epic 2, 3 - 業務功能開發

### 從需求到實作的完整流程

#### 階段 1: 需求整理與 Epic 規劃
```
完整業務需求 (PRD) → 識別業務場景 → 撰寫 BDD 規格 → 規劃 Epic
```

#### 階段 2: Epic 分解與 Story 產生
```
Epic 定義 → Scrum Master 分析 → 產生 Story Backlog → Story 優先順序
```

#### 階段 3: Story 實作（僅限業務功能 Epic）
```
Story 開始 → 參考 story-driven-development-workflow.md → 產生 Task → 開發實作
```

### BDD 驅動流程細節（僅業務功能）

**核心原則：** BDD 文件 = 業務需求的單一事實來源

**流程：**
1. **Story 開始** → 讀取對應的 BDD 場景
2. **技術分析** → 基於場景推導 API 和資料需求  
3. **Just-in-Time 設計** → 建立當前 Story 所需的技術文件
4. **TDD 實作** → 先寫測試，再實作功能
5. **BDD 驗證** → 確保實作符合原始 BDD 場景

### BDD Scenario Structure

每個功能需求對應的 BDD 結構：
```gherkin
Feature: [功能名稱]
  As a [使用者角色]
  I want [期望行為]
  So that [業務價值]

Scenario: [具體場景]
  Given [前置條件]
  When [觸發動作]
  Then [預期結果]
  And [額外驗證]
```

## Testing Strategy

### BDD Testing Pyramid

```
       E2E BDD Tests (SpecFlow + Selenium)
      /                                    \
   Frontend BDD          Backend BDD
  (Cucumber + Angular)   (SpecFlow + xUnit)
 /                    \  /                    \
Frontend Unit Tests    Integration Tests    Backend Unit Tests
(Jasmine + Karma)     (API + Database)     (xUnit + EF Core)
```

### Test Coverage Requirements

- **BDD 場景覆蓋率**: 100% 的功能需求
- **單元測試覆蓋率**: 最低 80%
- **整合測試**: 所有 API 端點
- **E2E 測試**: 完整使用者旅程

## Next Steps

### Immediate Actions

1. ✅ 更新 PRD 反映 BDD 驅動架構
2. 📋 建立 BDD 場景文件
3. 🏗️ 架構師設計全端 CQRS 架構
4. 🧪 建立 BDD 測試基礎設施

### Development Sequence

1. **Epic 1**: BDD 場景撰寫和測試框架
2. **Epic 2**: 後端 API 和 CQRS 實作
3. **Epic 3**: 前端 Angular 應用開發
4. **Epic 4**: 整合測試和系統優化

### Success Criteria

- 所有功能都有對應的 BDD 場景
- BDD 文件可以直接驅動開發
- 完整的測試自動化
- 展示企業級開發流程最佳實踐