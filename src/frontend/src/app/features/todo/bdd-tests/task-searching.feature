Feature: 任務搜尋 UI
  As a 生產力使用者
  I want to 使用搜尋功能快速找到任務
  So that 我可以提高工作效率

  Background:
    Given 我在應用程式的主頁面
    And 系統中有以下任務：
      | 任務描述            | 狀態  |
      | 開發搜尋功能        | 待辦  |
      | 測試搜尋功能        | 待辦  |
      | 撰寫搜尋文件        | 已完成 |
      | 開發其他功能        | 待辦  |
      | 優化系統效能        | 已完成 |

  Scenario: 搜尋框顯示和基本功能
    Then 搜尋輸入框應該在任務列表上方顯示
    And 搜尋框應該有搜尋圖示
    And 搜尋框應該有 placeholder 文字 "搜尋任務..."
    And 搜尋框應該可以輸入文字

  Scenario: 即時搜尋功能
    When 我在搜尋框輸入 "搜尋"
    Then 任務列表應該即時更新
    And 我應該看到 3 個任務
    And 我應該看到任務 "開發搜尋功能"
    And 我應該看到任務 "測試搜尋功能"
    And 我應該看到任務 "撰寫搜尋文件"
    And 我不應該看到任務 "開發其他功能"
    And 我不應該看到任務 "優化系統效能"

  Scenario: 搜尋結果高亮顯示
    When 我在搜尋框輸入 "搜尋"
    Then 匹配的文字 "搜尋" 應該被高亮顯示
    And 高亮顯示應該使用黃色背景
    And 高亮顯示應該在所有匹配的任務中出現

  Scenario: 搜尋不區分大小寫
    When 我在搜尋框輸入 "開發"
    Then 我應該看到 2 個任務
    And 我應該看到任務 "開發搜尋功能"
    And 我應該看到任務 "開發其他功能"
    When 我清空搜尋框並輸入 "開發"
    Then 我應該看到 2 個任務
    And 我應該看到任務 "開發搜尋功能"
    And 我應該看到任務 "開發其他功能"

  Scenario: 清空搜尋框恢復原始列表
    Given 我在搜尋框輸入 "搜尋"
    And 搜尋結果顯示 3 個任務
    When 我清空搜尋框
    Then 我應該看到所有 5 個任務
    And 任務列表應該恢復到原始狀態

  Scenario: 搜尋結合檢視切換
    Given 我在 "待辦" 檢視
    When 我在搜尋框輸入 "開發"
    Then 我應該看到 2 個任務
    And 我應該看到任務 "開發搜尋功能"
    And 我應該看到任務 "開發其他功能"
    And 我不應該看到任務 "撰寫搜尋文件"
    When 我切換到 "已完成" 檢視
    Then 搜尋框內容應該保持 "開發"
    And 我應該看到 0 個任務
    And 應該顯示無結果提示

  Scenario: 搜尋無結果提示
    When 我在搜尋框輸入 "不存在的任務"
    Then 我應該看到 "找不到匹配的任務" 提示
    And 我不應該看到任何任務
    And 提示應該包含建議文字

  Scenario: 搜尋框清除按鈕
    When 我在搜尋框輸入 "測試"
    Then 搜尋框右側應該顯示清除按鈕 "×"
    When 我點擊清除按鈕
    Then 搜尋框應該被清空
    And 任務列表應該恢復到原始狀態
    And 清除按鈕應該消失

  Scenario: 鍵盤快捷鍵 Ctrl+F
    When 我按下 Ctrl+F
    Then 搜尋框應該獲得焦點
    And 搜尋框應該有視覺焦點指示

  Scenario: 搜尋防抖動機制
    When 我快速輸入 "test"
    Then 搜尋應該在 300ms 後執行
    And 不應該發送多個 API 請求
    And 載入狀態應該正確顯示

  Scenario: 搜尋載入狀態
    When 我在搜尋框輸入 "搜尋"
    Then 應該顯示搜尋載入狀態
    And 搜尋框應該顯示載入指示器
    When 搜尋完成後
    Then 載入狀態應該消失
    And 搜尋結果應該顯示

  Scenario: ESC 鍵清除搜尋
    Given 我在搜尋框輸入 "測試"
    When 我按下 ESC 鍵
    Then 搜尋框應該被清空
    And 任務列表應該恢復到原始狀態

  Scenario: 搜尋狀態在頁面重新載入後清空
    Given 我在搜尋框輸入 "測試"
    And 搜尋結果顯示 1 個任務
    When 我重新載入頁面
    Then 搜尋框應該是空的
    And 應該顯示所有任務
    And 檢視狀態應該保持原始設定

  Scenario: 搜尋與任務操作的整合
    Given 我在搜尋框輸入 "開發"
    And 我看到 2 個匹配的任務
    When 我標記任務 "開發搜尋功能" 為已完成
    Then 該任務應該從待辦搜尋結果中移除
    And 搜尋結果應該更新為 1 個任務
    And 搜尋框內容應該保持 "開發"

  Scenario: 搜尋效能和回應性
    Given 系統中有 100 個任務
    When 我在搜尋框輸入關鍵字
    Then 搜尋結果應該在 300ms 內顯示
    And UI 應該保持回應性
    And 不應該阻塞用戶介面

  Scenario: 無障礙功能支援
    Then 搜尋框應該有適當的 aria-label
    And 搜尋結果應該有 aria-live 區域
    And 清除按鈕應該有 aria-label
    And 搜尋框應該支援螢幕閱讀器
    And 搜尋狀態變化應該被宣告

  Scenario: 行動裝置搜尋體驗
    Given 我在行動裝置上
    When 我點擊搜尋框
    Then 虛擬鍵盤應該出現
    And 搜尋框應該正確縮放
    And 觸控操作應該正常運作
    And 清除按鈕應該容易點擊