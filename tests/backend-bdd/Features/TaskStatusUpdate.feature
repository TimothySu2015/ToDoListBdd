Feature: 任務狀態更新
    作為系統用戶
    我想要更新任務的完成狀態
    以便追蹤任務進度

Background:
    Given 資料庫中有以下任務:
        | Id | Description | IsCompleted | CreatedAt           | UpdatedAt           |
        | 1  | 完成專案報告     | false       | 2025-08-21 10:00:00 | 2025-08-21 10:00:00 |
        | 2  | 測試功能       | true        | 2025-08-21 11:00:00 | 2025-08-21 11:30:00 |

Scenario: 將待辦任務標記為已完成
    When 我發送 PATCH 請求到 "/api/tasks/1/status" 包含:
        """
        {
            "isCompleted": true
        }
        """
    Then 回應狀態碼應該是 200
    And 回應內容應該包含:
        """
        {
            "id": 1,
            "description": "完成專案報告",
            "isCompleted": true
        }
        """
    And 資料庫中任務 1 的 IsCompleted 應該是 true
    And 資料庫中任務 1 的 UpdatedAt 應該被更新

Scenario: 將已完成任務標記為待辦
    When 我發送 PATCH 請求到 "/api/tasks/2/status" 包含:
        """
        {
            "isCompleted": false
        }
        """
    Then 回應狀態碼應該是 200
    And 回應內容應該包含:
        """
        {
            "id": 2,
            "description": "測試功能",
            "isCompleted": false
        }
        """
    And 資料庫中任務 2 的 IsCompleted 應該是 false
    And 資料庫中任務 2 的 UpdatedAt 應該被更新

Scenario: 嘗試更新不存在的任務狀態
    When 我發送 PATCH 請求到 "/api/tasks/999/status" 包含:
        """
        {
            "isCompleted": true
        }
        """
    Then 回應狀態碼應該是 404
    And 回應內容應該包含錯誤訊息 "找不到 ID 為 999 的任務"

Scenario: 發送無效的狀態更新請求
    When 我發送 PATCH 請求到 "/api/tasks/0/status" 包含:
        """
        {
            "isCompleted": true
        }
        """
    Then 回應狀態碼應該是 400
    And 回應內容應該包含驗證錯誤訊息