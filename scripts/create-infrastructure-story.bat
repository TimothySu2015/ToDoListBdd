@echo off
REM scripts/create-infrastructure-story.bat
REM 建立基礎設施 Story 的 Windows 腳本

if "%~1"=="" goto :usage
if "%~2"=="" goto :usage

set STORY_NUMBER=%~1
set STORY_TITLE=%~2

echo 建立基礎設施 Story %STORY_NUMBER%: %STORY_TITLE%

REM 建立 Story 專用資料夾
set STORY_DIR=docs\stories\infrastructure-story-%STORY_NUMBER%
if not exist "%STORY_DIR%" mkdir "%STORY_DIR%"

REM 複製範本檔案
copy templates\infrastructure-story-template.md "%STORY_DIR%\README.md" >nul

REM 替換範本變數 (Windows PowerShell 方式)
powershell -Command "(Get-Content '%STORY_DIR%\README.md') -replace '\[編號\]', '%STORY_NUMBER%' | Set-Content '%STORY_DIR%\README.md'"
powershell -Command "(Get-Content '%STORY_DIR%\README.md') -replace '\[基礎設施任務標題\]', '%STORY_TITLE%' | Set-Content '%STORY_DIR%\README.md'"

echo ✅ 基礎設施 Story %STORY_NUMBER% 已建立完成
echo 📁 檔案位置: %STORY_DIR%\README.md
echo.
echo 📋 接下來的步驟:
echo 1. 編輯 %STORY_DIR%\README.md
echo 2. 填寫具體的技術目標和任務清單
echo 3. 基於架構文件開始實作
echo.
echo 💡 提醒: 基礎設施 Story 不需要 BDD 場景，直接基於技術文件實作
goto :end

:usage
echo 使用方式: %0 ^<Story編號^> ^<Story標題^>
echo 範例: %0 1 "建立Angular專案架構"

:end