# Admin Frontend Editor Guide

## Overview

The Admin Frontend Editor allows administrators to edit website content directly on the frontend pages without needing to access the backend admin panel. This provides a more intuitive and efficient content management experience.

## Features

### 1. Inline Content Editing

**What you can edit:**
- Section titles
- Paragraph content
- Headings (H1-H6)
- Navigation menu items

**How to use:**
1. Log in as an administrator
2. Click the "✏️ 편집 모드" (Edit Mode) button in the bottom-right corner
3. Click on any editable content (marked with a dashed border on hover)
4. Make your changes directly on the page
5. Click "💾 저장" (Save) to save all changes

### 2. Rich Text Toolbar

When you click on editable content, a rich text toolbar appears with the following options:

- **B** - Make text bold
- *I* - Make text italic
- <u>U</u> - Underline text
- 🔗 - Insert/edit link
- • - Insert unordered list
- 1. - Insert ordered list
- ✕ - Remove formatting

### 3. Image Editor

**Editing Images:**
1. Enable edit mode
2. Click on any image on the page
3. A modal will appear with editing options:
   - Change image URL
   - Edit alt text (for accessibility)
   - Adjust width and height
   - Upload new image from your computer

**Uploading Images:**
- Click "이미지 업로드" in the image editor
- Select an image file from your computer
- Supported formats: JPEG, PNG, GIF, WebP
- Maximum file size: 10MB

### 4. Section Editing

Each section on the page has an edit button that appears when you hover over it in edit mode:

1. Hover over a section
2. Click "✏️ 편집" button
3. Edit the entire section content
4. Save your changes

### 5. Toolbar Actions

The editor toolbar provides the following actions:

- **💾 저장** (Save) - Save all changes to the server
- **❌ 취소** (Cancel) - Cancel all unsaved changes
- **👁️ 미리보기** (Preview) - Preview changes in a new tab

## Getting Started

### Prerequisites

- Admin account with proper permissions
- Web browser (Chrome, Firefox, Safari, Edge)

### Step-by-Step Guide

1. **Login as Admin**
   - Go to the website home page
   - Click "로그인" (Login)
   - Enter your admin credentials
   - Email: `st805@naver.com`
   - Password: `#9725`

2. **Enable Edit Mode**
   - Look for the "✏️ 편집 모드" button in the bottom-right corner
   - Click to activate edit mode
   - The button will turn red and change to "🚫 편집 종료"

3. **Edit Content**
   - Click on any text you want to edit
   - Type your changes
   - Use the rich text toolbar for formatting
   - Edit images by clicking on them

4. **Save Changes**
   - Click "💾 저장" in the toolbar
   - Wait for the success message
   - Changes are now live on the website

5. **Exit Edit Mode**
   - Click "🚫 편집 종료" when done
   - Or click "❌ 취소" to discard changes

## Editing Different Page Types

### Homepage (홈페이지)

**Editable Elements:**
- Hero section title and description
- Welcome message
- Quick link cards
- Recent notices and posts

**Best Practices:**
- Keep hero title concise (ideal: 5-10 words)
- Use clear, welcoming language
- Update event information regularly

### About Pages (운영자소개, 시온산교회, 시온산제국)

**Editable Elements:**
- Page titles
- About text
- Organization descriptions
- Mission statements

**Best Practices:**
- Maintain consistent brand voice
- Use proper formatting for readability
- Include relevant contact information

### Content Pages (책과논문)

**Editable Elements:**
- Book/paper titles
- Author information
- Descriptions
- Publication details

**Best Practices:**
- Format book titles consistently
- Include publication dates
- Add brief summaries

### Community Pages (공지사항, 게시판, 갤러리)

**Editable Elements:**
- Notice titles and content
- Board posts
- Gallery captions
- Category names

**Best Practices:**
- Use clear, descriptive titles
- Format dates consistently
- Add relevant tags or categories

## Advanced Features

### Image Management

**File Upload:**
- Maximum file size: 10MB
- Supported formats: JPEG, PNG, GIF, WebP
- Auto-optimization: Images are automatically compressed

**Image Editing:**
- Adjust dimensions
- Add alt text for SEO
- Replace existing images
- Delete unused images

### Rich Text Formatting

**Text Styles:**
- Bold, italic, underline
- Headings (H1-H6)
- Lists (ordered/unordered)
- Links and anchors

**Best Practices:**
- Use headings hierarchically (H1 → H2 → H3)
- Keep paragraphs short (2-4 sentences)
- Use bold sparingly for emphasis
- Ensure links are descriptive

### Content Organization

**Section Ordering:**
- Drag and drop to reorder sections
- Section order affects page layout
- Changes reflect immediately after save

**Content Blocks:**
- Each section is a content block
- Blocks can be edited independently
- Changes don't affect other sections

## Troubleshooting

### Edit Mode Not Appearing

**Problem:** Edit mode button not visible

**Solutions:**
1. Ensure you're logged in as admin
2. Check browser console for errors
3. Try refreshing the page
4. Clear browser cache and cookies

### Changes Not Saving

**Problem:** Changes disappear after refresh

**Solutions:**
1. Check internet connection
2. Verify server is running
3. Check browser console for error messages
4. Ensure you clicked the save button
5. Check server logs for errors

### Images Not Uploading

**Problem:** Image upload fails

**Solutions:**
1. Check file size (max 10MB)
2. Verify file format (JPEG, PNG, GIF, WebP)
3. Check internet connection
4. Ensure uploads directory is writable
5. Check server error logs

### Rich Text Toolbar Not Working

**Problem:** Formatting buttons not responding

**Solutions:**
1. Click on editable content first
2. Ensure edit mode is active
3. Try refreshing the page
4. Check browser compatibility
5. Disable browser extensions that might interfere

## Browser Compatibility

**Supported Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Mobile Browsers:**
- Chrome Mobile (Android)
- Safari Mobile (iOS)

**Known Limitations:**
- Some older browsers may have limited rich text support
- Mobile editing experience may vary
- Internet Explorer is not supported

## Security Considerations

### Permissions
- Only admin users can access edit mode
- Regular users cannot see edit buttons
- All changes require authentication

### Content Validation
- HTML is sanitized to prevent XSS attacks
- File uploads are validated for type and size
- Malicious scripts are automatically removed

### Session Management
- Edit mode requires active session
- Sessions timeout after inactivity
- Changes are tracked per user session

## Best Practices

### Content Writing
1. **Be Clear:** Write in simple, clear language
2. **Be Concise:** Get to the point quickly
3. **Be Consistent:** Use consistent formatting and style
4. **Be Accurate:** Verify facts before publishing
5. **Be Inclusive:** Use inclusive language

### Visual Design
1. **Use White Space:** Don't overcrowd the page
2. **Good Contrast:** Ensure text is readable
3. **Consistent Branding:** Use brand colors and fonts
4. **Quality Images:** Use high-quality, relevant images
5. **Responsive Design:** Consider mobile users

### Accessibility
1. **Alt Text:** Add descriptions to all images
2. **Headings:** Use proper heading hierarchy
3. **Links:** Use descriptive link text
4. **Colors:** Ensure good color contrast
5. **Fonts:** Use legible font sizes

## API Reference

### Content Management

**GET /api/content/page/:page**
- Get all content for a specific page
- Returns array of content objects

**POST /api/content**
- Create new content
- Requires admin authentication
- Body: `{ title, content, page, order }`

**PUT /api/content/:id**
- Update existing content
- Requires admin authentication
- Body: `{ title, content, page, order }`

### Media Upload

**POST /api/media/upload**
- Upload single media file
- Requires admin authentication
- Max file size: 10MB
- Returns: `{ url, type, title, caption }`

**DELETE /api/media/file/:filename**
- Delete media file
- Requires admin authentication
- Removes file from disk and database

## Keyboard Shortcuts

- **Ctrl/Cmd + B** - Bold text
- **Ctrl/Cmd + I** - Italic text
- **Ctrl/Cmd + U** - Underline text
- **Ctrl/Cmd + S** - Save changes (if implemented)
- **Esc** - Close current editor or modal

## Support

For issues or questions:
1. Check this documentation first
2. Review browser console for errors
3. Contact the development team
4. Check server logs for backend errors

## Version History

- **v1.0.0** - Initial release with inline editing
- **v1.1.0** - Added image upload functionality
- **v1.2.0** - Enhanced rich text editor
- **v1.3.0** - Mobile optimizations

## Future Enhancements

Planned features for future releases:
- Version history and rollback
- Content scheduling
- Multi-language support
- Advanced image editing
- Content templates
- Collaboration features
- Export/Import functionality