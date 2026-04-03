#!/bin/bash

echo "=== SECURITY TESTING ==="
echo "======================="
echo ""

echo "TEST 1: HTTPS Enforcement Check"
echo "-------------------------------"
# Check if site redirects to HTTPS
HTTP_RESPONSE=$(curl -s -I http://localhost:3000 2>/dev/null | grep -i "location.*https")
if [ ! -z "$HTTP_RESPONSE" ]; then
    echo "✓ HTTPS redirect configured"
else
    echo "Note: HTTP endpoint currently accepts connections (dev environment)"
fi
echo ""

echo "TEST 2: Security Headers"
echo "------------------------"
echo "Checking for security headers..."
HEADERS=$(curl -s -I http://localhost:3000 2>/dev/null)

if echo "$HEADERS" | grep -qi "X-Frame-Options"; then
    echo "✓ X-Frame-Options header present"
else
    echo "✗ X-Frame-Options header missing"
fi

if echo "$HEADERS" | grep -qi "X-Content-Type-Options"; then
    echo "✓ X-Content-Type-Options header present"
else
    echo "✗ X-Content-Type-Options header missing"
fi

if echo "$HEADERS" | grep -qi "X-XSS-Protection"; then
    echo "✓ X-XSS-Protection header present"
else
    echo "✗ X-XSS-Protection header missing"
fi

if echo "$HEADERS" | grep -qi "Strict-Transport-Security"; then
    echo "✓ Strict-Transport-Security header present"
else
    echo "✗ Strict-Transport-Security header missing"
fi
echo ""

echo "TEST 3: Input Sanitization Check"
echo "---------------------------------"
# Check HTML files for potential XSS vectors
echo "Checking for dangerous patterns..."
DANGEROUS_PATTERNS=(
    "eval("
    "document.write"
    "innerHTML.*user"
    "innerHTML.*input"
)

SAFE_COUNT=0
for pattern in "${DANGEROUS_PATTERNS[@]}"; do
    if grep -r "$pattern" public/*.html > /dev/null 2>&1; then
        echo "⚠ Pattern detected: $pattern"
    else
        ((SAFE_COUNT++))
    fi
done

if [ $SAFE_COUNT -eq ${#DANGEROUS_PATTERNS[@]} ]; then
    echo "✓ No obviously dangerous patterns found"
fi
echo ""

echo "TEST 4: Authentication Security"
echo "------------------------------"
echo "Testing session management..."

# Test login
LOGIN_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"st805@naver.com","password":"#9725"}' \
  http://localhost:3000/api/auth/login)

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo "✓ JWT token authentication working"
fi

# Test password handling
if echo "$LOGIN_RESPONSE" | grep -q "password"; then
    echo "⚠ Verify password is not exposed in logs"
fi

# Check for rate limiting
echo "Testing rate limiting (rapid requests)..."
for i in {1..5}; do
    curl -s -X POST \
      -H "Content-Type: application/json" \
      -d '{"usernameOrEmail":"test@test.com","password":"wrong"}' \
      http://localhost:3000/api/auth/login > /dev/null 2>&1
done
echo "Note: Rate limiting should prevent brute force attacks"
echo ""

echo "TEST 5: File Upload Security"
echo "----------------------------"
UPLOAD_RESPONSE=$(curl -s -I http://localhost:3000/uploads 2>/dev/null)
if echo "$UPLOAD_RESPONSE" | grep -q "403\|401"; then
    echo "✓ Upload directory properly protected"
else
    echo "⚠ Verify upload directory has proper access controls"
fi
echo ""

echo "TEST 6: Sensitive File Exposure"
echo "-------------------------------"
SENSITIVE_FILES=(
    ".env"
    ".git"
    "package.json"
    "server.js"
    "database"
)

SAFE_COUNT=0
for file in "${SENSITIVE_FILES[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/$file 2>/dev/null)
    if [ "$STATUS" = "404" ] || [ "$STATUS" = "403" ]; then
        ((SAFE_COUNT++))
    else
        echo "⚠ Potentially accessible: $file"
    fi
done

if [ $SAFE_COUNT -eq ${#SENSITIVE_FILES[@]} ]; then
    echo "✓ Sensitive files not accessible"
fi
echo ""

echo "TEST 7: CORS Configuration"
echo "--------------------------"
CORS_CHECK=$(curl -s -I -H "Origin: http://malicious-site.com" http://localhost:3000/api/auth/login 2>/dev/null | grep -i "access-control-allow-origin")
if echo "$CORS_CHECK" | grep -q "malicious-site.com"; then
    echo "✗ WARNING: CORS allows arbitrary origins"
else
    echo "✓ CORS properly configured or restricted"
fi
echo ""

echo "TEST 8: SQL Injection Prevention"
echo "--------------------------------"
# This would typically need database access, checking code patterns instead
if grep -r "SELECT.*FROM.*WHERE.*'" server.js > /dev/null 2>&1; then
    echo "⚠ Verify SQL queries use parameterized queries"
elif [ -f "server.js" ]; then
    echo "✓ No obvious SQL injection patterns detected"
else
    echo "Note: Server file not found for SQL injection analysis"
fi
echo ""

echo "=== SECURITY TESTING COMPLETE ==="
echo ""
