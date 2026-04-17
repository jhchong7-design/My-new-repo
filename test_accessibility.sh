#!/bin/bash

echo "=== ACCESSIBILITY TESTING ==="
echo "============================="
echo ""

echo "TEST 1: Semantic HTML Structure"
echo "-------------------------------"
# Check for semantic HTML5 elements
SEMANTIC_ELEMENTS=("header" "nav" "main" "section" "article" "aside" "footer")

echo "Checking semantic HTML elements in index.html..."
for element in "${SEMANTIC_ELEMENTS[@]}"; do
    COUNT=$(grep -c "<$element" public/index.html 2>/dev/null || echo "0")
    if [ "$COUNT" -gt 0 ]; then
        echo "✓ <$element> elements used: $COUNT"
    else
        echo "Note: <$element> not found"
    fi
done
echo ""

echo "TEST 2: Image Alt Text"
echo "---------------------"
IMAGE_COUNT=$(grep -c "<img" public/index.html 2>/dev/null || echo "0")
ALT_COUNT=$(grep -c "alt=" public/index.html 2>/dev/null || echo "0")

echo "Images found: $IMAGE_COUNT"
echo "Images with alt text: $ALT_COUNT"

if [ "$IMAGE_COUNT" -eq "$ALT_COUNT" ] && [ "$IMAGE_COUNT" -gt 0 ]; then
    echo "✓ All images have alt text"
elif [ "$IMAGE_COUNT" -eq 0 ]; then
    echo "Note: No images found"
else
    echo "⚠ Some images missing alt text"
fi
echo ""

echo "TEST 3: Heading Structure"
echo "-------------------------"
for i in {1..6}; do
    COUNT=$(grep -c "<h$i\|<H$i" public/index.html 2>/dev/null || echo "0")
    if [ "$COUNT" -gt 0 ]; then
        echo "H$i headings: $COUNT"
    fi
done
echo ""

echo "TEST 4: Form Accessibility"
echo "-------------------------"
# Check for labels on form inputs
if grep -q "<input" public/index.html; then
    INPUT_COUNT=$(grep -c "<input" public/index.html)
    LABEL_COUNT=$(grep -c "<label" public/index.html)
    
    echo "Form inputs: $INPUT_COUNT"
    echo "Labels found: $LABEL_COUNT"
    
    if [ "$LABEL_COUNT" -ge "$INPUT_COUNT" ]; then
        echo "✓ Inputs appear to have labels"
    fi
    
    # Check for required attributes
    if grep -q "required\|aria-required" public/index.html; then
        echo "✓ Required fields marked"
    fi
fi
echo ""

echo "TEST 5: Color Contrast (Manual Check Required)"
echo "----------------------------------------------"
echo "⚠ Color contrast ratios require visual testing"
echo "  Tools: WebAIM Contrast Checker, WAVE"
echo "  Target: WCAG 2.1 AA (4.5:1 for normal text)"
echo ""

echo "TEST 6: ARIA Attributes"
echo "----------------------"
# Check for ARIA attributes
ARIA_COUNT=$(grep -c "aria-" public/index.html 2>/dev/null || echo "0")
if [ "$ARIA_COUNT" -gt 0 ]; then
    echo "✓ ARIA attributes used: $ARIA_COUNT"
else
    echo "Note: No ARIA attributes found"
fi

# Check for aria-label on interactive elements
if grep -q 'aria-label=' public/index.html; then
    echo "✓ Interactive elements have aria-labels"
fi
echo ""

echo "TEST 7: Keyboard Navigation Support"
echo "------------------------------------"
# Check for tabindex
if grep -q "tabindex" public/index.html; then
    echo "✓ Tabindex attributes found for keyboard navigation"
fi

# Check for focus states in CSS
if grep -q ":focus" public/css/styles.css; then
    echo "✓ Focus states defined in CSS"
fi
echo ""

echo "TEST 8: Language Declaration"
echo "----------------------------"
if grep -q "lang=" public/index.html; then
    LANG_ATTR=$(grep "lang=" public/index.html | head -1)
    echo "✓ Language attribute found: $LANG_ATTR"
else
    echo "⚠ No language attribute detected"
fi
echo ""

echo "TEST 9: Document Type"
echo "--------------------"
if grep -q "<!DOCTYPE html>" public/index.html; then
    echo "✓ HTML5 doctype declared"
else
    echo "⚠ Doctype not properly declared"
fi
echo ""

echo "TEST 10: Viewport Configuration"
echo "-------------------------------"
if grep -q "viewport" public/index.html; then
    echo "✓ Viewport meta tag present"
    if grep -q "width=device-width" public/index.html; then
        echo "✓ Responsive viewport configured"
    fi
fi
echo ""

echo "=== ACCESSIBILITY TESTING COMPLETE ==="
echo ""
echo "NOTE: Full accessibility testing requires:"
echo "- Screen reader testing (JAWS, NVDA, VoiceOver)"
echo "- Keyboard navigation testing"
echo "- Color contrast analysis"
echo "- WCAG 2.1 compliance validation"
echo "- Automated tools: Axe, WAVE, Lighthouse"
echo ""
