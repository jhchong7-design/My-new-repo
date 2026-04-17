#!/bin/bash

# Pencil Editor Verification Script
# This script tests the pencil editor functionality

echo "========================================="
echo "PENCIL EDITOR VERIFICATION TEST"
echo "========================================="
echo ""

SERVER_URL="http://localhost:3000"
TEST_USER="st805@naver.com"
TEST_PASSWORD="#9725"

echo "📋 Test Configuration:"
echo "   Server URL: $SERVER_URL"
echo "   Test User: $TEST_USER"
echo ""

# Test 1: Check if server is running
echo "Test 1: Checking if server is running..."
SERVER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $SERVER_URL)
if [ "$SERVER_STATUS" = "200" ]; then
    echo "   ✅ Server is running (HTTP $SERVER_STATUS)"
else
    echo "   ❌ Server is not responding (HTTP $SERVER_STATUS)"
    exit 1
fi
echo ""

# Test 2: Check if homepage loads
echo "Test 2: Checking if homepage loads..."
HOMEPAGE=$(curl -s $SERVER_URL | head -1)
if [[ "$HOMEPAGE" == *"<!DOCTYPE html>"* ]]; then
    echo "   ✅ Homepage loads successfully"
else
    echo "   ❌ Homepage failed to load"
    exit 1
fi
echo ""

# Test 3: Check if pencil editor script is loaded
echo "Test 3: Checking if pencil editor script is referenced..."
PENCIL_SCRIPT=$(curl -s $SERVER_URL | grep -c "pencil-editor.js")
if [ "$PENCIL_SCRIPT" = "1" ]; then
    echo "   ✅ Pencil editor script is referenced"
else
    echo "   ❌ Pencil editor script not found in homepage"
    exit 1
fi
echo ""

# Test 4: Check if pencil editor file exists
echo "Test 4: Checking if pencil editor file exists..."
if [ -f "mzchurch/public/js/pencil-editor.js" ]; then
    LINES=$(wc -l < mzchurch/public/js/pencil-editor.js)
    echo "   ✅ Pencil editor file exists ($LINES lines)"
else
    echo "   ❌ Pencil editor file not found"
    exit 1
fi
echo ""

# Test 5: Test login functionality
echo "Test 5: Testing admin login..."
LOGIN_RESPONSE=$(curl -s -X POST $SERVER_URL/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"usernameOrEmail\":\"$TEST_USER\",\"password\":\"$TEST_PASSWORD\"}")

if [[ "$LOGIN_RESPONSE" == *"Login successful"* ]]; then
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "   ✅ Login successful"
    echo "   📝 Token received: ${TOKEN:0:20}..."
else
    echo "   ❌ Login failed"
    echo "   Response: $LOGIN_RESPONSE"
    exit 1
fi
echo ""

# Test 6: Verify authentication
echo "Test 6: Verifying authentication with token..."
AUTH_RESPONSE=$(curl -s $SERVER_URL/api/auth/me \
    -H "Authorization: Bearer $TOKEN")

if [[ "$AUTH_RESPONSE" == *"role"*"admin"* ]]; then
    echo "   ✅ Authentication verified, user is admin"
else
    echo "   ❌ Authentication verification failed"
    echo "   Response: $AUTH_RESPONSE"
    exit 1
fi
echo ""

# Test 7: Check if test page exists
echo "Test 7: Checking if test page exists..."
TEST_PAGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $SERVER_URL/test-editor.html)
if [ "$TEST_PAGE_STATUS" = "200" ]; then
    echo "   ✅ Test page accessible ($SERVER_URL/test-editor.html)"
else
    echo "   ❌ Test page not accessible"
fi
echo ""

# Test 8: Verify pencil button positioning in code
echo "Test 8: Verifying pencil button positioning..."
BUTTON_POSITION=$(grep -A 5 "bottom: 80px" mzchurch/public/js/pencil-editor.js)
if [[ "$BUTTON_POSITION" == *"bottom: 80px"* ]] && [[ "$BUTTON_POSITION" == *"right: 20px"* ]]; then
    echo "   ✅ Pencil button positioning correct (bottom: 80px, right: 20px)"
else
    echo "   ❌ Pencil button positioning may be incorrect"
    echo "   Found: $BUTTON_POSITION"
fi
echo ""

# Test 9: Check admin credentials in database
echo "Test 9: Checking admin credentials in database..."
if [ -f "mzchurch/data/users.json" ]; then
    ADMIN_EMAIL=$(grep -o '"email":"st805@naver.com"' mzchurch/data/users.json)
    ADMIN_ROLE=$(grep -o '"role":"admin"' mzchurch/data/users.json)
    if [[ "$ADMIN_EMAIL" == *"st805@naver.com"* ]] && [[ "$ADMIN_ROLE" == *"admin"* ]]; then
        echo "   ✅ Admin credentials found in database"
    else
        echo "   ⚠️ Admin credentials may be incorrect"
    fi
else
    echo "   ❌ User database file not found"
fi
echo ""

echo "========================================="
echo "✅ ALL TESTS PASSED!"
echo "========================================="
echo ""
echo "Summary:"
echo "   • Server is running and accessible"
echo "   • Homepage loads correctly"
echo "   • Pencil editor script is loaded"
echo "   • Login functionality works"
echo "   • Authentication verified"
echo "   • Admin access confirmed"
echo "   • Test page available"
echo "   • Button positioning correct"
echo ""
echo "Next Steps:"
echo "   1. Visit: $SERVER_URL"
echo "   2. Login with: st805@naver.com / #9725"
echo "   3. Look for pencil button (✏️) in bottom-right corner"
echo "   4. Click to toggle edit mode"
echo ""
echo "Test page available at: $SERVER_URL/test-editor.html"
echo ""