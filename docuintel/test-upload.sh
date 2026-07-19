#!/bin/bash
# Quick test of the upload API with a real file

echo "🧪 Testing DocuIntel Upload API"
echo "==============================="
echo ""

# Create test file if it doesn't exist
if [ ! -f "test-contract.txt" ]; then
    echo "Creating test-contract.txt..."
    echo "This is a test contract. The term shall automatically renew for successive periods. The liability under this agreement is unlimited." > test-contract.txt
fi

echo "📄 Test file: test-contract.txt"
echo "📦 File size: $(wc -c < test-contract.txt) bytes"
echo ""

echo "🚀 Sending POST request to /api/upload..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/upload \
  -F "files=@test-contract.txt")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed \$d)

echo "📊 Response Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ SUCCESS! Upload worked!"
    echo ""
    echo "📋 Response:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    echo ""
    
    # Extract documentId if present
    DOC_ID=$(echo "$BODY" | jq -r '.results[0].documentId' 2>/dev/null)
    if [ "$DOC_ID" != "null" ] && [ -n "$DOC_ID" ]; then
        echo "🎉 Document ID: $DOC_ID"
        echo "🔗 View results: http://localhost:3000/results/$DOC_ID"
    fi
else
    echo "❌ FAILED! HTTP $HTTP_CODE"
    echo ""
    echo "📋 Error Response:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    echo ""
    echo "💡 Troubleshooting:"
    echo "   1. Is the dev server running? (pnpm dev)"
    echo "   2. Check server terminal for errors"
    echo "   3. Try: rm -rf .next && pnpm dev"
fi

echo ""
echo "==============================="
