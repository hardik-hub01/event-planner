#!/bin/bash

# Lumina Events - Quick Start Script for macOS/Linux

echo "=========================================="
echo "  Lumina Events - Production Setup"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed."
    echo "Please install from https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js is installed:"
node -v
echo ""

# Backend Setup
echo "[1/3] Setting up Backend..."
cd backend

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo "Dependencies already installed"
fi

# Create .env file
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "!!! Please configure .env file with your settings !!!"
else
    echo ".env file exists"
fi

echo ""
echo "✓ Backend setup complete"
echo ""

# Display instructions
echo "=========================================="
echo "  Setup Instructions"
echo "=========================================="
echo ""
echo "1. Backend Configuration (.env):"
echo "   - Update MONGODB_URI with your MongoDB connection string"
echo "   - Set JWT_SECRET to a secure random string"
echo "   - Add Stripe API keys"
echo ""
echo "2. Start the Backend:"
echo "   cd backend"
echo "   npm start"
echo ""
echo "   Backend will run on: http://localhost:5000"
echo ""
echo "3. Start the Frontend:"
echo "   Open index.html in your browser (or use a local server)"
echo "   python3 -m http.server 3000"
echo ""
echo "4. MongoDB:"
echo "   Make sure MongoDB is running:"
echo "   mongod"
echo ""
echo "=========================================="
echo ""
