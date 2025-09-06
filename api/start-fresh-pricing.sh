#!/bin/bash

echo "🛑 Killing existing pricing servers..."
kill -9 $(ps aux | grep 'pricing-server.js' | grep -v grep | awk '{print $2}') 2>/dev/null || echo "No servers to kill"

echo "⏳ Waiting for cleanup..."
sleep 2

echo "🚀 Starting fresh pricing server..."
cd api
nohup npm run start:pricing > pricing-fresh.log 2>&1 &

echo "⏳ Waiting for server to start..."
sleep 3

echo "✅ Fresh server started. Testing health..."
curl -s http://localhost:3001/health || echo "Health check failed"
