#!/bin/bash

echo "Starting Faredown Backend..."

# Initialize database tables (will create if not exist)
echo "Initializing database..."
python init_db_simple.py || echo "Database init had warnings (continuing...)"

# Start the FastAPI server
echo "Starting FastAPI server..."
python main_simple.py
