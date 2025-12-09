@echo off
setlocal enabledelayedexpansion

REM 日记应用备份脚本 (Windows版本)
REM 每日自动备份数据和图片

REM 设置变量
set APP_DIR=.
set DATA_DIR=%APP_DIR%\data
set BACKUP_DIR=%APP_DIR%\backups
set DATE=%date:~0,4%%date:~5,2%%date:~8,2%
set TIMESTAMP=%date% %time%

REM 创建备份目录（如果不存在）
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo [%TIMESTAMP%] 开始备份...

REM 1. 备份日记数据
echo 备份日记数据...
if exist "%DATA_DIR%\db\diaries.json" (
    copy "%DATA_DIR%\db\diaries.json" "%BACKUP_DIR%\diaries-%DATE%.json" >nul
    echo 日记数据备份完成: diaries-%DATE%.json
) else (
    echo 警告: 日记数据文件不存在
)

REM 2. 打包上传的图片
echo 备份图片文件...
if exist "%DATA_DIR%\uploads" (
    dir /b "%DATA_DIR%\uploads" >nul 2>&1
    if %errorlevel% == 0 (
        REM 使用PowerShell创建压缩包
        powershell -command "Compress-Archive -Path '%DATA_DIR%\uploads\*' -DestinationPath '%BACKUP_DIR%\images-%DATE%.zip' -Force"
        echo 图片备份完成: images-%DATE%.zip
    ) else (
        echo 没有图片文件需要备份
    )
)

REM 3. 创建完整备份包
echo 创建完整备份包...
powershell -command "Compress-Archive -Path '%DATA_DIR%\*' -DestinationPath '%BACKUP_DIR%\full-backup-%DATE%.zip' -Force"

REM 4. 清理旧备份（保留最近30天）
echo 清理旧备份...
forfiles /p "%BACKUP_DIR%" /s /m *.json /d -30 /c "cmd /c del @path"
forfiles /p "%BACKUP_DIR%" /s /m *.zip /d -30 /c "cmd /c del @path"

REM 5. 列出所有备份文件
echo.
echo 当前备份文件:
dir "%BACKUP_DIR%" /b

echo.
echo [%TIMESTAMP%] 备份完成！

pause