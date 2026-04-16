#!/bin/bash

echo "========================================"
echo "BIBLE WEBSITE - COMPREHENSIVE TEST"
echo "========================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test HTTP endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}
    
    echo -n "Testing $name... "
    local code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$code" -eq "$expected_code" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $code)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} (Expected $expected_code, got $code)"
        ((FAILED++))
    fi
}

# Function to test API
test_api() {
    local name=$1
    local endpoint=$2
    local method=${3:-GET}
    local data=${4}
    
    echo -n "Testing $name... "
    local response=$(curl -s -X "$method" "http://localhost:3000$endpoint" \
        -H "Content-Type: application/json" \
        ${data:+-d "$data"})
    
    local success=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('success', False))" 2>/dev/null || echo "False")
    
    if [ "$success" = "True" ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((FAILED++))
    fi
}

echo "=== STATIC FILES ==="
test_endpoint "Homepage" "http://localhost:3000/index.html"
test_endpoint "Admin Panel" "http://localhost:3000/admin.html"
test_endpoint "Modern CSS" "http://localhost:3000/css/modern-framework.css"
test_endpoint "Bible CSS" "http://localhost:3000/css/bible-website.css"
test_endpoint "JavaScript" "http://localhost:3000/js/bible-website.js"
echo ""

echo "=== API ENDPOINTS ==="
test_api "Recent Posts API" "/api/posts/recent"
test_api "Admin Login" "/api/auth/login" "POST" '{"email":"st805@naver.com","password":"admin123"}'
test_api "Member Login" "/api/auth/login" "POST" '{"email":"member@example.com","password":"password123"}'
echo ""

echo "=== AUTHENTICATED APIS ==="
TOKEN=$(curl -s -X POST "http://localhost:3000/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"st805@naver.com","password":"admin123"}' \
    | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null | tr -d '\n')

if [ ! -z "$TOKEN" ]; then
    echo "Token obtained: ...${TOKEN: -10}"
    
    echo -n "Testing User Verification... "
    response=$(curl -s -X GET "http://localhost:3000/api/auth/me" \
        -H "Authorization: Bearer $TOKEN")
    success=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('success', False))" 2>/dev/null || echo "False")
    if [ "$success" = "True" ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((FAILED++))
    fi
    
    echo -n "Testing Admin Statistics... "
    response=$(curl -s -X GET "http://localhost:3000/api/admin/stats" \
        -H "Authorization: Bearer $TOKEN")
    success=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('success', False))" 2>/dev/null || echo "False")
    if [ "$success" = "True" ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((FAILED++))
    fi
    
    # Test post creation
    echo -n "Testing Create Post... "
    response=$(curl -s -X POST "http://localhost:3000/api/posts" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "{\"title\":\"Test Post $(date +%s)\",\"content\":\"Test content\",\"category\":\"korean_thought\",\"is_published\":true}")
    success=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('success', False))" 2>/dev/null || echo "False")
    if [ "$success" = "True" ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((FAILED++))
    fi
else
    echo -e "${RED}Failed to obtain token for authenticated tests${NC}"
    ((FAILED++))
fi

echo ""
echo "========================================"
echo -e "${YELLOW}SUMMARY${NC}"
echo "========================================"
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED!${NC}"
    exit 1
fi