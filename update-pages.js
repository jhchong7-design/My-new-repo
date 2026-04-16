const fs = require('fs');
const path = require('path');

// Files to update (relative to public/)
const koreanPages = [
  'public/index.html',
  'public/about.html',
  'public/korean-thought.html',
  'public/world-thought.html',
  'public/publications.html',
  'public/forum.html'
];

const englishPages = [
  'public/en/index.html',
  'public/en/about.html',
  'public/en/korean-thought.html',
  'public/en/world-thought.html',
  'public/en/publications.html',
  'public/en/forum.html'
];

function updatePage(filePath, isEnglish) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const cssPrefix = isEnglish ? '../' : '';
  const jsPrefix = isEnglish ? '../' : '';

  // 1. Add auth.css after style.css link
  if (!content.includes('auth.css')) {
    content = content.replace(
      /<link rel="stylesheet" href="[^"]*style\.css">/,
      match => `${match}\n  <link rel="stylesheet" href="${cssPrefix}css/auth.css">`
    );
  }

  // 2. Add auth.js after main.js script
  if (!content.includes('auth.js')) {
    content = content.replace(
      /<script src="[^"]*main\.js"><\/script>/,
      match => `${match}\n  <script src="${jsPrefix}js/auth.js"></script>`
    );
  }

  // 3. Add auth-area div in header (before menu-toggle button)
  if (!content.includes('auth-area')) {
    content = content.replace(
      /(<button class="menu-toggle")/,
      `<div class="auth-area"></div>\n\n        $1`
    );
  }

  // 4. Add mobile-auth-area in mobile nav (before lang-mobile div)
  if (!content.includes('mobile-auth-area')) {
    content = content.replace(
      /(<div class="lang-mobile">)/,
      `<div class="mobile-auth-area"></div>\n    $1`
    );
  }

  // 5. Remove the injected ninja script if present (it gets added by deploy)
  content = content.replace(/<script src="https:\/\/sites\.super\.myninja\.ai\/_assets\/ninja-daytona-script\.js"><\/script>\n?/g, '');

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ Updated: ${filePath}`);
}

// Process all pages
koreanPages.forEach(p => updatePage(p, false));
englishPages.forEach(p => updatePage(p, true));

console.log('\n🎉 All pages updated successfully!');