@echo off
REM SnapSpot Utilities Launcher
REM Automatically detects Node.js or Python and starts local server

echo =====================================
echo  SnapSpot Utilities Launcher
echo =====================================
echo.

REM Check for Node.js
where /q npx
if %ERRORLEVEL% EQU 0 (
    echo [OK] Node.js detected - starting http-server...
    echo.
    echo Server starting on http://localhost:8081
    echo Browser will open automatically...
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    start http://localhost:8081
    npx http-server -p 8081 --cors
    goto :end
)

REM Check for Python
where /q python
if %ERRORLEVEL% EQU 0 (
    echo [OK] Python detected - starting HTTP server...
    echo.
    echo Server starting on http://localhost:8081
    echo Browser will open automatically...
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    start http://localhost:8081
    python -m http.server 8081
    goto :end
)

REM No server found
echo [ERROR] No HTTP server found!
echo.
echo SnapSpot Utilities requires either Node.js or Python to run.
echo Please install one of the following:
echo.
echo Node.js (Recommended):
echo   Download: https://nodejs.org/
echo   After installing, run this script again
echo.
echo Python:
echo   Download: https://www.python.org/downloads/
echo   After installing, run this script again
echo.
pause
goto :end

:end
