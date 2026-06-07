@echo off
TITLE Wynn Finance V2 - Startup Sequence
SETLOCAL EnableDelayedExpansion

:: -------------------------------------------------------------------------
:: WYNN FINANCE V2 - ONE-CLICK BOOT LOADER
:: -------------------------------------------------------------------------

echo.
echo =======================================================================
echo    🚀 WYNN FINANCE V2 - Professional Trading Terminal
echo =======================================================================
echo.

:: Check for node_modules
if not exist "node_modules\" (
    echo [SYSTEM] node_modules not found. Initiating dependency installation...
    call npm install
    if !errorlevel! neq 0 (
        echo.
        echo [ERROR] npm install failed. Please check your internet connection.
        pause
        exit /b 1
    )
)

echo [SYSTEM] Booting Development Server (Vite + Express + AI Engine)...
echo [SYSTEM] Platform will be available at http://localhost:8080
echo.

:: Set environment to development
set NODE_ENV=development

:: Execute development script
call npm run dev

if !errorlevel! neq 0 (
    echo.
    echo [CRITICAL] Application crashed or stopped unexpectedly.
    pause
)

ENDLOCAL
