#!/bin/bash

echo "Testing MongoDB Integration"
echo "============================"
echo ""

# Test 1: Create session
echo "Test 1: Creating session..."
SESSION_RESPONSE=$(curl -s -X POST http://localhost:3000/api/session)
echo "Response: $SESSION_RESPONSE"
SESSION_ID=$(echo $SESSION_RESPONSE | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)
echo "Session ID: $SESSION_ID"
echo ""

# Test 2: Upload a test document
echo "Test 2: Uploading test document..."
echo "This is a test contract for MongoDB integration testing." > /tmp/test-mongodb-contract.txt

UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:3000/api/upload \
  -F "files=@/tmp/test-mongodb-contract.txt" \
  -H "Cookie: docuintel_session=$SESSION_ID")

echo "Upload response:"
echo "$UPLOAD_RESPONSE" | head -c 500
echo "..."
echo ""

# Extract document ID
DOCUMENT_ID=$(echo $UPLOAD_RESPONSE | grep -o '"documentId":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Document ID: $DOCUMENT_ID"
echo ""

# Test 3: Verify data persistence by checking history
echo "Test 3: Checking session history..."
sleep 2
HISTORY_RESPONSE=$(curl -s "http://localhost:3000/api/history?sessionId=$SESSION_ID")
echo "History response:"
echo "$HISTORY_RESPONSE" | head -c 300
echo "..."
echo ""

# Test 4: Retrieve analysis result
if [ ! -z "$DOCUMENT_ID" ]; then
  echo "Test 4: Retrieving analysis result..."
  RESULT_RESPONSE=$(curl -s "http://localhost:3000/api/results/$DOCUMENT_ID")
  echo "Result response:"
  echo "$RESULT_RESPONSE" | head -c 300
  echo "..."
  echo ""
fi

echo "============================"
echo "MongoDB Integration Test Complete!"
echo ""
echo "Check your MongoDB Atlas dashboard to verify data is persisted:"
echo "Collection: docuintel.documents"
echo "Collection: docuintel.analyses"
echo "Collection: docuintel.sessions"
