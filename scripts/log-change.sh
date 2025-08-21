#!/bin/bash
# scripts/log-change.sh
# 變更記錄工具

echo "======================================"
echo "    變更記錄工具"
echo "======================================"
echo ""

# 建立變更記錄目錄
mkdir -p docs/change-logs

# 生成檔案名稱
DATE=$(date +%Y-%m-%d)
TIME=$(date +%H%M)
LOG_FILE="docs/change-logs/change-$DATE-$TIME.md"

echo "📝 建立變更記錄檔案..."
echo "📁 檔案位置: $LOG_FILE"
echo ""

# 建立變更記錄範本
cat > "$LOG_FILE" << EOF
# 變更記錄 - $DATE

## 基本資訊
- **變更日期**: $(date +%Y-%m-%d)
- **記錄時間**: $(date +%H:%M:%S)
- **記錄人**: [請填入姓名]

## 變更內容
[請詳細描述原始需求變更內容]

### 範例：
用戶希望可以為每個任務設定優先順序（高、中、低），並且可以按優先順序排序任務列表。

## 新增的 BDD 場景
- [ ] Scenario X: [場景名稱] - [簡短描述]
- [ ] Scenario Y: [場景名稱] - [簡短描述]

### 場景位置
- 檔案: docs/bdd-specifications.md
- 位置: [行號或章節]

## 新增/調整的 Story
- [ ] Story X.X: [Story 名稱] - [狀態: 計劃中/進行中/已完成]
- [ ] Story Y.Y: [Story 名稱] - [狀態: 計劃中/進行中/已完成]

### Story 詳情
| Story | 描述 | 複雜度 | 預估時間 | 實際時間 | 狀態 |
|-------|------|--------|----------|----------|------|
| Story X.X | [Story 描述] | [簡單/中等/複雜] | [X 天] | [Y 天] | [進行中] |

## 技術實作內容

### API 變更
- [ ] 新增端點: [端點路徑] - [描述]
- [ ] 修改端點: [端點路徑] - [變更內容]

### 資料模型變更
- [ ] 新增實體: [實體名稱] - [描述]
- [ ] 修改實體: [實體名稱] - [變更內容]
- [ ] 資料庫遷移: [migration 檔案] - [是否完成]

### 前端變更
- [ ] 新增元件: [元件名稱] - [描述]
- [ ] 修改元件: [元件名稱] - [變更內容]
- [ ] 狀態管理: [Service/Store 變更] - [描述]

## 測試驗證

### BDD 測試
- [ ] 前端 BDD 測試: [測試檔案] - [通過/失敗]
- [ ] 後端 BDD 測試: [測試檔案] - [通過/失敗]
- [ ] E2E BDD 測試: [測試檔案] - [通過/失敗]

### 功能驗證
- [ ] 新功能運作正常
- [ ] 現有功能未受影響
- [ ] 用戶介面符合設計
- [ ] 效能符合要求

### 用戶驗收
- [ ] 功能演示完成
- [ ] 用戶回饋收集
- [ ] 問題修正完成
- [ ] 最終驗收通過

## 完成狀態
- **開始日期**: [YYYY-MM-DD]
- **完成日期**: [YYYY-MM-DD]
- **總耗時**: [X 天]
- **整體狀態**: [計劃中/進行中/已完成/暫停]

## 經驗學習

### 順利的地方
- [記錄進行順利的部分]
- [有效的工具或方法]

### 遇到的挑戰
- [記錄遇到的困難]
- [解決方案]

### 改進建議
- [流程改進建議]
- [工具改進建議]

## 相關資料
- **相關 Issue**: [GitHub Issue 連結]
- **相關 PR**: [Pull Request 連結]
- **相關文件**: [其他相關文件連結]
- **BDD 場景位置**: docs/bdd-specifications.md
- **Story 流程參考**: docs/story-driven-development-workflow.md

---
*此記錄由 log-change.sh 工具自動生成於 $(date)*
EOF

echo "✅ 變更記錄檔案已建立"
echo ""
echo "📋 請完成以下步驟："
echo "   1. 編輯檔案: $LOG_FILE"
echo "   2. 填入具體的變更內容"
echo "   3. 更新進度狀態"
echo "   4. 完成後保存檔案"
echo ""

# 詢問是否立即開啟檔案編輯
read -p "是否要立即開啟檔案進行編輯？(y/N): " OPEN_FILE

if [[ $OPEN_FILE =~ ^[Yy]$ ]]; then
    if command -v code >/dev/null 2>&1; then
        echo "🚀 使用 VS Code 開啟檔案..."
        code "$LOG_FILE"
    elif command -v notepad >/dev/null 2>&1; then
        echo "🚀 使用記事本開啟檔案..."
        notepad "$LOG_FILE"
    else
        echo "📝 請手動開啟檔案: $LOG_FILE"
    fi
fi

echo ""
echo "📊 變更記錄統計："

# 統計變更記錄數量
TOTAL_LOGS=$(find docs/change-logs -name "change-*.md" 2>/dev/null | wc -l)
echo "   📁 總變更記錄數: $TOTAL_LOGS"

# 顯示最近的變更記錄
if [ $TOTAL_LOGS -gt 1 ]; then
    echo "   📅 最近的變更記錄:"
    find docs/change-logs -name "change-*.md" -type f -exec basename {} \; | sort -r | head -3 | while read -r file; do
        echo "      • $file"
    done
fi

echo ""
echo "🔗 相關命令："
echo "   查看所有變更記錄: ls docs/change-logs/"
echo "   查看 BDD 規格: code docs/bdd-specifications.md"
echo "   開始需求分析: ./scripts/requirement-to-bdd.sh"
echo "   影響分析: ./scripts/analyze-bdd-impact.sh \"關鍵字\""

echo ""
echo "======================================"
echo "    變更記錄建立完成"
echo "======================================"