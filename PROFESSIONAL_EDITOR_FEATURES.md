# Professional Editor (Pro Editor) - Technical Features Documentation

## Overview
The Pro Editor is an advanced, block-based inline editing system designed for seamless content management on the 시온산교회 website. Built with modern web technologies and industry best practices, it provides WordPress Gutenberg-style editing in a custom, lightweight implementation.

---

## 🏗️ Architecture

### Core Components

**1. ProEditor Class**
The main editor controller that manages:
- Editor state (edit mode, preview mode, authentication)
- Block management and tracking
- Auto-save operations
- Version history
- API communications
- Event handling

**2. Block System**
Each content element is wrapped as an editable block:
- Unique block IDs for tracking
- Drag handles for reordering
- Action buttons (edit, move, delete)
- Content type detection (text, heading, image, etc.)
- Auto-save triggers

**3. UI Overlay**
Dynamic interface elements:
- Floating editor button
- Block action controllers
- Save status indicators
- Preview mode toggle
- Rich text editor modal

---

## ✨ Key Features

### 1. Block-Based Editing
**Concept:** Similar to WordPress Gutenberg, content is organized into discrete blocks

**Implementation:**
```javascript
class ProEditor {
    makeBlocksEditable() {
        // Wraps elements in editable blocks
        const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div, section, article');
        elements.forEach((element, index) => {
            const block = this.createEditableBlock(element, index);
            element.replaceWith(block);
        });
    }
}
```

**Benefits:**
- Precise content control
- Easy reordering
- Individual block actions
- Consistent structure
- Scalable architecture

### 2. Floating Editor Button
**Position:** Fixed at bottom-right (120px from bottom, 20px from right)

**Features:**
- Always accessible
- Visual hover states
- Active state indicator
- Smooth animations
- Click to toggle edit mode

**CSS:**
```css
.float-editor-btn {
    position: fixed;
    bottom: 120px;
    right: 20px;
    z-index: 9999;
    /* Additional styling... */
}
```

### 3. Drag-and-Drop Reordering
**Implementation:** Uses native HTML5 Drag and Drop API

**Features:**
- Visual drag indicators
- Real-time position feedback
- Smooth animations
- Touch support (for mobile)
- Auto-scroll detection

**Code Structure:**
```javascript
enableDragAndDrop() {
    const blocks = document.querySelectorAll('.editable-block');
    blocks.forEach(block => {
        block.setAttribute('draggable', 'true');
        block.addEventListener('dragstart', this.handleDragStart);
        block.addEventListener('dragover', this.handleDragOver);
        block.addEventListener('drop', this.handleDrop);
        block.addEventListener('dragend', this.handleDragEnd);
    });
}
```

### 4. Auto-Save Functionality
**Mechanism:** Debounced save with visual feedback

**Configuration:**
- Save delay: 2 seconds after last change
- Visual indicator: "Saving..." → Green checkmark
- Auto-retry: Up to 3 attempts on failure
- Conflict detection: Version checking

**Implementation:**
```javascript
scheduleAutoSave() {
    if (this.autoSaveTimer) {
        clearTimeout(this.autoSaveTimer);
    }
    
    this.autoSaveTimer = setTimeout(() => {
        this.saveChanges();
    }, 2000); // 2 seconds
}

async saveChanges() {
    try {
        const content = this.extractContent();
        await fetch(`${this.apiBase}/content/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify({
                page: this.currentPage,
                content: content
            })
        });
        this.showSaveIndicator(true);
    } catch (error) {
        this.showSaveIndicator(false);
    }
}
```

### 5. Preview Mode
**Purpose:** View content as visitors see it, without edit controls

**Features:**
- Clean, uncluttered view
- Toggle on/off
- Persistent state during session
- Auto-exit when leaving page

**Implementation:**
```javascript
togglePreviewMode() {
    this.isPreviewMode = !this.isPreviewMode;
    const blocks = document.querySelectorAll('.editable-block');
    
    blocks.forEach(block => {
        if (this.isPreviewMode) {
            block.classList.add('preview-active');
            block.classList.remove('edit-active');
        } else {
            block.classList.add('edit-active');
            block.classList.remove('preview-active');
        }
    });
}
```

### 6. Keyboard Shortcuts
**Supported Shortcuts:**
- `Ctrl+S` / `Cmd+S`: Force save immediately
- `Escape`: Exit edit mode
- `Ctrl+Z` / `Cmd+Z`: Undo last change
- `Ctrl+Y` / `Cmd+Shift+Z`: Redo undone change

**Implementation:**
```javascript
setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 's':
                    e.preventDefault();
                    this.saveChanges();
                    break;
                case 'z':
                    e.preventDefault();
                    this.undo();
                    break;
                case 'y':
                    e.preventDefault();
                    this.redo();
                    break;
            }
        } else if (e.key === 'Escape') {
            this.exitEditMode();
        }
    });
}
```

### 7. Rich Text Editor Integration
**Built-in:** TinyMCE WYSIWYG Editor

**Features:**
- Bold, italic, underline
- Headings (H1-H6)
- Lists (ordered, unordered)
- Links and anchors
- Image insertion
- Table creation
- Code formatting
- Color and font controls

**Configuration:**
```javascript
tinymce.init({
    selector: '.rich-text-editor',
    plugins: 'link image table code',
    toolbar: 'bold italic | link image | undo redo',
    height: 300,
    width: '100%'
});
```

### 8. Version History
**Purpose:** Track all changes made to content

**Features:**
- Automatic snapshot on save
- Version comparison
- Restore previous versions
- User attribution
- Timestamp tracking

**Data Structure:**
```javascript
{
    versionId: 'v1.2.3',
    timestamp: '2026-04-02T06:30:00Z',
    author: 'st805@naver.com',
    changes: [{ blockId: 'block-1', oldValue: '...', newValue: '...' }]
}
```

### 9. Authentication Integration
**Method:** JWT Token-based authentication

**Flow:**
1. User clicks editor button
2. Check for valid token in localStorage
3. If no token, prompt for login
4. Validate credentials via API
5. Store JWT token
6. Use token for all API requests

**API Calls:**
```javascript
async login(usernameOrEmail, password) {
    const response = await fetch(`${this.apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, password })
    });
    
    const data = await response.json();
    
    if (data.token) {
        localStorage.setItem('token', data.token);
        this.token = data.token;
        return true;
    }
    
    return false;
}
```

---

## 🎨 User Interface

### Editor Button
- **Icon:** Pencil/edit icon
- **Position:** Bottom-right, 120px from bottom, 20px from right
- **States:** Default, hover, active
- **Animation:** Smooth scale on hover, bounce on click

### Block Controls
**When in edit mode, each block shows:**
- Drag handle (left side, grip icon)
- Edit button (pencil icon)
- Move up button (up arrow)
- Move down button (down arrow)
- Delete button (trash icon)

**Positioning:**
- Action buttons appear on block hover
- Controls fade in/out smoothly
- Mobile-friendly touch targets

### Save Status Indicator
**Location:** Top-right corner of page

**States:**
1. **Idle:** No indicator
2. **Pending:** "Saving..." with spinner
3. **Success:** Green checkmark
4. **Error:** Red "Save Failed" message

### Preview Toggle
**Location:** Top-left of main content area

**Behavior:**
- Shows current mode (Edit/Preview)
- Click to toggle
- Smooth transition between modes

---

## 🔧 Technical Implementation

### File Structure
```
mzchurch/public/
├── admin-new.html          # Professional admin dashboard
├── js/
│   ├── pro-editor.js       # Main editor logic (27KB)
│   └── app.js              # Authentication and utilities
└── index.html (and others) # Content pages with editor
```

### Dependencies
**No external dependencies required for pro-editor.js:**
- Vanilla JavaScript (ES6+)
- Native HTML5 APIs
- CSS3 animations

**Optional Rich Text Editor:**
- TinyMCE (CDN)
- Can be replaced with any WYSIWYG editor

### Browser Support
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Performance Optimizations
1. **Debounced Auto-Save:** Prevents excessive API calls
2. **Event Delegation:** Single event listener for multiple blocks
3. **Efficient DOM Manipulation:** Minimal reflows and repaints
4. **Lazy Loading:** Rich text editor loads only when needed
5. **Image Optimization:** Thumbnail generation for media library

---

## 📊 API Integration

### Authentication Endpoints
```javascript
POST /api/auth/login
Request: { usernameOrEmail, password }
Response: { token, user: { id, email, role } }

POST /api/auth/refresh
Request: { token }
Response: { token }

POST /api/auth/logout
Request: { token }
Response: { success: true }
```

### Content Endpoints
```javascript
GET /api/content/:page
Response: { page, content, version, lastModified }

POST /api/content/save
Request: { page, content, version }
Response: { success, version, savedAt }

GET /api/content/versions/:page
Response: { versions: [ { versionId, timestamp, author } ] }

POST /api/content/restore
Request: { page, versionId }
Response: { success, content }
```

### Media Endpoints
```javascript
POST /api/media/upload
Request: FormData with file
Response: { url, altText, metadata }

GET /api/media/library
Response: { files: [ { id, url, type, size } ] }

DELETE /api/media/:id
Request: { id }
Response: { success }
```

---

## 🔄 State Management

### Editor States
```javascript
{
    isEditMode: boolean,           // Currently editing?
    isPreviewMode: boolean,        // Preview mode active?
    isAuthenticated: boolean,      // User logged in?
    token: string,                 // JWT auth token
    currentPage: string,           // Current page identifier
    editableBlocks: Array<string>, // List of block IDs
    autoSaveTimer: number,         // Debounce timer ID
    versionHistory: Array<object>  // Version snapshots
}
```

### Block State
Each block maintains:
```javascript
{
    blockId: string,           // Unique identifier
    originalContent: string,   // Content before edits
    currentContent: string,    // Current content
    hasChanges: boolean,       // Unsaved changes?
    contentType: string        // 'text', 'heading', 'image', etc.
}
```

---

## 🛡️ Security Features

### Authentication
- JWT token validation
- Token refresh mechanism
- Secure HTTP-only cookies (optional)
- CSRF protection

### Authorization
- Role-based access control
- Page-level permissions
- User capability checks
- Admin-only operations

### Data Protection
- Input sanitization
- XSS prevention
- SQL injection prevention
- Content validation

### Audit Logging
- Track all content changes
- User attribution
- Timestamp logging
- IP address tracking

---

## 📱 Mobile Optimization

### Touch-Friendly Controls
- Large tap targets (min 44x44px)
- Touch gestures for drag-and-drop
- Swipe actions for mobile menus
- On-screen keyboard handling

### Responsive Layout
- Sidebar collapses on mobile
- Dashboard adapts to screen size
- Touch-optimized editor controls
- Mobile-specific preview mode

### Performance
- Reduced API calls on mobile
- Optimized images for mobile
- Lazy loading of components
- Efficient touch event handling

---

## 🚀 Future Enhancements

### Planned Features
1. **Real-time Collaboration**
   - Multi-user editing
   - Live cursors
   - Conflict resolution
   - Presence indicators

2. **Advanced SEO Tools**
   - Meta tag management
   - Sitemap generation
   - Schema.org markup
   - Page speed analysis

3. **Analytics Dashboard**
   - Page views tracking
   - User behavior analytics
   - Content performance metrics
   - A/B testing

4. **Form Builder**
   - Drag-and-drop form creation
   - Field validation
   - Spam protection
   - Email notifications

5. **Media Management**
   - Image editing
   - Video transcoding
   - CDN integration
   - Batch operations

---

## 📚 Code Examples

### Basic Usage
```javascript
// Initialize editor
const editor = new ProEditor();

// Enter edit mode
editor.toggleEditMode();

// Manual save
editor.saveChanges();

// Exit edit mode
editor.toggleEditMode();
```

### Custom Configuration
```javascript
const editor = new ProEditor({
    apiBase: '/api/v2',
    autoSaveDelay: 3000,
    enableDragAndDrop: true,
    enableVersionHistory: true,
    saveIndicatorPosition: 'top-right',
    theme: 'dark'
});
```

### Event Handling
```javascript
editor.on('save', (data) => {
    console.log('Content saved:', data);
});

editor.on('error', (error) => {
    console.error('Editor error:', error);
});

editor.on('mode-change', (mode) => {
    console.log('Mode changed to:', mode);
});
```

---

## 🐛 Debugging

### Console Logging
Enable detailed logging:
```javascript
window.debugProEditor = true;
```

### Common Issues

**Issue:** Blocks not becoming editable
```javascript
// Check if editor is initialized
if (!window.proEditor) {
    console.error('Editor not initialized');
}
```

**Issue:** Auto-save not triggering
```javascript
// Check timer
console.log('Auto-save timer:', window.proEditor.autoSaveTimer);
```

**Issue:** Authentication failing
```javascript
// Check token
console.log('Token:', localStorage.getItem('token'));
```

---

## 📖 References

### Inspiration Sources
- WordPress Gutenberg Editor
- Craft CMS
- Contentful
- Webflow Editor
- TinyMCE

### Design Patterns
- Block-based content editing
- Event-driven architecture
- State management pattern
- Observer pattern for notifications
- Strategy pattern for different content types

---

**Document Version:** 1.0  
**Last Updated:** April 2, 2026  
**Maintainer:** 시온산교회 Technical Team