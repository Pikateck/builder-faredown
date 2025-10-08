#!/bin/bash

echo "🚀 Starting Faredown Backend..."

# Initialize database tables
echo "📦 Initializing database..."
python init_db.py

# Start the FastAPI server
echo "🌐 Starting FastAPI server..."
python main.py
