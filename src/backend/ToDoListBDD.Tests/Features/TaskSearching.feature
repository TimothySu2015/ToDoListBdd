Feature: 任務搜尋
  As a 生產力使用者
  I want to 搜尋我的任務
  So that 我可以快速找到特定的任務

  Background:
    Given 系統中有以下任務：
      | 描述                    | 狀態  |
      | 開發搜尋功能            | 待辦  |
      | 測試搜尋功能            | 待辦  |
      | 撰寫搜尋文件            | 已完成 |
      | 開發其他功能            | 待辦  |
      | 優化系統效能            | 已完成 |
      | 修復登入Bug            | 待辦  |

  Scenario: 基本關鍵字搜尋
    When 我搜尋 "搜尋"
    Then 回應應該包含 3 個任務
    And 回應應該包含任務 "開發搜尋功能"
    And 回應應該包含任務 "測試搜尋功能"
    And 回應應該包含任務 "撰寫搜尋文件"
    And 回應不應該包含任務 "開發其他功能"
    And 回應不應該包含任務 "優化系統效能"
    And 回應不應該包含任務 "修復登入Bug"

  Scenario: 搜尋不區分大小寫
    When 我搜尋 "開發"
    Then 回應應該包含 2 個任務
    And 回應應該包含任務 "開發搜尋功能"
    And 回應應該包含任務 "開發其他功能"
    When 我搜尋 "開發"
    Then 回應應該包含 2 個任務
    And 回應應該包含任務 "開發搜尋功能"
    And 回應應該包含任務 "開發其他功能"

  Scenario: 部分匹配搜尋
    When 我搜尋 "功能"
    Then 回應應該包含 3 個任務
    And 回應應該包含任務 "開發搜尋功能"
    And 回應應該包含任務 "測試搜尋功能"
    And 回應應該包含任務 "開發其他功能"
    When 我搜尋 "Bug"
    Then 回應應該包含 1 個任務
    And 回應應該包含任務 "修復登入Bug"

  Scenario: 搜尋結合狀態篩選 - 待辦任務
    When 我搜尋 "開發" 並篩選狀態為 "todo"
    Then 回應應該包含 2 個任務
    And 回應應該包含任務 "開發搜尋功能"
    And 回應應該包含任務 "開發其他功能"
    And 回應不應該包含任務 "撰寫搜尋文件"

  Scenario: 搜尋結合狀態篩選 - 已完成任務
    When 我搜尋 "搜尋" 並篩選狀態為 "completed"
    Then 回應應該包含 1 個任務
    And 回應應該包含任務 "撰寫搜尋文件"
    And 回應不應該包含任務 "開發搜尋功能"
    And 回應不應該包含任務 "測試搜尋功能"

  Scenario: 搜尋結合狀態篩選 - 全部任務
    When 我搜尋 "搜尋" 並篩選狀態為 "all"
    Then 回應應該包含 3 個任務
    And 回應應該包含任務 "開發搜尋功能"
    And 回應應該包含任務 "測試搜尋功能"
    And 回應應該包含任務 "撰寫搜尋文件"

  Scenario: 空搜尋關鍵字
    When 我搜尋 ""
    Then 回應應該包含 6 個任務
    And 回應應該包含所有任務

  Scenario: 搜尋無結果
    When 我搜尋 "不存在的任務"
    Then 回應應該包含 0 個任務
    And 回應應該是空的任務列表

  Scenario: 搜尋特殊字符
    Given 系統中有任務 "Fix bug #123"
    When 我搜尋 "#123"
    Then 回應應該包含 1 個任務
    And 回應應該包含任務 "Fix bug #123"

  Scenario: 搜尋效能要求
    Given 系統中有 100 個任務
    When 我搜尋 "測試"
    Then API 回應時間應該少於 300 毫秒
    And 回應應該包含匹配的任務

  Scenario: 空白字符處理
    When 我搜尋 "  搜尋  "
    Then 回應應該包含 3 個任務
    And 搜尋應該忽略前後空白字符
    When 我搜尋 "搜 尋"
    Then 回應應該包含 0 個任務

  Scenario: API 端點參數組合
    When 我請求 "/api/tasks?search=開發&status=todo"
    Then 回應應該包含 2 個任務
    And 回應應該包含任務 "開發搜尋功能"
    And 回應應該包含任務 "開發其他功能"
    When 我請求 "/api/tasks?search=效能"
    Then 回應應該包含 1 個任務
    And 回應應該包含任務 "優化系統效能"