#!/bin/bash
# Quick script to test PDF upload specifically

echo "🧪 Testing PDF Upload"
echo "===================="
echo ""

# Check if a PDF file was provided or use a test
if [ -f "$1" ]; then
    PDF_FILE="$1"
    echo "📄 Using provided file: $PDF_FILE"
else
    echo "❌ No PDF file provided"
    echo ""
    echo "Usage: ./test-pdf-upload.sh <path-to-pdf>"
    echo ""
    echo "Example:"
    echo "  ./test-pdf-upload.sh 'Ayush Kumar Mishra Product.pdf'"
    exit 1
fi

echo "📦 File size: $(ls -lh "$PDF_FILE" | awk '{print $5}')"
echo ""

echo "🚀 Uploading to API..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/upload \
  -F "files=@$PDF_FILE")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed \$d)

echo "📊 Response Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Upload completed!"
    echo ""
    echo "📋 Response:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    echo ""
    
    # Check for documentId
    DOC_ID=$(echo "$BODY" | jq -r '.results[0].documentId' 2>/dev/null)
    ERROR=$(echo "$BODY" | jq -r '.results[0].error' 2>/dev/null)
    
    if [ "$ERROR" != "null" ] && [ -n "$ERROR" ]; then
        echo "❌ Processing failed with error:"
        echo "   $ERROR"
        echo ""
        echo "💡 Check the server terminal for detailed error logs"
    elif [ "$DOC_ID" != "null" ] && [ -n "$DOC_ID" ]; then
        echo "🎉 SUCCESS! Document ID: $DOC_ID"
        echo "🔗 View results: http://localhost:3000/results/$DOC_ID"
    else
        echo "⚠️  Upload succeeded but response format unexpected"
    fi
else
    echo "❌ Upload failed with HTTP $HTTP_CODE"
    echo ""
    echo "📋 Error Response:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
fi

echo ""
echo "===================="
echo ""
echo "💡 Tip: Watch your server terminal for detailed logs"
