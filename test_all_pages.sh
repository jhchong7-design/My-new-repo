#!/bin/bash

# Test All Webpages Script
# Verifies all pages are functional and responding correctly

echo "========================================="
echo "BIBLE WEBSITE - ALL PAGES TEST"
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
test_page() {
    local name="$1"
    local url="$2"
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✓${NC} (HTTP 200)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗${NC} (HTTP $response)"
        FAILED=$((FAILED + 1))
    fi
}

# Test API function
test_api() {
    local name="$1"
    local endpoint="$2"
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$endpoint")
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✓${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗${NC} (HTTP $response)"
        FAILED=$((FAILED + 1))
    fi
}

echo "=== MAIN PAGES ==="
test_page "Homepage" "http://localhost:3000/index.html"
test_page "About Page" "http://localhost:3000/about.html"
test_page "Korean Thought" "http://localhost:3000/korean-thought.html"
test_page "World Thought" "http://localhost:3000/world-thought.html"
test_page "Publications" "http://localhost:3000/publications.html"
test_page "Forum" "http://localhost:3000/forum.html"
echo ""

echo "=== AUTHENTICATION PAGES ==="
test_page "Login Page" "http://localhost:3000/login.html"
test_page "Register Page" "http://localhost:3000/register.html"
test_page "Profile Page" "http://localhost:3000/profile.html"
test_page "Admin Panel" "http://localhost:3000/admin.html"
test_page "Post View" "http://localhost:3000/post.html?id=1"
echo ""

echo "=== JAVASCRIPT FILES ==="
test_page "Main JavaScript" "http://localhost:3000/js/main.js"
test_page "Category JavaScript" "http://localhost:3000/js/category.js"
test_page "Auth JavaScript" "http://localhost:3000/js/auth.js"
test_page "Social JavaScript" "http://localhost:3000/js/social.js"
test_page "Admin Editor JavaScript" "http://localhost:3000/js/admin-editor.js"
echo ""

echo "=== CSS FILES ==="
test_page "Main CSS" "http://localhost:3000/css/style.css"
test_page "Auth CSS" "http://localhost:3000/css/auth.css"
test_page "Social CSS" "http://localhost:3000/css/social.css"
test_page "Admin Editor CSS" "http://localhost:3000/css/admin-editor.css"
echo ""

echo "=== API ENDPOINTS ==="
test_api "Recent Posts" "/api/posts/recent"
test_api "All Posts" "/api/posts"
echo ""

echo "=== TEST PAGES ==="
test_page "Loading Test" "http://localhost:3000/test-loading.html"
echo ""

echo "========================================="
echo -e "${YELLOW}SUMMARY${NC}"
echo "========================================="
echo "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    echo ""
    echo "All webpages are functional and working correctly!"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    exit 1
fi