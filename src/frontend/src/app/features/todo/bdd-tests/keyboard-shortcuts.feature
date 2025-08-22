Feature: 鍵盤快捷鍵支援
  As a 生產力使用者
  I want to 使用鍵盤快捷鍵操作應用程式
  So that 我可以提高操作效率

  Background:
    Given 我在任務頁面

  # AC 1, 2: 新增任務和搜尋快捷鍵
  Scenario: 新增任務快捷鍵 (Ctrl+N)
    When 我按下 Ctrl+N
    Then 任務輸入框應該獲得焦點
    And 游標應該在輸入框中

  Scenario: 搜尋任務快捷鍵 (Ctrl+F)  
    When 我按下 Ctrl+F
    Then 搜尋輸入框應該獲得焦點
    And 游標應該在搜尋框中

  # AC 3, 4, 5: 任務操作快捷鍵
  Scenario: 任務操作快捷鍵 - Space 切換完成狀態
    Given 我有任務 "測試任務"
    And 任務項目獲得焦點
    When 我按下 Space 鍵
    Then 任務應該切換完成狀態

  Scenario: 任務操作快捷鍵 - Enter 編輯任務
    Given 我有任務 "測試任務"  
    And 任務項目獲得焦點
    When 我按下 Enter 鍵
    Then 任務應該進入編輯模式

  Scenario: 任務操作快捷鍵 - Delete 刪除任務
    Given 我有任務 "測試任務"
    And 任務項目獲得焦點
    When 我按下 Delete 鍵
    Then 應該顯示刪除確認對話框

  # AC 6: Escape 取消操作
  Scenario: Escape 取消編輯模式
    Given 我有任務 "測試任務"
    And 我正在編輯任務
    When 我按下 Escape 鍵
    Then 應該取消編輯並恢復原始狀態

  Scenario: Escape 關閉對話框
    Given 我有開啟的對話框
    When 我按下 Escape 鍵
    Then 對話框應該關閉

  # AC 7: Tab 焦點導航
  Scenario: Tab 鍵焦點導航
    When 我按下 Tab 鍵
    Then 焦點應該移動到下一個可互動元素
    When 我按下 Shift+Tab
    Then 焦點應該移動到上一個可互動元素

  # AC 8: 數字鍵檢視切換
  Scenario: 檢視切換快捷鍵 (數字鍵 1)
    When 我按下數字鍵 "1"
    Then 應該切換到「待辦」檢視

  Scenario: 檢視切換快捷鍵 (數字鍵 2)  
    When 我按下數字鍵 "2"
    Then 應該切換到「已完成」檢視

  Scenario: 檢視切換快捷鍵 (數字鍵 3)
    When 我按下數字鍵 "3"
    Then 應該切換到「全部」檢視

  # AC 10: 清除已完成任務快捷鍵
  Scenario: 清除已完成任務快捷鍵 (Ctrl+D)
    Given 我有已完成任務
    When 我按下 Ctrl+D
    Then 應該顯示清除確認對話框

  # AC 11: 快捷鍵說明
  Scenario: 快捷鍵說明 (Ctrl+?)
    When 我按下 Ctrl+?
    Then 應該顯示快捷鍵說明對話框
    And 說明應該列出所有可用快捷鍵

  Scenario: 快捷鍵說明 (F1)
    When 我按下 F1
    Then 應該顯示快捷鍵說明對話框
    And 說明應該列出所有可用快捷鍵

  # AC 12: 快捷鍵衝突處理
  Scenario: 快捷鍵衝突處理 - 輸入框優先權
    Given 我在文字輸入框中
    When 我按下 Ctrl+A
    Then 應該全選文字內容
    And 不應該觸發應用程式的全選功能

  Scenario: 快捷鍵衝突處理 - 模態對話框中
    Given 我開啟快捷鍵說明對話框
    When 我按下 Ctrl+F
    Then 不應該觸發搜尋功能
    And 只有 Escape 和說明對話框內的快捷鍵應該有效

  Scenario: 快捷鍵衝突處理 - 編輯模式中
    Given 我正在編輯任務
    When 我按下 Ctrl+N  
    Then 不應該觸發新增任務功能
    And 只有 Enter、Escape 和編輯相關快捷鍵應該有效

  Scenario: 快捷鍵衝突處理 - 瀏覽器默認行為
    When 我按下 Ctrl+R
    Then 不應該攔截瀏覽器的重新整理功能
    And 頁面應該正常重新整理

  # 快捷鍵優先級和層疊測試
  Scenario: 快捷鍵優先級順序測試
    Given 我有多個對話框層疊開啟
    When 我按下 Escape
    Then 應該只關閉最上層的對話框
    And 下層對話框應該保持開啟狀態

  # AC 12: 瀏覽器相容性
  Scenario: 瀏覽器相容性
    Given 我使用支援的瀏覽器（Chrome 120+, Firefox 121+, Safari 17+, Edge 120+）
    When 我使用各種快捷鍵
    Then 所有快捷鍵應該一致運作
    And 不應該與瀏覽器默認行為衝突

  # 快捷鍵視覺提示
  Scenario: 快捷鍵視覺提示
    Given 我將滑鼠懸停在按鈕上
    Then 應該顯示對應的快捷鍵提示
    
  Scenario: 快捷鍵說明圖表
    Given 我開啟快捷鍵說明
    Then 應該看到清楚的快捷鍵圖表