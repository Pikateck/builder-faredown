#!/bin/bash

echo "🚀 Starting Faredown Backend..."

# Verify setup
echo "🔍 Verifying setup..."
python verify_setup.py
if [ $? -ne 0 ]; then
    echo "❌ Setup verification failed"
    exit 1
fi

# Initialize database tables
echo "📦 Initializing database..."
python init_db.py

# Start the FastAPI server
echo "🌐 Starting FastAPI server..."
python main.py
