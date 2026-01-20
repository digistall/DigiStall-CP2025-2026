#!/bin/bash
# Complete Mobile Document System Fix for DigitalOcean
# This script fixes all 3 stored procedures and updates the table structure

echo "🔄 Fixing Mobile Document System..."
echo ""

# Navigate to project directory
cd /opt/digistall

# Check if fix script exists
if [ ! -f "fix_mobile_procedures.mjs" ]; then
    echo "❌ fix_mobile_procedures.mjs not found!"
    echo "Please upload it first using:"
    echo "scp fix_mobile_procedures.mjs root@68.183.154.125:/opt/digistall/"
    exit 1
fi

echo "✅ Fix script found"
echo ""

# Copy script into container
echo "📦 Copying fix script into backend container..."
docker cp fix_mobile_procedures.mjs digistall-backend-mobile:/app/
echo "✅ Script copied"
echo ""

# Run the fix
echo "🔧 Running database fixes..."
docker-compose exec -T backend-mobile node /app/fix_mobile_procedures.mjs
echo ""

# Restart backend to clear cache
echo "🔄 Restarting mobile backend..."
docker-compose restart backend-mobile
echo "✅ Backend restarted"
echo ""

# Show recent logs
echo "📋 Recent logs:"
docker logs digistall-backend-mobile --tail 20
echo ""

echo "🎉 Fix deployment complete!"
echo ""
echo "✅ sp_getBranchDocRequirementsFull - Fixed"
echo "✅ sp_getStallholderUploadedDocuments - Fixed"  
echo "✅ sp_insertStallholderDocumentBlob - Fixed"
echo "✅ stallholder_documents.document_type_id - Added"
echo ""
echo "You can now test the mobile app!"
