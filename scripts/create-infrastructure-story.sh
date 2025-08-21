#!/bin/bash
# scripts/create-infrastructure-story.sh
# 建立基礎設施 Story 的腳本

STORY_NUMBER=$1
STORY_TITLE=$2

if [ -z "$STORY_NUMBER" ] || [ -z "$STORY_TITLE" ]; then
    echo "使用方式: $0 <Story編號> <Story標題>"
    echo "範例: $0 1 '建立Angular專案架構'"
    exit 1
fi

echo "建立基礎設施 Story $STORY_NUMBER: $STORY_TITLE"

# 建立 Story 專用資料夾
STORY_DIR="docs/stories/infrastructure-story-$STORY_NUMBER"
mkdir -p "$STORY_DIR"

# 複製範本檔案
cp templates/infrastructure-story-template.md "$STORY_DIR/README.md"

# 替換範本變數
sed -i "s/\[編號\]/$STORY_NUMBER/g" "$STORY_DIR/README.md"
sed -i "s/\[基礎設施任務標題\]/$STORY_TITLE/g" "$STORY_DIR/README.md"

echo "✅ 基礎設施 Story $STORY_NUMBER 已建立完成"
echo "📁 檔案位置: $STORY_DIR/README.md"
echo ""
echo "📋 接下來的步驟:"
echo "1. 編輯 $STORY_DIR/README.md"
echo "2. 填寫具體的技術目標和任務清單"
echo "3. 基於架構文件開始實作"
echo ""
echo "💡 提醒: 基礎設施 Story 不需要 BDD 場景，直接基於技術文件實作"