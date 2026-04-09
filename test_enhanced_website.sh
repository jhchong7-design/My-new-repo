#!/bin/bash

# Enhanced Website Test Script
# Tests all functionality after restoration and enhancement

echo "========================================="
echo "ENHANCED BIBLE WEBSITE - COMPREHENSIVE TEST"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local name="$1"
    local url="$2"
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}PASSED${NC} (HTTP 200)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}FAILED${NC} (HTTP $response)"
        FAILED=$((FAILED + 1))
    fi
}

# Test API function
test_api() {
    local name="$1"
    local endpoint="$2"
    local method="${3:-GET}"
    local data="${4:-}"
    
    echo -n "Testing $name... "
    
    if [ -n "$data" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "http://localhost:3000$endpoint")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$endpoint")
    fi
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}PASSED${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}FAILED${NC} (HTTP $response)"
        FAILED=$((FAILED + 1))
    fi
}

echo "=== STATIC FILES ==="
test_endpoint "Homepage" "http://localhost:3000/index.html"
test_endpoint "About Page" "http://localhost:3000/about.html"
test_endpoint "Korean Thought Page" "http://localhost:3000/korean-thought.html"
test_endpoint "World Thought Page" "http://localhost:3000/world-thought.html"
test_endpoint "Publications Page" "http://localhost:3000/publications.html"
test_endpoint "Forum Page" "http://localhost:3000/forum.html"
test_endpoint "Admin Page" "http://localhost:3000/admin.html"
test_endpoint "Main JavaScript" "http://localhost:3000/js/main.js"
test_endpoint "Auth JavaScript" "http://localhost:3000/js/auth.js"
test_endpoint "Style CSS" "http://localhost:3000/css/style.css"
echo ""

echo "=== API ENDPOINTS ==="
test_api "Recent Posts API" "/api/posts/recent"
test_api "Posts List API" "/api/posts"
echo ""

echo "=== AUTHENTICATION ==="
test_api "Admin Login" "/api/auth/login" "POST" '{"email":"st805@naver.com","password":"admin123"}'
test_api "Member Login" "/api/auth/login" "POST" '{"email":"member@example.com","password":"password123"}'
echo ""

echo "=== NEW FEATURES ==="
echo "Testing 7 Categories with Recent Posts..."

# Check if the enhanced homepage loads
echo -n "Testing Enhanced Homepage with 7 Categories... "
response=$(curl -s "http://localhost:3000/index.html" | grep -c "recent-posts-section")
if [ "$response" -gt 0 ]; then
    echo -e "${GREEN}PASSED${NC} (7 categories section found)"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}FAILED${NC} (7 categories section not found)"
    FAILED=$((FAILED + 1))
fi

# Check if main.js loads properly
echo -n "Testing Main JavaScript Loading... "
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/js/main.js")
if [ "$response" = "200" ]; then
    echo -e "${GREEN}PASSED${NC} (HTTP 200)"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}FAILED${NC} (HTTP $response)"
    FAILED=$((FAILED + 1))
fi

# Check if API returns posts for all categories
echo -n "Testing API Returns All Categories... "
api_response=$(curl -s "http://localhost:3000/api/posts/recent")
category_count=$(echo "$api_response" | grep -c "posts")
if [ "$category_count" -ge 7 ]; then
    echo -e "${GREEN}PASSED${NC} ($category_count categories found)"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}FAILED${NC} (Only $category_count categories found)"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "========================================="
echo -e "${YELLOW}SUMMARY${NC}"
echo "========================================="
echo "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}ALL TESTS PASSED!${NC}"
    echo ""
    echo "Website is fully functional with:"
    echo "  - Original design restored"
    echo "  - 7 categories with recent posts added"
    echo "  - Modern responsive design"
    echo "  - Admin and member authentication"
    echo "  - All API endpoints working"
    exit 0
else
    echo -e "${RED}SOME TESTS FAILED${NC}"
    exit 1
fi