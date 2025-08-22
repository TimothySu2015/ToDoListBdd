# language: en
Feature: 批量清除已完成任務 API
  As a 生產力使用者
  I want to 透過 API 批量清除已完成任務
  So that 我可以保持任務列表整潔並專注於未完成的工作

  Background:
    Given 資料庫已初始化
    And 我有以下任務資料：
      | 任務描述        | 狀態  | 建立時間            |
      | 開發功能        | 待辦  | 2025-08-21 10:00:00 |
      | 測試功能        | 已完成 | 2025-08-21 10:05:00 |
      | 撰寫文件        | 已完成 | 2025-08-21 10:10:00 |
      | 部署系統        | 已完成 | 2025-08-21 10:15:00 |

  Scenario: 成功清除已完成任務
    When 我發送 DELETE 請求到 "/api/tasks/completed"
    Then 回應狀態應該是 200
    And 回應應該包含 "deletedCount" 為 3
    And 回應應該包含 "message" 為 "已清除 3 個已完成任務"
    And 回應應該包含 "deletedTasks" 陣列有 3 個項目
    And 資料庫應該只剩下 1 個任務
    And 剩餘任務應該是 "開發功能" 且狀態為待辦

  Scenario: 沒有已完成任務時清除
    Given 所有任務都是待辦狀態
    When 我發送 DELETE 請求到 "/api/tasks/completed"
    Then 回應狀態應該是 200
    And 回應應該包含 "deletedCount" 為 0
    And 回應應該包含 "message" 為 "沒有已完成任務需要清除"
    And 資料庫任務數量應該保持不變

  Scenario: 清除操作的交易完整性
    Given 資料庫配置為在刪除操作時拋出異常
    When 我發送 DELETE 請求到 "/api/tasks/completed"
    Then 回應狀態應該是 500
    And 回應應該包含錯誤訊息 "清除操作失敗"
    And 資料庫中所有任務應該保持原狀
    And 已完成任務數量應該仍然是 3

  Scenario: 大量已完成任務清除效能
    Given 我有 100 個已完成任務
    And 我有 50 個待辦任務
    When 我發送 DELETE 請求到 "/api/tasks/completed"
    Then 回應應該在 2 秒內返回
    And 回應狀態應該是 200
    And 回應應該包含 "deletedCount" 為 100
    And 資料庫應該只剩下 50 個待辦任務

  Scenario: 清除操作返回已刪除任務詳情供 Undo 使用
    When 我發送 DELETE 請求到 "/api/tasks/completed"
    Then 回應應該包含 "deletedTasks" 陣列
    And "deletedTasks" 陣列中每個項目應該包含：
      | 欄位        | 類型   |
      | id         | 數字   |
      | description | 字串   |
      | isCompleted | 布林值 |
      | createdAt  | 日期   |
    And "deletedTasks" 中的任務應該都是已完成狀態

  Scenario: 並發清除操作處理
    Given 有兩個客戶端同時發送清除請求
    When 第一個客戶端發送 DELETE 請求到 "/api/tasks/completed"
    And 第二個客戶端同時發送 DELETE 請求到 "/api/tasks/completed"
    Then 只有一個請求應該成功清除任務
    And 成功的回應應該包含 "deletedCount" 為 3
    And 失敗的回應應該包含 "deletedCount" 為 0
    And 資料庫最終應該只剩下 1 個待辦任務

  Scenario: 清除操作的審計日誌
    When 我發送 DELETE 請求到 "/api/tasks/completed"
    Then 系統應該記錄清除操作日誌
    And 日誌應該包含操作時間戳
    And 日誌應該包含被清除的任務ID列表
    And 日誌應該包含清除的任務數量