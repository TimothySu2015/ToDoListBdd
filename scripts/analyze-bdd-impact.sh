#!/bin/bash
# scripts/analyze-bdd-impact.sh
# BDD 場景影響分析工具

KEYWORD=$1

if [ -z "$KEYWORD" ]; then
    echo "用法: ./scripts/analyze-bdd-impact.sh \"關鍵字\""
    echo "範例: ./scripts/analyze-bdd-impact.sh \"優先順序\""
    exit 1
fi

echo "======================================"
echo "    BDD 影響分析工具"
echo "======================================"
echo ""
echo "🔍 分析關鍵字: $KEYWORD"
echo ""

# 檢查 BDD 規格文件是否存在
if [ ! -f "docs/bdd-specifications.md" ]; then
    echo "❌ 找不到 docs/bdd-specifications.md 檔案"
    echo "請確認您在專案根目錄執行此腳本"
    exit 1
fi

echo "📋 搜尋現有 BDD 場景..."
echo "----------------------------------------"

# 搜尋現有 BDD 場景（不區分大小寫）
FOUND_SCENARIOS=$(grep -in "$KEYWORD" docs/bdd-specifications.md)

if [ -n "$FOUND_SCENARIOS" ]; then
    echo "✅ 找到相關的現有場景："
    echo "$FOUND_SCENARIOS" | while IFS= read -r line; do
        echo "   📌 $line"
    done
else
    echo "ℹ️  無找到包含 '$KEYWORD' 的現有場景"
fi

echo ""
echo "📊 Epic 影響分析..."
echo "----------------------------------------"

# 根據關鍵字推測可能受影響的 Epic
if echo "$KEYWORD" | grep -qi "任務\|task\|todo"; then
    echo "🎯 可能受影響的 Epic:"
    echo "   • Epic 2: 核心任務管理 (高影響)"
    echo "   • Epic 3: 進階功能 (中影響)"
elif echo "$KEYWORD" | grep -qi "搜尋\|篩選\|排序\|search\|filter\|sort"; then
    echo "🎯 可能受影響的 Epic:"
    echo "   • Epic 3: 進階功能 (高影響)"
    echo "   • Epic 2: 核心任務管理 (中影響)"
elif echo "$KEYWORD" | grep -qi "測試\|test\|品質\|quality"; then
    echo "🎯 可能受影響的 Epic:"
    echo "   • Epic 4: 系統優化與部署 (高影響)"
else
    echo "🎯 可能受影響的 Epic:"
    echo "   • Epic 2: 核心任務管理 (如果與基本任務功能相關)"
    echo "   • Epic 3: 進階功能 (如果是新增功能)"
    echo "   • Epic 4: 系統優化與部署 (如果與系統層面相關)"
fi

echo ""
echo "📝 Story 建議..."
echo "----------------------------------------"

# 生成現有 Story 數量（簡單計算）
EXISTING_STORIES=$(grep -c "### Story" docs/ -R 2>/dev/null || echo "0")
NEXT_STORY_NUM=$((EXISTING_STORIES + 1))

echo "💡 建議新增的 Story:"

# 根據關鍵字生成 Story 建議
if echo "$KEYWORD" | grep -qi "優先順序\|priority"; then
    echo "   📋 Story 2.5: 設定任務優先順序"
    echo "      - 描述: 作為用戶，我想要為任務設定優先順序，以便重要任務優先處理"
    echo "      - 複雜度: 中等"
    echo ""
    echo "   📋 Story 2.6: 按優先順序排序任務"
    echo "      - 描述: 作為用戶，我想要按優先順序查看任務，以便專注於重要工作"
    echo "      - 複雜度: 簡單"
elif echo "$KEYWORD" | grep -qi "分類\|標籤\|tag\|category"; then
    echo "   📋 Story 3.1: 任務分類管理"
    echo "      - 描述: 作為用戶，我想要為任務設定分類，以便組織和管理任務"
    echo "      - 複雜度: 中等"
elif echo "$KEYWORD" | grep -qi "提醒\|通知\|reminder\|notification"; then
    echo "   📋 Story 3.2: 任務提醒功能"
    echo "      - 描述: 作為用戶，我想要設定任務提醒，以便不會錯過重要任務"
    echo "      - 複雜度: 複雜"
else
    echo "   📋 Story $NEXT_STORY_NUM.1: $KEYWORD 相關功能"
    echo "      - 描述: 作為用戶，我想要 [$KEYWORD 相關功能]，以便 [請填入價值描述]"
    echo "      - 複雜度: [請評估：簡單/中等/複雜]"
fi

echo ""
echo "🔧 技術影響預估..."
echo "----------------------------------------"

# 技術影響分析
if echo "$KEYWORD" | grep -qi "優先順序\|priority"; then
    echo "🔌 API 影響:"
    echo "   • 新增: PUT /api/tasks/{id}/priority"
    echo "   • 修改: POST /api/tasks (增加 priority 欄位)"
    echo "   • 修改: GET /api/tasks (增加排序參數)"
    echo ""
    echo "💾 資料模型影響:"
    echo "   • Task 實體: 新增 Priority 屬性 (enum: High, Medium, Low)"
    echo "   • 資料庫: 需要 migration script"
    echo ""
    echo "🎨 前端影響:"
    echo "   • 新增: PrioritySelector 元件"
    echo "   • 修改: TaskItem 元件 (顯示優先順序)"
    echo "   • 修改: TaskList 元件 (排序功能)"
elif echo "$KEYWORD" | grep -qi "搜尋\|search"; then
    echo "🔌 API 影響:"
    echo "   • 新增: GET /api/tasks/search?q={keyword}"
    echo "   • 可能需要: SearchTasksQuery"
    echo ""
    echo "💾 資料模型影響:"
    echo "   • 可能需要: 搜尋索引優化"
    echo ""
    echo "🎨 前端影響:"
    echo "   • 新增: SearchBox 元件"
    echo "   • 修改: TaskList 元件 (搜尋結果顯示)"
else
    echo "🔌 API 影響:"
    echo "   • 需要分析: 可能的新端點"
    echo "   • 需要分析: 現有端點的修改"
    echo ""
    echo "💾 資料模型影響:"
    echo "   • 需要分析: 實體變更"
    echo "   • 需要分析: 資料庫遷移"
    echo ""
    echo "🎨 前端影響:"
    echo "   • 需要分析: UI 元件變更"
    echo "   • 需要分析: 狀態管理調整"
fi

echo ""
echo "📋 建議的下一步行動..."
echo "----------------------------------------"
echo "1. [ ] 完善 BDD 場景內容"
echo "2. [ ] 將新場景加入 docs/bdd-specifications.md"
echo "3. [ ] 建立對應的 Story"
echo "4. [ ] 開始 Story 開發 (參考 story-driven-development-workflow.md)"
echo "5. [ ] 實作並測試功能"
echo "6. [ ] 執行變更記錄: ./scripts/log-change.sh"

echo ""
echo "🔗 相關命令："
echo "   編輯 BDD 檔案: code docs/bdd-specifications.md"
echo "   查看 Story 流程: code docs/story-driven-development-workflow.md"
echo "   記錄變更: ./scripts/log-change.sh"

echo ""
echo "======================================"
echo "    BDD 影響分析完成"
echo "======================================"