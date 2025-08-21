#!/bin/bash
# scripts/requirement-to-bdd.sh
# 需求分析和 BDD 場景生成工具

echo "======================================"
echo "    需求變更處理工具"
echo "======================================"
echo ""

# 讀取需求內容
echo "請輸入需求變更內容（按 Ctrl+D 結束輸入）："
echo "範例：用戶希望可以為每個任務設定優先順序（高、中、低），並且可以按優先順序排序任務列表。"
echo ""
echo "請輸入："

# 讀取多行輸入
REQUIREMENT=""
while IFS= read -r line; do
    REQUIREMENT="$REQUIREMENT$line"$'\n'
done

# 移除最後的換行符號
REQUIREMENT=$(echo "$REQUIREMENT" | sed 's/[[:space:]]*$//')

echo ""
echo "收到的需求內容："
echo "----------------------------------------"
echo "$REQUIREMENT"
echo "----------------------------------------"
echo ""

# 簡單的關鍵字分析
if echo "$REQUIREMENT" | grep -qi "用戶\|功能\|操作\|介面\|顯示\|點擊\|輸入\|選擇"; then
    echo "✅ 檢測到業務功能變更，開始生成 BDD 場景..."
    
    # 生成時間戳
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    SCENARIO_FILE="temp-scenario-$TIMESTAMP.md"
    
    echo ""
    echo "🔄 正在生成 BDD 場景範本..."
    
    # 生成 BDD 場景範本
    cat > "$SCENARIO_FILE" << EOF
# 新增 BDD 場景 - $(date +%Y-%m-%d)

## 需求來源
$REQUIREMENT

## 生成的 BDD 場景

### Scenario X: [請填入場景名稱]

\`\`\`gherkin
Scenario: [請填入具體場景描述]
  Given [前置條件 - 例如：我在待辦清單主頁面]
  When [用戶操作 - 例如：我點擊某個按鈕]
  And [額外操作 - 例如：我輸入某些資料]
  Then [預期結果 - 例如：我應該看到某個變化]
  And [額外驗證 - 例如：某個狀態應該更新]
\`\`\`

### Scenario Y: [如果需要第二個場景]

\`\`\`gherkin
Scenario: [第二個場景描述]
  Given [前置條件]
  When [用戶操作]
  Then [預期結果]
\`\`\`

## 建議的 Story

### Story X.X: [Story 名稱]
- **描述**: 作為用戶，我想要 [功能描述]，以便 [價值描述]
- **對應 BDD 場景**: Scenario X
- **預估複雜度**: [簡單/中等/複雜]

### Story Y.Y: [如果需要第二個 Story]
- **描述**: 作為用戶，我想要 [功能描述]，以便 [價值描述]
- **對應 BDD 場景**: Scenario Y
- **預估複雜度**: [簡單/中等/複雜]

## 技術影響分析

### API 影響
- **新增端點**: [例如：POST /api/tasks/priority]
- **修改端點**: [例如：PUT /api/tasks/{id} - 增加 priority 欄位]

### 資料模型影響
- **影響的實體**: [例如：Task 實體需要新增 Priority 屬性]
- **資料庫變更**: [例如：需要 migration script]

### 前端影響
- **新增元件**: [例如：PrioritySelector 元件]
- **修改元件**: [例如：TaskItem 元件需要顯示優先順序]
- **狀態管理**: [例如：新增 priority 相關狀態]

## 下一步行動
1. [ ] 完善上述 BDD 場景的具體內容
2. [ ] 將完成的場景加入到 docs/bdd-specifications.md
3. [ ] 執行影響分析：./scripts/analyze-bdd-impact.sh "[關鍵字]"
4. [ ] 開始 Story 開發：參考 story-driven-development-workflow.md
5. [ ] 完成後記錄變更：./scripts/log-change.sh
EOF

    echo "✅ BDD 場景範本已生成：$SCENARIO_FILE"
    echo ""
    echo "📝 下一步請："
    echo "   1. 編輯 $SCENARIO_FILE 檔案"
    echo "   2. 完善 BDD 場景的具體內容"
    echo "   3. 將完成的場景複製到 docs/bdd-specifications.md"
    echo "   4. 執行：./scripts/analyze-bdd-impact.sh \"[關鍵字]\""
    echo ""
    
elif echo "$REQUIREMENT" | grep -qi "技術\|架構\|環境\|資料庫\|部署\|配置\|框架"; then
    echo "🔧 檢測到基礎設施變更，跳過 BDD 場景生成"
    echo ""
    echo "建議直接進入技術實作階段："
    echo "   1. 更新相關技術文件"
    echo "   2. 開始技術實作"
    echo "   3. 完成後執行：./scripts/log-change.sh"
    echo ""
    
else
    echo "❓ 無法自動分類，預設為業務功能變更"
    echo ""
    echo "如果這是業務功能變更，請重新執行並使用更明確的描述"
    echo "如果這是技術變更，請直接進入技術實作階段"
fi

echo ""
echo "======================================"
echo "    需求變更處理完成"
echo "======================================"