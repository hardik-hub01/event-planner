@echo off
REM Lumina Events - Quick Start Script for Windows

echo ==========================================
echo  Lumina Events - Production Setup
echo ==========================================
echo.

REM Check if Node.js is installed
node -v >nul 2>&1
IF ERRORLEVEL 1 (
    echo Error: Node.js is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ Node.js is installed: 
node -v
echo.

REM Backend Setup
echo [1/4] Setting up Backend...
cd backend

if not exist node_modules (
    echo Installing dependencies...
    call npm install
) else (
    echo Dependencies already installed
)

REM Create .env file
if not exist .env (
    echo Creating .env file...
    copy .env.example .env
    echo !!! Please configure .env file with your settings !!!
) else (
    echo .env file exists
)

echo.
echo ✓ Backend setup complete
echo.

REM Display instructions
echo ==========================================
echo  Setup Instructions
echo ==========================================
echo.
echo 1. Backend Configuration (.env):
echo    - Update MONGODB_URI with your MongoDB connection string
echo    - Set JWT_SECRET to a secure random string
echo    - Add Stripe API keys
echo.
echo 2. Start the Backend:
echo    cd backend
echo    npm start
echo.
echo    Backend will run on: http://localhost:5000
echo.
echo 3. Start the Frontend:
echo    Open index.html in your browser (or use a local server)
echo    Frontend will run on: http://localhost:3000
echo.
echo 4. MongoDB:
echo    Make sure MongoDB is running:
echo    mongod
echo.
echo ==========================================
echo.
pause
