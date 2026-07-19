#!/bin/bash
# Debug script for DocuIntel upload testing

echo "🔍 DocuIntel Upload Diagnostics"
echo "================================"
echo ""

# Check if server is running
echo "1. Checking if dev server is running..."
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "   ✅ Server is running on port 3000"
else
    echo "   ❌ Server is NOT running on port 3000"
    echo "   Run: pnpm dev"
    exit 1
fi

# Check environment
echo ""
echo "2. Checking environment configuration..."
if [ -f .env.local ]; then
    echo "   ✅ .env.local exists"
    if grep -q "USE_MOCK=1" .env.local; then
        echo "   ℹ️  Mock mode enabled (USE_MOCK=1)"
    else
        echo "   ℹ️  Production mode (USE_MOCK=0 or not set)"
    fi
else
    echo "   ⚠️  .env.local not found"
fi

# Check storage directory
echo ""
echo "3. Checking storage directory..."
if [ -d .docuintel/storage ]; then
    echo "   ✅ Storage directory exists"
    FILE_COUNT=$(ls -1 .docuintel/storage 2>/dev/null | wc -l | tr -d ' ')
    echo "   ℹ️  Files in storage: $FILE_COUNT"
else
    echo "   ⚠️  Creating storage directory..."
    mkdir -p .docuintel/storage
    echo "   ✅ Storage directory created"
fi

# Test API endpoints
echo ""
echo "4. Testing API endpoints..."

# Test session endpoint
echo "   Testing /api/session..."
SESSION_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/session -X POST)
if [ "$SESSION_RESPONSE" = "200" ]; then
    echo "   ✅ Session API responding ($SESSION_RESPONSE)"
else
    echo "   ❌ Session API error ($SESSION_RESPONSE)"
fi

# Test upload endpoint (OPTIONS for CORS)
echo "   Testing /api/upload..."
UPLOAD_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/upload -X OPTIONS)
if [ "$UPLOAD_RESPONSE" = "200" ] || [ "$UPLOAD_RESPONSE" = "405" ]; then
    echo "   ✅ Upload API accessible"
else
    echo "   ⚠️  Upload API response: $UPLOAD_RESPONSE"
fi

# Check Node/pnpm versions
echo ""
echo "5. Checking dependencies..."
echo "   Node version: $(node -v)"
echo "   pnpm version: $(pnpm -v)"

# Check if build is up to date
echo ""
echo "6. Checking build status..."
if [ -d .next ]; then
    echo "   ✅ .next directory exists"
else
    echo "   ⚠️  .next directory not found - run 'pnpm build'"
fi

echo ""
echo "================================"
echo "✨ Diagnostics complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Open http://localhost:3000/analyze"
echo "   2. Upload a PDF/DOCX file"
echo "   3. Check browser console (F12) for errors"
echo "   4. Check terminal for server logs"
echo ""
echo "🐛 If upload fails, check:"
echo "   - Browser console (F12 → Console tab)"
echo "   - Network tab (F12 → Network tab)"
echo "   - Server terminal for error logs"
echo ""
