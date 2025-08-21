# Story [編號]: [業務功能標題]

## Story 類型
業務功能 Story (Epic 2+) - BDD 驅動

## ⚡ 第一步：撰寫 BDD 場景 (必須完成才能繼續)

### 功能需求對應
對應 PRD 功能需求: [FR編號]

### BDD 場景
```gherkin
Feature: [功能名稱]
  As a [使用者角色]
  I want to [期望行為]
  So that [業務價值]

Background:
  Given [共同前置條件]

Scenario: [主要成功場景]
  Given [前置條件]
  When [使用者操作]
  Then [預期結果]
  And [額外驗證]

Scenario: [邊界條件或錯誤場景]
  Given [錯誤前置條件]
  When [錯誤操作]
  Then [錯誤處理結果]
```

### BDD 場景品質檢查
- [ ] 場景涵蓋主要使用情境
- [ ] 場景包含邊界條件和錯誤情況  
- [ ] 場景具體且可測試
- [ ] 場景與功能需求一致

## 第二步：技術需求推導 (基於 BDD 場景)

### 前端需求
- UI 元件: [從場景推導]
- 狀態管理: [從場景推導]
- 事件處理: [從場景推導]
- API 整合: [從場景推導]

### 後端需求  
- API 端點: [從場景推導]
- CQRS Command/Query: [從場景推導]
- 驗證規則: [從場景推導]
- 資料模型: [從場景推導]

### Just-in-Time API 契約 (只定義當前 Story 所需)
```markdown
## [HTTP 方法] [API 端點] (來自場景：[場景步驟])
**請求:**
```json
{
  // 基於場景輸入定義
}
```

**回應:**  
```json
{
  // 基於場景期望結果定義
}
```

**錯誤回應 (如有):**
```json
{
  "error": "ErrorType", 
  "message": "場景期望的錯誤訊息"
}
```
```

## 第三步：BDD 測試實作

### 測試檔案
- [ ] Frontend BDD: `tests/frontend-bdd/features/[story-name].feature`
- [ ] Backend BDD: `tests/backend-bdd/Features/[StoryName].feature`
- [ ] E2E BDD: `tests/e2e-bdd/Features/[StoryName].feature`

### 測試實作檢查
- [ ] Frontend BDD 步驟定義已實作
- [ ] Backend BDD 步驟定義已實作
- [ ] E2E BDD 步驟定義已實作
- [ ] 所有測試初次執行失敗 (Red Phase)

## 第四步：程式碼實作 (TDD)

### 後端實作順序
- [ ] CQRS Command/Query
- [ ] Command/Query Handler
- [ ] API 控制器端點
- [ ] 資料模型和 Repository

### 前端實作順序
- [ ] UI 元件
- [ ] 狀態管理服務
- [ ] API 整合服務
- [ ] 事件處理邏輯

### TDD 循環檢查
- [ ] Red: 測試失敗確認
- [ ] Green: 最小實作讓測試通過
- [ ] Refactor: 重構但保持測試通過

## BDD 驗收條件
- [ ] 所有前端 BDD 測試通過
- [ ] 所有後端 BDD 測試通過  
- [ ] E2E BDD 測試通過
- [ ] 手動驗證每個 BDD 場景
- [ ] 邊界條件和錯誤情況測試通過

## 技術品質檢查
- [ ] 程式碼符合專案規範
- [ ] 無明顯技術債務
- [ ] API 文件已更新 (如有新 API)
- [ ] 測試覆蓋率符合要求

## 準備下一個 Story
- [ ] 當前 Story 的學習和經驗記錄
- [ ] 識別可以重用的元件或模式
- [ ] 更新共用的架構文件 (如有需要)

---
**範本版本**: 1.0  
**適用於**: Epic 2+ 業務功能任務  
**驅動模式**: BDD 驅動  
**關鍵要求**: 第一步必須撰寫 BDD 場景！