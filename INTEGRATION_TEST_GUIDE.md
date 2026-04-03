# Pro Editor Integration Test Guide

## Overview
This document provides comprehensive testing instructions for the newly integrated professional editor system (pro-editor.js) across all pages of the 시온산교회 website.

## What Was Integrated

### 1. Pro Editor System (pro-editor.js)
The new professional editor includes:
- **Block-based content editing** - Similar to WordPress Gutenberg
- **Floating editor button** - Positioned at bottom-right (120px from bottom)
- **Drag-and-drop reordering** - Rearrange content blocks easily
- **Auto-save functionality** - Saves changes every 2 seconds automatically
- **Preview mode** - Toggle between edit and preview modes
- **Keyboard shortcuts** - Ctrl+S (save), Escape (exit), Ctrl+Z (undo), Ctrl+Y (redo)
- **Version history** - Track changes over time
- **Visual feedback** - Save indicators and notifications

### 2. Pages Updated
The following pages have been updated to use pro-editor.js:
- ✅ index.html (Homepage)
- ✅ church.html (About)
- ✅ empire.html (Empire)
- ✅ books.html (Books)
- ✅ notices.html (Notices)
- ✅ board.html (Board)
- ✅ gallery.html (Gallery)
- ✅ operator.html (Operator)

### 3. Admin Dashboard
New professional admin dashboard created:
- ✅ admin-new.html - Modern dashboard interface with:
  - Sidebar navigation
  - Dashboard statistics
  - Content management
  - Dark/light mode toggle
  - TinyMCE integration
  - Responsive design

## Test Plan

### Phase 1: Authentication Testing
1. Navigate to https://00too.app.super.myninja.ai
2. Click the pencil/edit button in the bottom-right
3. Login with admin credentials:
   - Email: st805@naver.com
   - Password: #9725
4. Verify successful authentication
5. Check that the edit mode is activated

### Phase 2: Editor Button Positioning
1. Verify the pencil/edit button appears at bottom-right
2. Check positioning: 120px from bottom, 20px from right
3. Ensure button is visible and clickable
4. Verify button appears on all pages

### Phase 3: Inline Editing Feature Testing
1. Click the pencil button to enter edit mode
2. Observe that content blocks become editable
3. Try editing text content:
   - Click on any text element
   - Modify the content
   - Observe auto-save indicator (green checkmark)
4. Wait for 2 seconds to see auto-save visual feedback

### Phase 4: Block Actions Testing
1. In edit mode, look for block action buttons (edit, move up/down, delete)
2. Test "Move Up" - Block should move above the previous one
3. Test "Move Down" - Block should move below the next one
4. Test "Delete" - Block should be removed with confirmation
5. Verify action buttons are visible and functional

### Phase 5: Drag-and-Drop Testing
1. Look for drag handles on blocks (grip icon or handle)
2. Click and drag a block to a new position
3. Release the block and verify it's in the new position
4. Check that the order is saved correctly

### Phase 6: Keyboard Shortcuts Testing
1. Press Ctrl+S (or Cmd+S on Mac) - Should save changes
2. Press Escape - Should exit edit mode
3. Press Ctrl+Z - Should undo last change
4. Press Ctrl+Y (or Ctrl+Shift+Z) - Should redo undone change

### Phase 7: Preview Mode Testing
1. In edit mode, look for preview toggle button
2. Click to switch to preview mode
3. Verify the page displays without edit controls
4. Click to return to edit mode
5. Verify edit controls reappear

### Phase 8: Admin Dashboard Testing
1. Navigate to https://00too.app.super.myninja.ai/admin-new.html
2. Login with admin credentials if prompted
3. Verify sidebar navigation is visible
4. Test sidebar menu items:
   - Dashboard
   - Content
   - Media
   - Pages
   - Settings
5. Check dashboard statistics cards
6. Test dark/light mode toggle
7. Verify responsive design on mobile devices

### Phase 9: Auto-Save Testing
1. Make changes to content
2. Observe the save status indicator
3. Wait 2 seconds - should see "Saving..." then green checkmark
4. Check browser console for save confirmations
5. Refresh the page - changes should persist

### Phase 10: Cross-Page Consistency
1. Test editing on each page
2. Verify editor works consistently across all pages
3. Check that positioning is consistent
4. Test auto-save on each page

## Expected Behavior

### When Not Logged In:
- Pencil button should be visible
- Clicking prompts login
- No editing capabilities
- Content is read-only

### When Logged In (Edit Mode):
- Pencil button shows active state
- Content blocks become editable
- Drag handles appear on blocks
- Action buttons visible (move, delete)
- Auto-save indicator shows saving status
- Visual feedback on hover and selection

### When Logged In (Preview Mode):
- Content displays without edit controls
- Clean view similar to regular visitors
- Button to return to edit mode visible

## Troubleshooting

### Issue: Editor button not appearing
**Solution:**
- Check browser console for errors
- Verify pro-editor.js loaded correctly
- Check JavaScript is enabled
- Clear browser cache and reload

### Issue: Auto-save not working
**Solution:**
- Check network tab for API calls
- Verify authentication token is valid
- Check server logs for errors
- Ensure /api/content endpoints are accessible

### Issue: Drag-and-drop not working
**Solution:**
- Click the drag handle (not the block content)
- Ensure you're in edit mode
- Check for JavaScript errors in console
- Try on a different browser

### Issue: Changes not persisting
**Solution:**
- Wait for auto-save to complete
- Verify green checkmark appears
- Check browser local storage for token
- Check server logs for save operations
- Ensure user has write permissions

## Browser Console Checks

Open browser console (F12) and look for:

### Success Messages:
```
✓ Pro Editor initialized
✓ Edit mode activated
✓ Content saved successfully
✓ Block actions ready
```

### Error Messages to Watch For:
```
✗ Failed to load pro-editor.js
✗ Authentication error
✗ Save operation failed
✗ Network error
```

## Performance Checks

Monitor the following:
- Page load time should be < 3 seconds
- Auto-save completes within 500ms
- No noticeable lag when editing
- Smooth animations and transitions

## Mobile Testing

Test on mobile devices:
- Editor button accessible on touch
- Drag-and-drop works with touch
- Responsive layout adapts correctly
- Text editing is functional on mobile keyboard

## Success Criteria

The integration is considered successful when:
- ✅ All 8 pages load pro-editor.js without errors
- ✅ Editor button appears correctly on all pages
- ✅ Authentication works on all pages
- ✅ Inline editing is functional on all editable content
- ✅ Auto-save works consistently
- ✅ Drag-and-drop reordering works
- ✅ Keyboard shortcuts work as expected
- ✅ Preview mode toggles correctly
- ✅ Admin dashboard loads and functions
- ✅ Dark/light mode toggle works
- ✅ Mobile responsive design works

## Next Steps After Testing

If all tests pass:
1. Document any minor issues found
2. Consider user feedback for improvements
3. Plan Phase 5 features (SEO, analytics, etc.)
4. Create user documentation for administrators

If tests fail:
1. Document specific failures
2. Check server logs for errors
3. Review browser console output
4. Fix identified issues and retest

---
**Note:** This is the first major integration of the professional editor system. Comprehensive testing is essential to ensure all features work correctly before deploying to production.