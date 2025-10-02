#!/bin/bash

# LED Animation Studio - Quick Start Script
echo "🚀 Starting LED Animation Studio..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ $NODE_VERSION -lt 18 ]; then
    echo "⚠️  Node.js version $NODE_VERSION detected. Recommended: 18+"
    echo "Consider upgrading Node.js for the best experience."
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed!"
    echo ""
fi

# Start development server
echo "🌟 Starting development server..."
echo "📱 Opening http://localhost:5173 in your browser..."
echo ""
echo "🎮 Keyboard shortcuts:"
echo "   Space - Play/Pause"
echo "   R - Reset animation"
echo "   G - Toggle background grid"
echo "   B - Reverse direction"
echo "   1-4 - Toggle patterns"
echo "   C - Color cycling"
echo "   Y - 3D Y-axis rotation"
echo ""
echo "Press Ctrl+C to stop the server"
echo "----------------------------------------"

# Start the dev server
npm run dev