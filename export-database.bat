@echo off
setlocal enabledelayedexpansion

echo 🚀 Loomio Database Export Script (Windows)
echo ==========================================

REM Load environment variables from backend\env.config
if exist "backend\env.config" (
    for /f "tokens=1,2 delims==" %%a in ('type "backend\env.config" ^| findstr /v "^#" ^| findstr "="') do (
        set %%a=%%b
    )
) else (
    echo ❌ Error: backend\env.config file not found!
    pause
    exit /b 1
)

REM Set default values if not in env file
if not defined DB_HOST set DB_HOST=localhost
if not defined DB_PORT set DB_PORT=3306
if not defined DB_NAME set DB_NAME=loomio_db
if not defined DB_USER set DB_USER=root

REM Create exports directory
if not exist "exports" mkdir exports
set EXPORT_DIR=exports
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set DATESTAMP=%%c%%a%%b
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set TIMESTAMP=%%a%%b
set TIMESTAMP=%TIMESTAMP: =0%
set EXPORT_FILE=%EXPORT_DIR%\loomio_db_%DATESTAMP%_%TIMESTAMP%.sql

echo 📊 Database Configuration:
echo    Host: %DB_HOST%
echo    Port: %DB_PORT%
echo    Database: %DB_NAME%
echo    User: %DB_USER%
echo.

REM Test MySQL connection
echo 🔍 Testing MySQL connection...
mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% -e "USE %DB_NAME%;" 2>nul
if errorlevel 1 (
    echo ❌ Error: Cannot connect to MySQL database!
    echo    Please check your database credentials and ensure MySQL is running.
    pause
    exit /b 1
)

echo ✅ MySQL connection successful!
echo.

REM Export database
echo 📤 Exporting database structure and data...
mysqldump -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% --routines --triggers --single-transaction --lock-tables=false --add-drop-table --create-options --extended-insert %DB_NAME% > "%EXPORT_FILE%"

if errorlevel 1 (
    echo ❌ Error: Database export failed!
    pause
    exit /b 1
)

echo ✅ Database exported successfully to: %EXPORT_FILE%

REM Get file size
for %%A in ("%EXPORT_FILE%") do set FILE_SIZE=%%~zA
set /a FILE_SIZE_MB=%FILE_SIZE% / 1024 / 1024
echo 📦 Export file size: %FILE_SIZE_MB% MB

REM Create metadata file
(
echo Loomio Database Export Information
echo ==================================
echo Export Date: %DATE% %TIME%
echo Database Name: %DB_NAME%
echo Database Host: %DB_HOST%:%DB_PORT%
echo Database User: %DB_USER%
echo Export File: %EXPORT_FILE%
echo.
echo Project Structure:
echo - Frontend: React + Vite
echo - Backend: Node.js + Express + Sequelize  
echo - Database: MySQL
echo - Authentication: JWT
echo.
echo Notes:
echo - This export includes complete database structure and data
echo - Use import-database.bat on the new system to restore
echo - Make sure to copy the entire project folder along with this export
) > "%EXPORT_DIR%\export_info_%DATESTAMP%_%TIMESTAMP%.txt"

echo.
echo 📋 Export Summary:
echo    Database export: %EXPORT_FILE%
echo    Metadata file: %EXPORT_DIR%\export_info_%DATESTAMP%_%TIMESTAMP%.txt
echo.
echo 🎉 Export completed successfully!
echo.
echo 📝 Next Steps:
echo    1. Copy the entire project folder to your new system
echo    2. Copy the 'exports' folder with the database backup
echo    3. Run setup-project.bat on the new system (Windows) or setup-project.sh (Linux/Mac)
echo    4. Run import-database.bat/sh to restore the database
echo.
pause