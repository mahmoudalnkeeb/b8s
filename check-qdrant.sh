#!/bin/bash
# Run this on your server to check Qdrant contents
# Usage: bash check-qdrant.sh <agent-id>

AGENT_ID=${1:-""}
QDRANT_URL="http://qdrant:6333"

echo "=== Qdrant Collections ==="
curl -s "$QDRANT_URL/collections" | python3 -m json.tool

if [ -n "$AGENT_ID" ]; then
  # Convert UUID to collection name format (replace - with _)
  COLLECTION_NAME="kb_$(echo $AGENT_ID | tr '-' '_')"
  
  echo ""
  echo "=== Collection Info: $COLLECTION_NAME ==="
  curl -s "$QDRANT_URL/collections/$COLLECTION_NAME" | python3 -m json.tool
  
  echo ""
  echo "=== Sample Points from $COLLECTION_NAME ==="
  curl -s -X POST "$QDRANT_URL/collections/$COLLECTION_NAME/points/scroll" \
    -H "Content-Type: application/json" \
    -d '{
      "limit": 3,
      "with_payload": true,
      "with_vector": false
    }' | python3 -m json.tool
  
  echo ""
  echo "=== Searching for 'github' ==="
  echo "(This requires embedding - run the Node.js script instead)"
fi
