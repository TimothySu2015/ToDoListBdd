# language: en
Feature: 批量清除已完成任務功能
  As a 生產力使用者
  I want to 一次性清除所有已完成的任務
  So that 我可以保持任務列表的整潔並專注於未完成的工作

  Background:
    Given 我在待辦事項應用程式中
    And 我有以下任務：
      | 任務描述        | 狀態  |
      | 開發功能        | 待辦  |
      | 測試功能        | 已完成 |
      | 撰寫文件        | 已完成 |
      | 部署系統        | 已完成 |

  Scenario: 成功清除已完成任務
    Given 我在任務列表頁面
    When 我點擊「清除已完成」按鈕
    Then 我應該看到確認對話框
    And 對話框應該顯示標題「確認清除」
    And 對話框應該顯示「將清除 3 個已完成任務，此操作可在 5 秒內撤銷」
    When 我點擊確認對話框的「清除」按鈕
    Then 確認對話框應該關閉
    And 我應該看到載入指示器
    And 我應該看到 1 個任務
    And 我應該看到任務「開發功能」
    And 我不應該看到任務「測試功能」
    And 我不應該看到任務「撰寫文件」
    And 我不應該看到任務「部署系統」
    And 我應該看到 Undo 通知「已清除 3 個任務」

  Scenario: 清除按鈕狀態根據已完成任務存在性變化
    Given 我只有待辦任務
    Then 「清除已完成」按鈕應該被禁用
    And 「清除已完成」按鈕應該顯示禁用樣式
    When 我標記「開發功能」任務為已完成
    Then 「清除已完成」按鈕應該可點擊
    And 「清除已完成」按鈕應該顯示啟用樣式

  Scenario: 取消清除操作
    Given 我有 3 個已完成任務
    When 我點擊「清除已完成」按鈕
    And 我在確認對話框中點擊「取消」按鈕
    Then 確認對話框應該關閉
    And 我應該仍然看到 4 個任務
    And 我應該仍然看到 3 個已完成任務
    And 任務列表應該保持不變

  Scenario: Undo 功能成功撤銷清除
    Given 我有 3 個已完成任務
    When 我清除所有已完成任務
    Then 我應該看到 Undo 通知「已清除 3 個任務」
    And Undo 通知應該包含「撤銷」按鈕
    And Undo 通知應該顯示倒數計時
    When 我在 5 秒內點擊「撤銷」按鈕
    Then Undo 通知應該消失
    And 所有已完成任務應該恢復
    And 我應該看到 4 個任務
    And 我應該看到 3 個已完成任務

  Scenario: Undo 通知自動消失
    Given 我清除了一些已完成任務
    And 我看到 Undo 通知
    When 我等待 5 秒
    Then Undo 通知應該自動消失
    And 撤銷選項應該不再可用
    And 任務應該保持已清除狀態

  Scenario: 鍵盤導航支援
    Given 我有已完成任務
    When 我使用 Tab 鍵導航到「清除已完成」按鈕
    And 按鈕應該獲得焦點樣式
    And 我按下 Enter 鍵
    Then 應該開啟確認對話框
    When 我使用 Tab 鍵在對話框中導航
    And 我按下 Space 鍵確認
    Then 應該執行清除操作

  Scenario: ESC 鍵關閉確認對話框
    Given 我點擊了「清除已完成」按鈕
    And 確認對話框已開啟
    When 我按下 ESC 鍵
    Then 確認對話框應該關閉
    And 任務列表應該保持不變

  Scenario: 載入狀態防止重複操作
    Given 我有已完成任務
    When 我點擊「清除已完成」按鈕
    And 我確認清除操作
    Then 我應該看到載入指示器
    And 「清除已完成」按鈕應該被禁用
    And 載入指示器應該顯示旋轉動畫
    When 清除操作完成
    Then 載入指示器應該消失
    And 按鈕狀態應該根據剩餘任務更新

  Scenario: 清除操作失敗處理
    Given 我有已完成任務
    And 後端 API 將返回錯誤
    When 我嘗試清除已完成任務
    Then 我應該看到錯誤訊息「清除失敗，請稍後再試」
    And 任務列表應該保持原始狀態
    And 「清除已完成」按鈕應該重新啟用
    And 不應該顯示 Undo 通知

  Scenario: 網路錯誤時的錯誤處理
    Given 我有已完成任務
    And 網路連線中斷
    When 我嘗試清除已完成任務
    Then 我應該看到錯誤訊息「網路連線失敗，請檢查您的網路連線」
    And 任務列表應該保持原始狀態

  Scenario: 確認對話框顯示正確的任務計數
    Given 我有 1 個已完成任務
    When 我點擊「清除已完成」按鈕
    Then 對話框應該顯示「將清除 1 個已完成任務」
    
    Given 我有 5 個已完成任務
    When 我點擊「清除已完成」按鈕
    Then 對話框應該顯示「將清除 5 個已完成任務」

  Scenario: 任務計數器更新
    Given 我有 4 個任務（1 個待辦，3 個已完成）
    And 任務計數器顯示「4 個任務」
    When 我清除所有已完成任務
    Then 任務計數器應該更新為「1 個任務」

  Scenario: 在不同檢視模式下的清除功能
    Given 我有已完成任務
    And 我在「全部」檢視模式
    When 我清除已完成任務
    Then 清除操作應該成功
    
    Given 我切換到「已完成」檢視模式
    And 我有已完成任務
    When 我清除已完成任務
    Then 清除操作應該成功
    And 「已完成」檢視應該顯示空狀態

  Scenario: 搜尋狀態下的清除功能
    Given 我正在搜尋「測試」
    And 搜尋結果包含已完成任務
    When 我清除已完成任務
    Then 清除操作應該影響所有已完成任務（不只是搜尋結果）
    And 搜尋結果應該更新以反映清除後的狀態

  Scenario: 快速連續操作防護
    Given 我有已完成任務
    When 我快速連續點擊「清除已完成」按鈕
    Then 只有第一次點擊應該生效
    And 後續點擊應該被忽略
    And 確認對話框應該只顯示一次

  Scenario: 無障礙功能支援
    Given 我使用螢幕閱讀器
    And 我有已完成任務
    When 我導航到「清除已完成」按鈕
    Then 按鈕應該有正確的 aria-label
    And 按鈕狀態變化應該通知螢幕閱讀器
    When 我激活按鈕
    Then 確認對話框應該正確設定焦點
    And 對話框應該有適當的 aria 屬性