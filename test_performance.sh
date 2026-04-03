#!/bin/bash

echo "=== PERFORMANCE TESTING ==="
echo "=========================="
echo ""

echo "TEST 1: Page Load Time Analysis"
echo "--------------------------------"
PAGES=(
  "/"
  "/index.html"
  "/church.html"
  "/empire.html"
  "/admin-new.html"
)

echo "Testing page load times..."
echo "------------------------"

for page in "${PAGES[@]}"
do
    METRICS=$(curl -s -w "\nTTFB:%{time_starttransfer}\nTotal:%{time_total}\n" \
      -o /dev/null http://localhost:3000$page 2>/dev/null)
    
    TTFB=$(echo "$METRICS" | grep "TTFB" | cut -d: -f2)
    TOTAL=$(echo "$METRICS" | grep "Total" | cut -d: -f2)
    
    # Convert to milliseconds for display
    TTFB_MS=$(echo "$TTFB * 1000" | bc)
    TOTAL_MS=$(echo "$TOTAL * 1000" | bc)
    
    printf "%-20s TTFB: %6.0fms  Total: %6.0fms\n" "$page" "$TTFB_MS" "$TOTAL_MS"
    
    # Check performance thresholds
    if (( $(echo "$TOTAL_MS < 1000" | bc -l) )); then
        echo "  ✓ Excellent (< 1 second)"
    elif (( $(echo "$TOTAL_MS < 3000" | bc -l) )); then
        echo "  ✓ Good (< 3 seconds)"
    else
        echo "  ⚠ Slow (> 3 seconds)"
    fi
    echo ""
done

echo "TEST 2: Resource Loading Analysis"
echo "---------------------------------"
echo "Checking critical resources..."

# Check CSS file
CSS_RESPONSE=$(curl -s -w "\nSize:%{size_download}\nTime:%{time_total}\n" \
  -o /dev/null http://localhost:3000/css/styles.css 2>/dev/null)

CSS_SIZE=$(echo "$CSS_RESPONSE" | grep "Size" | cut -d: -f2)
CSS_TIME=$(echo "$CSS_RESPONSE" | grep "Time" | cut -d: -f2)
CSS_TIME_MS=$(echo "$CSS_TIME * 1000" | bc)

printf "CSS File Size: %d bytes\n" "$CSS_SIZE"
printf "Load Time: %.0fms\n" "$CSS_TIME_MS"

if [ "$CSS_SIZE" -lt 100000 ]; then
    echo "  ✓ CSS size optimized (< 100KB)"
else
    echo "  ⚠ CSS file large (> 100KB)"
fi
echo ""

# Check JavaScript files
JS_RESPONSE=$(curl -s -w "\nSize:%{size_download}\nTime:%{time_total}\n" \
  -o /dev/null http://localhost:3000/js/pro-editor.js 2>/dev/null)

JS_SIZE=$(echo "$JS_RESPONSE" | grep "Size" | cut -d: -f2)
JS_TIME=$(echo "$JS_RESPONSE" | grep "Time" | cut -d: -f2)
JS_TIME_MS=$(echo "$JS_TIME * 1000" | bc)

printf "Pro Editor JS Size: %d bytes\n" "$JS_SIZE"
printf "Load Time: %.0fms\n" "$JS_TIME_MS"

if [ "$JS_SIZE" -lt 50000 ]; then
    echo "  ✓ JS size optimized (< 50KB)"
else
    echo "  ⚠ JS file could be minified"
fi
echo ""

echo "TEST 3: Connection Pooling & Keep-Alive"
echo "---------------------------------------"
CONNECTION_TEST=$(curl -s -I http://localhost:3000 2>/dev/null | grep -i "keep-alive")
if [ ! -z "$CONNECTION_TEST" ]; then
    echo "✓ Keep-Alive connections enabled"
else
    echo "Note: Connection pooling not detected"
fi
echo ""

echo "TEST 4: Caching Configuration"
echo "-----------------------------"
CACHE_CHECK=$(curl -s -I http://localhost:3000/css/styles.css 2>/dev/null | grep -i "cache-control")
if [ ! -z "$CACHE_CHECK" ]; then
    echo "✓ Cache headers present"
    echo "  $CACHE_CHECK"
else
    echo "⚠ Cache headers not configured"
fi
echo ""

echo "TEST 5: Concurrent Request Handling"
echo "------------------------------------"
echo "Testing 10 concurrent requests..."
START_TIME=$(date +%s.%N)

for i in {1..10}; do
    curl -s http://localhost:3000/ > /dev/null 2>&1 &
done
wait

END_TIME=$(date +%s.%N)
ELAPSED=$(echo "$END_TIME - $START_TIME" | bc)
ELAPSED_MS=$(echo "$ELAPSED * 1000" | bc)

printf "Total time for 10 requests: %.0fms\n" "$ELAPSED_MS"
AVG_MS=$(echo "$ELAPSED_MS / 10" | bc)
printf "Average per request: %.0fms\n" "$AVG_MS"
echo ""

echo "TEST 6: Memory & CPU Usage (Server Process)"
echo "-------------------------------------------"
if command -v ps &> /dev/null; then
    PID=$(lsof -ti:3000 2>/dev/null)
    if [ ! -z "$PID" ]; then
        MEMORY=$(ps -o rss= -p "$PID" 2>/dev/null || echo "0")
        CPU=$(ps -o %cpu= -p "$PID" 2>/dev/null || echo "0")
        
        printf "Server PID: %s\n" "$PID"
        printf "Memory Usage: %s KB\n" "$MEMORY"
        printf "CPU Usage: %s%%\n" "$CPU"
        
        # Convert memory to MB
        MEMORY_MB=$((MEMORY / 1024))
        if [ "$MEMORY_MB" -lt 500 ]; then
            echo "  ✓ Memory usage acceptable (< 500MB)"
        else
            echo "  ⚠ High memory usage (> 500MB)"
        fi
    else
        echo "Note: Could not determine server PID"
    fi
fi
echo ""

echo "TEST 7: Compression Support"
echo "---------------------------"
GZIP_CHECK=$(curl -s -H "Accept-Encoding: gzip" -I http://localhost:3000/ 2>/dev/null | grep -i "content-encoding")
if [ ! -z "$GZIP_CHECK" ]; then
    echo "✓ Gzip compression enabled"
else
    echo "⚠ Gzip compression not detected"
fi
echo ""

echo "=== PERFORMANCE TESTING COMPLETE ==="
echo ""
