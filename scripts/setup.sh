#!/bin/bash
# scripts/setup.sh
# ToDoListBDD 腳本設定工具（Linux/macOS）

echo "======================================"
echo "    ToDoListBDD 腳本設定工具"
echo "======================================"
echo ""

echo "🔧 設定腳本檔案權限..."
chmod +x scripts/*.sh

if [ $? -eq 0 ]; then
    echo "✅ 腳本權限設定完成"
else
    echo "❌ 腳本權限設定失敗"
    exit 1
fi

echo ""
echo "🧪 測試腳本功能..."
./scripts/change-helper.sh status

echo ""
echo "======================================"
echo "    設定完成！"
echo "======================================"
echo ""
echo "🎯 使用方法:"
echo "   1. 執行主助手: ./scripts/change-helper.sh"
echo "   2. 或直接執行: ./scripts/requirement-to-bdd.sh"
echo "   3. 查看說明: ./scripts/change-helper.sh help"
echo ""
echo "📚 更多說明請參考: scripts/README.md"
echo ""