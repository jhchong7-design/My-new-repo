#!/usr/bin/env node
/**
 * rewrite_nav.js — Reorganize site nav to put last 3 main-menu items
 * under Open Forum as sub-menu children (Option A).
 *
 * Korean target (public/*.html, except en/):
 *   Main: 홈 | 운영자소개 | 열린마당 ▼
 *   열린마당 dropdown:
 *     한국사상과 성경 ›  (nested submenu with 3 items)
 *     세계사상과 성경 ›  (nested submenu with 3 items)
 *     책과 논문
 *     ─────
 *     공지사항
 *     게시판
 *     이미지 & 동영상
 *
 * English target (public/en/*.html):
 *   Main: Home | About | Open Forum ▼
 *   Open Forum dropdown:
 *     Korean Thought & Bible ›  (nested)
 *     World Thought & Bible ›  (nested)
 *     Publications
 *     ─────
 *     Notices
 *     Board
 *     Media
 */

const fs = require('fs');
const path = require('path');

// ---------------- KOREAN NAV SNIPPETS ----------------

function koreanDesktopNav(activeKey, pathPrefix = '') {
  // pathPrefix is '' for Korean pages in public/ (they link to sibling html files)
  const p = pathPrefix;
  const cls = (key) => activeKey === key ? ' class="active"' : '';
  return `        <nav class="main-nav">
          <ul>
            <li><a href="${p}index.html"${cls('home')}>홈</a></li>
            <li><a href="${p}about.html"${cls('about')}>운영자소개</a></li>
            <li class="has-dropdown">
              <a href="${p}forum.html"${cls('forum')}>열린마당</a>
              <ul class="dropdown">
                <li>
                  <a href="${p}korean-thought.html" class="has-children">한국사상과 성경</a>
                  <ul class="dropdown">
                    <li><a href="${p}korean-thought.html#history">한국 성경 수용사</a></li>
                    <li><a href="${p}korean-thought.html#interpretation">한국적 성경 해석</a></li>
                    <li><a href="${p}korean-thought.html#culture">한국문화와 성경</a></li>
                  </ul>
                </li>
                <li>
                  <a href="${p}world-thought.html" class="has-children">세계사상과 성경</a>
                  <ul class="dropdown">
                    <li><a href="${p}world-thought.html#ancient">고대 근동과 성경</a></li>
                    <li><a href="${p}world-thought.html#modern">현대사상과 성경</a></li>
                    <li><a href="${p}world-thought.html#comparative">비교 연구</a></li>
                  </ul>
                </li>
                <li><a href="${p}publications.html">책과 논문</a></li>
                <li><a href="${p}forum.html#notices">공지사항</a></li>
                <li><a href="${p}forum.html#board">게시판</a></li>
                <li><a href="${p}forum.html#media">이미지 & 동영상</a></li>
              </ul>
            </li>
          </ul>
        </nav>`;
}

function koreanMobileNav(pathPrefix = '', langPaths = null) {
  const p = pathPrefix;
  const lp = langPaths || { kr: `${p}index.html`, en: `${p}en/index.html` };
  return `  <nav class="mobile-nav">
    <div class="mobile-nav-header">
      <h3>성경 사랑방</h3>
      <p>Bible Glocal — bibleglocal.org</p>
    </div>
    <ul>
      <li><a href="${p}index.html">🏠 홈</a></li>
      <li><a href="${p}about.html">👤 운영자소개</a></li>
      <li class="has-submenu">
        <a href="${p}forum.html">💬 열린마당 ▾</a>
        <ul class="sub-menu">
          <li class="has-submenu">
            <a href="${p}korean-thought.html">🇰🇷 한국사상과 성경 ▾</a>
            <ul class="sub-menu">
              <li><a href="${p}korean-thought.html#history">한국 성경 수용사</a></li>
              <li><a href="${p}korean-thought.html#interpretation">한국적 성경 해석</a></li>
              <li><a href="${p}korean-thought.html#culture">한국문화와 성경</a></li>
            </ul>
          </li>
          <li class="has-submenu">
            <a href="${p}world-thought.html">🌍 세계사상과 성경 ▾</a>
            <ul class="sub-menu">
              <li><a href="${p}world-thought.html#ancient">고대 근동과 성경</a></li>
              <li><a href="${p}world-thought.html#modern">현대사상과 성경</a></li>
              <li><a href="${p}world-thought.html#comparative">비교 연구</a></li>
            </ul>
          </li>
          <li><a href="${p}publications.html">📚 책과 논문</a></li>
          <li><a href="${p}forum.html#notices">📢 공지사항</a></li>
          <li><a href="${p}forum.html#board">📋 게시판</a></li>
          <li><a href="${p}forum.html#media">🎬 이미지 & 동영상</a></li>
        </ul>
      </li>
      <li><a href="${p}login.html">🔐 로그인 / 회원가입</a></li>
    </ul>
    <div class="mobile-auth-area"></div>
    <div class="lang-mobile">
      <a href="${lp.kr}" class="active">한국어</a>
      <a href="${lp.en}">English</a>
    </div>
  </nav>`;
}

// ---------------- ENGLISH NAV SNIPPETS ----------------

function englishDesktopNav(activeKey) {
  // English pages are in public/en/, so links to ../ reach Korean site
  const cls = (key) => activeKey === key ? ' class="active"' : '';
  return `        <nav class="main-nav">
          <ul>
            <li><a href="index.html"${cls('home')}>Home</a></li>
            <li><a href="about.html"${cls('about')}>About</a></li>
            <li class="has-dropdown">
              <a href="forum.html"${cls('forum')}>Open Forum</a>
              <ul class="dropdown">
                <li>
                  <a href="korean-thought.html" class="has-children">Korean Thought & Bible</a>
                  <ul class="dropdown">
                    <li><a href="korean-thought.html#history">History of Reception</a></li>
                    <li><a href="korean-thought.html#interpretation">Korean Interpretation</a></li>
                    <li><a href="korean-thought.html#culture">Culture & Bible</a></li>
                  </ul>
                </li>
                <li>
                  <a href="world-thought.html" class="has-children">World Thought & Bible</a>
                  <ul class="dropdown">
                    <li><a href="world-thought.html#ancient">Ancient Near East</a></li>
                    <li><a href="world-thought.html#modern">Modern Thought</a></li>
                    <li><a href="world-thought.html#comparative">Comparative Studies</a></li>
                  </ul>
                </li>
                <li><a href="publications.html">Publications</a></li>
                <li><a href="forum.html#notices">Notices</a></li>
                <li><a href="forum.html#board">Discussion Board</a></li>
                <li><a href="forum.html#media">Images & Videos</a></li>
              </ul>
            </li>
          </ul>
        </nav>`;
}

function englishMobileNav() {
  return `  <nav class="mobile-nav">
    <div class="mobile-nav-header">
      <h3>Bible Glocal</h3>
      <p>Professor Jung Joong-Ho — bibleglocal.org</p>
    </div>
    <ul>
      <li><a href="index.html">🏠 Home</a></li>
      <li><a href="about.html">👤 About</a></li>
      <li class="has-submenu">
        <a href="forum.html">💬 Open Forum ▾</a>
        <ul class="sub-menu">
          <li class="has-submenu">
            <a href="korean-thought.html">🇰🇷 Korean Thought & Bible ▾</a>
            <ul class="sub-menu">
              <li><a href="korean-thought.html#history">History of Reception</a></li>
              <li><a href="korean-thought.html#interpretation">Korean Interpretation</a></li>
              <li><a href="korean-thought.html#culture">Culture & Bible</a></li>
            </ul>
          </li>
          <li class="has-submenu">
            <a href="world-thought.html">🌍 World Thought & Bible ▾</a>
            <ul class="sub-menu">
              <li><a href="world-thought.html#ancient">Ancient Near East</a></li>
              <li><a href="world-thought.html#modern">Modern Thought</a></li>
              <li><a href="world-thought.html#comparative">Comparative Studies</a></li>
            </ul>
          </li>
          <li><a href="publications.html">📚 Publications</a></li>
          <li><a href="forum.html#notices">📢 Notices</a></li>
          <li><a href="forum.html#board">📋 Discussion Board</a></li>
          <li><a href="forum.html#media">🎬 Images & Videos</a></li>
        </ul>
      </li>
      <li><a href="../login.html">🔐 Login / Register</a></li>
    </ul>
    <div class="mobile-auth-area"></div>
    <div class="lang-mobile">
      <a href="../index.html">한국어</a>
      <a href="index.html" class="active">English</a>
    </div>
  </nav>`;
}

// ---------------- CORE LOGIC ----------------

function activeKeyFromFilename(filename) {
  const name = filename.replace(/\.html$/, '');
  if (name === 'index') return 'home';
  if (name === 'about') return 'about';
  if (name === 'forum' || name === 'post' ||
      name === 'korean-thought' || name === 'world-thought' ||
      name === 'publications') return 'forum';
  return '';
}

function replaceBetween(content, openTagRegex, closeTag, replacement) {
  const m = content.match(openTagRegex);
  if (!m) return { content, found: false };
  const startIdx = m.index;
  const endIdx = content.indexOf(closeTag, startIdx);
  if (endIdx === -1) return { content, found: false };
  const before = content.slice(0, startIdx);
  const after = content.slice(endIdx + closeTag.length);
  return {
    content: before + replacement + after,
    found: true
  };
}

function rewriteFile(filepath, isEnglish) {
  let content = fs.readFileSync(filepath, 'utf8');
  const filename = path.basename(filepath);
  const activeKey = activeKeyFromFilename(filename);
  const original = content;

  // Replace desktop nav: <nav class="main-nav">...</nav>
  const desktopReplace = isEnglish
    ? englishDesktopNav(activeKey)
    : koreanDesktopNav(activeKey);

  let r = replaceBetween(
    content,
    /<nav\s+class="main-nav"[^>]*>/,
    '</nav>',
    desktopReplace
  );
  if (!r.found) {
    console.log(`  ⚠️  No <nav class="main-nav"> in ${filename}`);
    return false;
  }
  content = r.content;

  // Replace mobile nav: <nav class="mobile-nav">...</nav>
  const mobileReplace = isEnglish
    ? englishMobileNav()
    : koreanMobileNav();

  r = replaceBetween(
    content,
    /<nav\s+class="mobile-nav"[^>]*>/,
    '</nav>',
    mobileReplace
  );
  if (!r.found) {
    console.log(`  ⚠️  No <nav class="mobile-nav"> in ${filename}`);
    // still save desktop change
  } else {
    content = r.content;
  }

  if (content !== original) {
    fs.writeFileSync(filepath, content, 'utf8');
    return true;
  }
  return false;
}

// ---------------- MAIN ----------------

const publicDir = path.join(__dirname, 'public');
const enDir = path.join(publicDir, 'en');

console.log('🔧 Rewriting navigation in all HTML pages (Option A)...\n');

console.log('📄 Korean pages (public/):');
const krFiles = fs.readdirSync(publicDir)
  .filter(f => f.endsWith('.html'))
  .sort();
let krCount = 0;
for (const f of krFiles) {
  const full = path.join(publicDir, f);
  if (rewriteFile(full, false)) {
    console.log(`  ✓ ${f}`);
    krCount++;
  } else {
    console.log(`  - ${f} (no change)`);
  }
}
console.log(`  Total: ${krCount}/${krFiles.length} updated\n`);

console.log('📄 English pages (public/en/):');
const enFiles = fs.readdirSync(enDir)
  .filter(f => f.endsWith('.html'))
  .sort();
let enCount = 0;
for (const f of enFiles) {
  const full = path.join(enDir, f);
  if (rewriteFile(full, true)) {
    console.log(`  ✓ ${f}`);
    enCount++;
  } else {
    console.log(`  - ${f} (no change)`);
  }
}
console.log(`  Total: ${enCount}/${enFiles.length} updated\n`);

console.log(`✅ Done. Updated ${krCount + enCount} files.`);