#!/bin/bash

echo "=== CODE QUALITY TESTING ==="
echo "============================"
echo ""

echo "TEST 1: JavaScript Syntax Validation"
echo "------------------------------------"
if command -v node &> /dev/null; then
    echo "Using Node.js for syntax validation..."
    
    if node -c public/js/pro-editor.js 2>&1; then
        echo "✓ pro-editor.js: Valid syntax"
    else
        echo "✗ pro-editor.js: Syntax errors found"
    fi
    
    if node -c public/js/app.js 2>&1; then
        echo "✓ app.js: Valid syntax"
    else
        echo "✗ app.js: Syntax errors found"
    fi
else
    echo "Node.js not available for syntax validation"
fi
echo ""

echo "TEST 2: Code Structure Analysis"
echo "------------------------------"
if grep -q "class ProEditor" public/js/pro-editor.js; then
    echo "✓ ProEditor class defined"
fi

if grep -q "constructor()" public/js/pro-editor.js; then
    echo "✓ Constructor defined"
fi

METHODS=("toggleEditMode" "makeBlocksEditable" "saveChanges" "togglePreviewMode")
for method in "${METHODS[@]}"; do
    if grep -q "$method" public/js/pro-editor.js; then
        echo "✓ Method '$method' found"
    fi
done
echo ""

echo "TEST 3: Error Handling Analysis"
echo "--------------------------------"
TRY_CATCH_COUNT=$(grep -c "catch" public/js/pro-editor.js 2>/dev/null || echo "0")
echo "Error handling blocks found: $TRY_CATCH_COUNT"

if grep -q "console.error" public/js/pro-editor.js; then
    echo "✓ Error logging implemented"
fi

if grep -q "alert\|showAlert\|notify" public/js/pro-editor.js; then
    echo "✓ User notification system present"
fi
echo ""

echo "TEST 4: Security Checks"
echo "----------------------"
if grep -q "innerHTML" public/js/pro-editor.js; then
    INNERHTML_COUNT=$(grep -c "innerHTML" public/js/pro-editor.js)
    echo "Note: innerHTML usage detected ($INNERHTML_COUNT times) - verify XSS protection"
fi

if grep -q "eval(" public/js/pro-editor.js; then
    echo "✗ WARNING: eval() usage detected (security risk)"
else
    echo "✓ No eval() usage"
fi

if grep -q 'onclick=' public/js/pro-editor.js; then
    echo "⚠ Note: Inline event handlers detected"
else
    echo "✓ No inline event handlers"
fi
echo ""

echo "TEST 5: Performance Indicators"
echo "------------------------------"
if grep -q "addEventListener" public/js/pro-editor.js; then
    EVENT_LISTENER_COUNT=$(grep -c "addEventListener" public/js/pro-editor.js)
    echo "✓ Event listeners: $EVENT_LISTENER_COUNT"
fi

if grep -q "setTimeout\|setInterval" public/js/pro-editor.js; then
    echo "✓ Timer usage for async operations"
fi

if grep -q "debounce\|throttle\|clearTimeout" public/js/pro-editor.js; then
    echo "✓ Performance optimization (debounce/throttle) present"
fi
echo ""

echo "TEST 6: Code Size Analysis"
echo "--------------------------"
PRO_SIZE=$(wc -c < public/js/pro-editor.js)
APP_SIZE=$(wc -c < public/js/app.js)
echo "pro-editor.js: $PRO_SIZE bytes"
echo "app.js: $APP_SIZE bytes"
echo ""

echo "=== CODE QUALITY TESTING COMPLETE ==="
echo ""
