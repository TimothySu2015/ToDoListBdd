@echo off
echo ====================================== 
echo     ToDoListBDD 腳本設定工具
echo ======================================
echo.

echo 正在檢查 Git Bash 環境...

where bash >nul 2>&1
if %errorlevel% neq 0 (
    echo 錯誤: 找不到 bash 命令
    echo 請確認已安裝 Git for Windows 並將 Git Bash 加入 PATH
    echo.
    echo 下載 Git for Windows: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo ✅ Git Bash 環境檢查通過
echo.

echo 設定腳本檔案權限...
bash -c "chmod +x scripts/*.sh"

if %errorlevel% equ 0 (
    echo ✅ 腳本權限設定完成
) else (
    echo ❌ 腳本權限設定失敗
    pause
    exit /b 1
)

echo.
echo 測試腳本功能...
bash -c "./scripts/change-helper.sh status"

echo.
echo ======================================
echo     設定完成！
echo ======================================
echo.
echo 使用方法:
echo   1. 開啟 Git Bash
echo   2. 執行: ./scripts/change-helper.sh
echo   3. 或直接執行: ./scripts/requirement-to-bdd.sh
echo.
echo 更多說明請參考: scripts/README.md
echo.
pause