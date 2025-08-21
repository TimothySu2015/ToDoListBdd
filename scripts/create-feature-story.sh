#!/bin/bash  
# scripts/create-feature-story.sh
# 建立業務功能 Story 的腳本

STORY_NUMBER=$1
STORY_TITLE=$2

if [ -z "$STORY_NUMBER" ] || [ -z "$STORY_TITLE" ]; then
    echo "使用方式: $0 <Story編號> <Story標題>"
    echo "範例: $0 1 '實作新增任務功能'"
    exit 1
fi

echo "建立業務功能 Story $STORY_NUMBER: $STORY_TITLE"

# 建立 Story 專用資料夾
STORY_DIR="docs/stories/feature-story-$STORY_NUMBER"
mkdir -p "$STORY_DIR"

# 複製範本檔案
cp templates/feature-story-template.md "$STORY_DIR/README.md"

# 替換範本變數
sed -i "s/\[編號\]/$STORY_NUMBER/g" "$STORY_DIR/README.md"
sed -i "s/\[業務功能標題\]/$STORY_TITLE/g" "$STORY_DIR/README.md"

echo "✅ 業務功能 Story $STORY_NUMBER 已建立完成"
echo "📁 檔案位置: $STORY_DIR/README.md"
echo ""
echo "📋 接下來的步驟:"
echo "1. 編輯 $STORY_DIR/README.md"
echo "2. ⚡ 第一步：撰寫 BDD 場景 (必須完成才能繼續)"
echo "3. 基於 BDD 場景推導技術需求"
echo "4. 先寫 BDD 測試，再實作程式碼"
echo ""
echo "🚨 重要提醒: 業務功能 Story 的第一步必須是撰寫 BDD 場景！"
echo "📖 參考文件: docs/prd-final.md (查看 FR1-FR10 功能需求)"