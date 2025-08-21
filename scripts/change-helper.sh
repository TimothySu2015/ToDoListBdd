#!/bin/bash
# scripts/change-helper.sh
# 需求變更管理主要入口腳本

echo "======================================"
echo "    ToDoListBDD 變更管理助手"
echo "======================================"
echo ""

show_help() {
    echo "用法: ./scripts/change-helper.sh [選項]"
    echo ""
    echo "選項:"
    echo "  1, requirement    開始需求變更處理"
    echo "  2, analyze        執行 BDD 影響分析"
    echo "  3, log           建立變更記錄"
    echo "  4, status        查看專案狀態"
    echo "  5, help          顯示說明"
    echo ""
    echo "範例:"
    echo "  ./scripts/change-helper.sh requirement"
    echo "  ./scripts/change-helper.sh analyze"
    echo "  ./scripts/change-helper.sh log"
    echo ""
}

show_status() {
    echo "📊 專案狀態概覽"
    echo "----------------------------------------"
    
    # BDD 場景統計
    if [ -f "docs/bdd-specifications.md" ]; then
        SCENARIO_COUNT=$(grep -c "^Scenario:" docs/bdd-specifications.md 2>/dev/null || echo "0")
        echo "📋 BDD 場景數量: $SCENARIO_COUNT"
    else
        echo "❌ BDD 規格文件不存在"
    fi
    
    # 變更記錄統計
    if [ -d "docs/change-logs" ]; then
        CHANGE_COUNT=$(find docs/change-logs -name "change-*.md" 2>/dev/null | wc -l)
        echo "📝 變更記錄數量: $CHANGE_COUNT"
        
        if [ $CHANGE_COUNT -gt 0 ]; then
            echo "📅 最近的變更:"
            find docs/change-logs -name "change-*.md" -type f -exec basename {} \; | sort -r | head -3 | while read -r file; do
                echo "   • $file"
            done
        fi
    else
        echo "📝 變更記錄數量: 0"
    fi
    
    # 暫存檔案檢查
    TEMP_FILES=$(find . -maxdepth 1 -name "temp-scenario-*.md" 2>/dev/null | wc -l)
    if [ $TEMP_FILES -gt 0 ]; then
        echo "⚠️  暫存 BDD 場景檔案: $TEMP_FILES 個"
        echo "   建議: 完善場景內容並整合到 docs/bdd-specifications.md"
    fi
    
    echo ""
}

interactive_menu() {
    while true; do
        echo "🔧 請選擇要執行的操作:"
        echo "----------------------------------------"
        echo "1. 📝 開始需求變更處理"
        echo "2. 🔍 執行 BDD 影響分析"
        echo "3. 📋 建立變更記錄"
        echo "4. 📊 查看專案狀態"
        echo "5. ❓ 顯示說明"
        echo "6. 🚪 離開"
        echo ""
        read -p "請輸入選項 (1-6): " choice
        
        case $choice in
            1)
                echo ""
                echo "🚀 啟動需求變更處理..."
                ./scripts/requirement-to-bdd.sh
                echo ""
                ;;
            2)
                echo ""
                read -p "請輸入分析關鍵字: " keyword
                if [ -n "$keyword" ]; then
                    echo "🔍 執行影響分析..."
                    ./scripts/analyze-bdd-impact.sh "$keyword"
                else
                    echo "❌ 請提供關鍵字"
                fi
                echo ""
                ;;
            3)
                echo ""
                echo "📋 建立變更記錄..."
                ./scripts/log-change.sh
                echo ""
                ;;
            4)
                echo ""
                show_status
                ;;
            5)
                echo ""
                show_help
                ;;
            6)
                echo ""
                echo "👋 感謝使用 ToDoListBDD 變更管理助手！"
                echo "======================================"
                exit 0
                ;;
            *)
                echo ""
                echo "❌ 無效選項，請輸入 1-6"
                echo ""
                ;;
        esac
    done
}

# 主程式邏輯
case "$1" in
    "1"|"requirement")
        echo "🚀 啟動需求變更處理..."
        echo ""
        ./scripts/requirement-to-bdd.sh
        ;;
    "2"|"analyze")
        if [ -n "$2" ]; then
            echo "🔍 執行影響分析: $2"
            echo ""
            ./scripts/analyze-bdd-impact.sh "$2"
        else
            echo "用法: ./scripts/change-helper.sh analyze \"關鍵字\""
            echo "範例: ./scripts/change-helper.sh analyze \"優先順序\""
        fi
        ;;
    "3"|"log")
        echo "📋 建立變更記錄..."
        echo ""
        ./scripts/log-change.sh
        ;;
    "4"|"status")
        show_status
        ;;
    "5"|"help"|"-h"|"--help")
        show_help
        ;;
    "")
        # 無參數時顯示互動式選單
        show_status
        echo ""
        interactive_menu
        ;;
    *)
        echo "❌ 無效選項: $1"
        echo ""
        show_help
        exit 1
        ;;
esac