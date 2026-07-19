#!/bin/bash
# DocuIntel Startup Script

echo "========================================"
echo "DocuIntel - Starting Application"
echo "========================================"
echo ""

# Kill any existing processes
pkill -f "next dev" 2>/dev/null
pkill -f "next start" 2>/dev/null
sleep 2

# Check if build exists
if [ ! -d ".next" ]; then
    echo "Building application..."
    pnpm build
    echo ""
fi

# Start the server
echo "Starting server..."
echo ""
echo "✅ Server starting on: http://localhost:3000"
echo ""
echo "📝 Endpoints:"
echo "   • Home: http://localhost:3000/"
echo "   • Analyze: http://localhost:3000/analyze"
echo "   • Compare: http://localhost:3000/compare"
echo "   • Playbooks: http://localhost:3000/playbooks"
echo "   • History: http://localhost:3000/history"
echo ""
echo "🛑 Press Ctrl+C to stop"
echo ""
echo "========================================"

# Start Next.js in production mode (faster, more reliable)
pnpm start
