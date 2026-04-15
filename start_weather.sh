#!/bin/bash

# Navigate to the directory where the script is located
cd "$(dirname "$0")"

# Start Next.js app on port 3002
echo "🚀 Starting Weather App on port 3002..."
npm run dev -- --port 3002
