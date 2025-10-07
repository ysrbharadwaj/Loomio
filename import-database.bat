@echo off
setlocal enabledelayedexpansion

echo 🚀 Loomio Database Import Script (Windows)
echo ==========================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: This doesn't appear to be the Loomio project directory.
    echo    Make sure you're running this script from the root of the Loomio project.
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ❌ Error: Frontend directory not found!
    pause
    exit /b 1
)

if not exist "backend" (
    echo ❌ Error: Backend directory not found!
    pause
    exit /b 1
)

REM Check if exports directory exists
if not exist "exports" (
    echo ❌ Error: 'exports' directory not found!
    echo    Make sure you've copied the database export from your old system.
    pause
    exit /b 1
)

REM Load environment variables
if exist "backend\.env" (
    for /f "tokens=1,2 delims==" %%a in ('type "backend\.env" ^| findstr /v "^#" ^| findstr "="') do (
        set %%a=%%b
    )
) else if exist "backend\env.config" (
    for /f "tokens=1,2 delims==" %%a in ('type "backend\env.config" ^| findstr /v "^#" ^| findstr "="') do (
        set %%a=%%b
    )
) else (
    echo ❌ Error: No environment configuration found!
    echo    Make sure backend\.env or backend\env.config exists.
    pause
    exit /b 1
)

REM Set default values
if not defined DB_HOST set DB_HOST=localhost
if not defined DB_PORT set DB_PORT=3306
if not defined DB_NAME set DB_NAME=loomio_db
if not defined DB_USER set DB_USER=loomio_user

echo 📊 Database Configuration:
echo    Host: %DB_HOST%
echo    Port: %DB_PORT%
echo    Database: %DB_NAME%
echo    User: %DB_USER%
echo.

REM Find the most recent SQL backup file
set LATEST_SQL=
for /f "delims=" %%i in ('dir /b /o-d "exports\*.sql" 2^>nul') do (
    if not defined LATEST_SQL set LATEST_SQL=exports\%%i
)

if not defined LATEST_SQL (
    echo ❌ Error: No database backup files found in exports directory!
    echo    Expected files: *.sql
    pause
    exit /b 1
)

echo 📄 Using SQL backup: %LATEST_SQL%

REM Check file size
for %%A in ("%LATEST_SQL%") do set FILE_SIZE=%%~zA
set /a FILE_SIZE_MB=%FILE_SIZE% / 1024 / 1024
echo 📦 Backup file size: %FILE_SIZE_MB% MB

REM Check MySQL connection
echo 🔍 Testing MySQL connection...
mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% -e "SELECT 1;" 2>nul
if errorlevel 1 (
    echo ❌ Error: Cannot connect to MySQL database!
    echo    Please check your database credentials and ensure MySQL is running.
    echo.
    echo 💡 Troubleshooting:
    echo    1. Make sure MySQL is installed and running
    echo    2. Verify database credentials in backend\.env
    echo    3. Ensure the database '%DB_NAME%' exists
    echo    4. Check if user '%DB_USER%' has proper permissions
    pause
    exit /b 1
)

echo ✅ MySQL connection successful!

REM Check if database exists
mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% -e "SHOW DATABASES LIKE '%DB_NAME%';" | findstr %DB_NAME% >nul
if errorlevel 1 (
    echo ❌ Error: Database '%DB_NAME%' does not exist!
    echo    Please create the database first or run setup-project.bat
    pause
    exit /b 1
)

REM Warn about data overwrite
echo ⚠️  WARNING: This will replace all data in the '%DB_NAME%' database!
echo    All existing tables and data will be dropped and recreated.
echo.
set /p CONFIRM="Are you sure you want to continue? (y/N): "
if /i not "%CONFIRM%"=="y" (
    echo ❌ Import cancelled by user
    pause
    exit /b 1
)

REM Create backup of current database (if it has tables)
echo 💾 Creating backup of current database...
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set DATESTAMP=%%c%%a%%b
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set TIMESTAMP=%%a%%b
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=exports\pre_import_backup_%DATESTAMP%_%TIMESTAMP%.sql

mysqldump -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% --routines --triggers --single-transaction %DB_NAME% > "%BACKUP_FILE%" 2>nul

if errorlevel 1 (
    echo ⚠️  Warning: Failed to backup current database
) else (
    echo ✅ Current database backed up to: %BACKUP_FILE%
)

REM Import the database
echo 📥 Importing database from backup...
echo    This may take several minutes depending on the backup size...

mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% < "%LATEST_SQL%"

if errorlevel 1 (
    echo ❌ Error: Database import failed!
    if exist "%BACKUP_FILE%" (
        echo    You can restore the previous database using: %BACKUP_FILE%
    )
    pause
    exit /b 1
)

echo ✅ Database imported successfully!

REM Verify import
echo 🔍 Verifying database import...
mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% -e "USE %DB_NAME%; SHOW TABLES;" > temp_tables.txt 2>nul

if errorlevel 1 (
    echo ❌ Error: Database verification failed!
    del temp_tables.txt 2>nul
    pause
    exit /b 1
)

REM Count tables (subtract 1 for header)
for /f %%a in ('type temp_tables.txt ^| find /c /v ""') do set TABLES_COUNT=%%a
set /a TABLES_COUNT=%TABLES_COUNT% - 1

if %TABLES_COUNT% gtr 0 (
    echo ✅ Database verification successful!
    echo    Tables imported: %TABLES_COUNT%
    
    echo.
    echo 📋 Imported Tables:
    for /f "skip=1 tokens=*" %%a in (temp_tables.txt) do echo    - %%a
) else (
    echo ❌ Error: Database verification failed - no tables found!
    del temp_tables.txt 2>nul
    pause
    exit /b 1
)

del temp_tables.txt 2>nul

echo.
echo 🎉 Database Import Complete!
echo ============================
echo.
echo 📋 Import Summary:
echo    ✅ Database: %DB_NAME%
echo    ✅ Source: %LATEST_SQL%
echo    ✅ Tables: %TABLES_COUNT%
echo    ✅ Host: %DB_HOST%:%DB_PORT%
echo.
echo 📝 Next Steps:
echo    1. Start the application: start-loomio.bat
echo    2. Open your browser to: http://localhost:3000
echo    3. Log in with your existing credentials
echo.
echo 🔧 If you encounter issues:
echo    - Check backend\.env for correct database settings
echo    - Ensure all dependencies are installed: npm install
echo    - Check application logs for any errors
echo.
if exist "%BACKUP_FILE%" (
    echo 💾 Backup of previous database: %BACKUP_FILE%
    echo.
)
pause