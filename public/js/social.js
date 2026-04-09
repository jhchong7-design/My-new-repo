/**
 * Bible Glocal — Social Media & Korean Platform Integration
 * Supports: Kakao, Naver, Daum, Facebook, X/Twitter, TikTok, LINE, Band, Brunch
 */
const BG_SOCIAL = (() => {
  /* ── helpers ── */
  const _url  = () => encodeURIComponent(window.location.href);
  const _title = () => encodeURIComponent(document.title);
  const _desc = () => {
    const m = document.querySelector('meta[name="description"]');
    return encodeURIComponent(m ? m.content : document.title);
  };
  const _open = (url) => window.open(url, '_blank', 'width=600,height=500,scrollbars=yes');

  /* ── Share Functions ── */

  // KakaoTalk (via Kakao JS SDK link share)
  function shareKakaoTalk() {
    if (window.Kakao && window.Kakao.Link) {
      Kakao.Link.sendDefault({
        objectType: 'feed',
        content: {
          title: document.title,
          description: document.querySelector('meta[name="description"]')?.content || '',
          imageUrl: document.querySelector('meta[property="og:image"]')?.content || '',
          link: { mobileWebUrl: window.location.href, webUrl: window.location.href }
        },
        buttons: [{ title: '웹으로 보기', link: { mobileWebUrl: window.location.href, webUrl: window.location.href } }]
      });
    } else {
      // Fallback: Kakao Story share
      _open(`https://story.kakao.com/share?url=${_url()}`);
    }
  }

  // Kakao Story
  function shareKakaoStory() {
    _open(`https://story.kakao.com/share?url=${_url()}`);
  }

  // Naver Blog
  function shareNaverBlog() {
    _open(`https://share.naver.com/web/shareView?url=${_url()}&title=${_title()}`);
  }

  // Naver Band
  function shareNaverBand() {
    _open(`https://band.us/plugin/share?body=${_title()}%0A${_url()}&route=${_url()}`);
  }

  // Daum Cafe (share via posting URL)
  function shareDaumCafe() {
    _open(`https://cafe.daum.net/_write?url=${_url()}&title=${_title()}`);
  }

  // Daum/Kakao Brunch
  function shareBrunch() {
    // Brunch doesn't have a direct share API, open with link copy
    copyLink();
    showToast('🔗 링크가 복사되었습니다. Brunch에 붙여넣기 하세요!');
  }

  // Facebook
  function shareFacebook() {
    _open(`https://www.facebook.com/sharer/sharer.php?u=${_url()}`);
  }

  // X (Twitter)
  function shareTwitter() {
    _open(`https://twitter.com/intent/tweet?text=${_title()}&url=${_url()}`);
  }

  // LINE
  function shareLINE() {
    _open(`https://social-plugins.line.me/lineit/share?url=${_url()}`);
  }

  // TikTok (no direct share API — copy link with instruction)
  function shareTikTok() {
    copyLink();
    showToast('🔗 링크가 복사되었습니다. TikTok에 붙여넣기 하세요!');
  }

  // Copy Link
  function copyLink() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        showToast('✅ 링크가 클립보드에 복사되었습니다!');
      }).catch(() => _fallbackCopy());
    } else {
      _fallbackCopy();
    }
  }
  function _fallbackCopy() {
    const ta = document.createElement('textarea');
    ta.value = window.location.href;
    ta.style.cssText = 'position:fixed;left:-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); showToast('✅ 링크가 복사되었습니다!'); }
    catch(e) { showToast('⚠️ 복사 실패 — 수동으로 복사해 주세요'); }
    document.body.removeChild(ta);
  }

  /* ── Toast notification ── */
  function showToast(msg) {
    let t = document.getElementById('bg-social-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'bg-social-toast';
      t.className = 'social-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }

  /* ── UI: Floating Share Sidebar ── */
  function injectSidebar() {
    if (document.querySelector('.social-sidebar')) return;
    const isEn = window.location.pathname.includes('/en/');
    const sb = document.createElement('div');
    sb.className = 'social-sidebar';
    sb.innerHTML = `
      <a href="javascript:void(0)" onclick="BG_SOCIAL.shareKakaoTalk()" title="${isEn ? 'Share on KakaoTalk' : '카카오톡 공유'}" class="sb-kakao">
        <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 3C6.477 3 2 6.463 2 10.691c0 2.735 1.803 5.134 4.508 6.478l-.826 3.072a.37.37 0 00.567.395l3.54-2.348c.734.104 1.49.161 2.211.161 5.523 0 10-3.463 10-7.758S17.523 3 12 3z"/></svg>
      </a>
      <a href="javascript:void(0)" onclick="BG_SOCIAL.shareNaverBlog()" title="${isEn ? 'Share on Naver' : '네이버 공유'}" class="sb-naver">
        <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/></svg>
      </a>
      <a href="javascript:void(0)" onclick="BG_SOCIAL.shareDaumCafe()" title="${isEn ? 'Share on Daum Cafe' : '다음 카페 공유'}" class="sb-daum">
        <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.5 14h-3c-.28 0-.5-.22-.5-.5v-7c0-.28.22-.5.5-.5h3c2.49 0 4.5 1.79 4.5 4s-2.01 4-4.5 4z"/></svg>
      </a>
      <a href="javascript:void(0)" onclick="BG_SOCIAL.shareFacebook()" title="${isEn ? 'Share on Facebook' : '페이스북 공유'}" class="sb-facebook">
        <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
      </a>
      <a href="javascript:void(0)" onclick="BG_SOCIAL.shareTwitter()" title="${isEn ? 'Share on X' : 'X(트위터) 공유'}" class="sb-twitter">
        <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </a>
      <a href="javascript:void(0)" onclick="BG_SOCIAL.shareLINE()" title="${isEn ? 'Share on LINE' : 'LINE 공유'}" class="sb-line">
        <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 2C6.48 2 2 5.83 2 10.5c0 3.77 3.01 6.96 7.12 7.93-.1.37-.63 2.37-.66 2.53-.05.25.09.5.34.58.12.04.24.03.35-.02.17-.08 4.28-2.82 4.82-3.18.67.09 1.35.14 2.03.14 5.52 0 10-3.83 10-8.5S17.52 2 12 2zm-3.5 10.5h-2c-.28 0-.5-.22-.5-.5V8c0-.28.22-.5.5-.5s.5.22.5.5v3.5H8.5c.28 0 .5.22.5.5s-.22.5-.5.5zm2 0c-.28 0-.5-.22-.5-.5V8c0-.28.22-.5.5-.5s.5.22.5.5v4c0 .28-.22.5-.5.5zm5 0h-2c-.28 0-.5-.22-.5-.5V8c0-.28.22-.5.5-.5s.5.22.5.5v3.5h1.5c.28 0 .5.22.5.5s-.22.5-.5.5zm3-2h-1V12c0 .28-.22.5-.5.5s-.5-.22-.5-.5V8c0-.28.22-.5.5-.5h2c.28 0 .5.22.5.5v2c0 .28-.22.5-.5.5z"/></svg>
      </a>
      <a href="javascript:void(0)" onclick="BG_SOCIAL.shareNaverBand()" title="${isEn ? 'Share on Band' : '밴드 공유'}" class="sb-band">
        <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H8v-2h3v2zm4.5-4H7.5c-.83 0-1.5-.67-1.5-1.5S6.67 10 7.5 10h8c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5zm0-4h-7c-.83 0-1.5-.67-1.5-1.5S7.67 6 8.5 6h7c.83 0 1.5.67 1.5 1.5S16.33 9 15.5 9z"/></svg>
      </a>
      <a href="javascript:void(0)" onclick="BG_SOCIAL.shareTikTok()" title="${isEn ? 'Share on TikTok' : '틱톡 공유'}" class="sb-tiktok">
        <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.18 8.18 0 004.77 1.52V6.84a4.84 4.84 0 01-1-.15z"/></svg>
      </a>
      <a href="javascript:void(0)" onclick="BG_SOCIAL.copyLink()" title="${isEn ? 'Copy Link' : '링크 복사'}" class="sb-copy">
        <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
      </a>
    `;
    document.body.appendChild(sb);
  }

  /* ── UI: KakaoTalk Chat Button ── */
  function injectKakaoChat() {
    if (document.querySelector('.kakao-chat-btn')) return;
    const isEn = window.location.pathname.includes('/en/');
    const btn = document.createElement('button');
    btn.className = 'kakao-chat-btn';
    btn.title = isEn ? 'KakaoTalk Consultation' : '카카오톡 상담';
    btn.innerHTML = `<svg viewBox="0 0 24 24" width="28" height="28"><path fill="#3C1E1E" d="M12 3C6.477 3 2 6.463 2 10.691c0 2.735 1.803 5.134 4.508 6.478l-.826 3.072a.37.37 0 00.567.395l3.54-2.348c.734.104 1.49.161 2.211.161 5.523 0 10-3.463 10-7.758S17.523 3 12 3z"/></svg>`;
    btn.onclick = () => window.open('https://pf.kakao.com/', '_blank');
    document.body.appendChild(btn);
  }

  /* ── UI: Footer Social Links ── */
  function injectFooterSocial() {
    const footer = document.querySelector('footer');
    if (!footer || footer.querySelector('.footer-social-row')) return;
    const isEn = window.location.pathname.includes('/en/');
    const row = document.createElement('div');
    row.className = 'footer-social-row';
    row.innerHTML = `
      <h4>${isEn ? 'Connect & Follow' : '소통 & 팔로우'}</h4>
      <p style="font-size:0.82rem;color:var(--text-light,#888);margin-bottom:0.6rem;">${isEn ? '💬 Connect with us on social media' : '💬 소셜미디어로 소통하세요'}</p>
      <div class="footer-social-icons">
        <a href="javascript:void(0)" onclick="BG_SOCIAL.shareKakaoTalk()" title="KakaoTalk" class="fsi fsi-kakao">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 3C6.477 3 2 6.463 2 10.691c0 2.735 1.803 5.134 4.508 6.478l-.826 3.072a.37.37 0 00.567.395l3.54-2.348c.734.104 1.49.161 2.211.161 5.523 0 10-3.463 10-7.758S17.523 3 12 3z"/></svg>
        </a>
        <a href="javascript:void(0)" onclick="BG_SOCIAL.shareNaverBlog()" title="Naver" class="fsi fsi-naver">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/></svg>
        </a>
        <a href="javascript:void(0)" onclick="BG_SOCIAL.shareDaumCafe()" title="Daum" class="fsi fsi-daum">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.5 14h-3c-.28 0-.5-.22-.5-.5v-7c0-.28.22-.5.5-.5h3c2.49 0 4.5 1.79 4.5 4s-2.01 4-4.5 4z"/></svg>
        </a>
        <a href="javascript:void(0)" onclick="BG_SOCIAL.shareFacebook()" title="Facebook" class="fsi fsi-facebook">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        </a>
        <a href="javascript:void(0)" onclick="BG_SOCIAL.shareTwitter()" title="X (Twitter)" class="fsi fsi-twitter">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
        <a href="javascript:void(0)" onclick="BG_SOCIAL.shareLINE()" title="LINE" class="fsi fsi-line">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 2C6.48 2 2 5.83 2 10.5c0 3.77 3.01 6.96 7.12 7.93-.1.37-.63 2.37-.66 2.53-.05.25.09.5.34.58.12.04.24.03.35-.02.17-.08 4.28-2.82 4.82-3.18.67.09 1.35.14 2.03.14 5.52 0 10-3.83 10-8.5S17.52 2 12 2z"/></svg>
        </a>
        <a href="javascript:void(0)" onclick="BG_SOCIAL.shareNaverBand()" title="Band" class="fsi fsi-band">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H8v-2h3v2zm4.5-4H7.5c-.83 0-1.5-.67-1.5-1.5S6.67 10 7.5 10h8c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5zm0-4h-7c-.83 0-1.5-.67-1.5-1.5S7.67 6 8.5 6h7c.83 0 1.5.67 1.5 1.5S16.33 9 15.5 9z"/></svg>
        </a>
        <a href="javascript:void(0)" onclick="BG_SOCIAL.shareTikTok()" title="TikTok" class="fsi fsi-tiktok">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.18 8.18 0 004.77 1.52V6.84a4.84 4.84 0 01-1-.15z"/></svg>
        </a>
        <a href="javascript:void(0)" onclick="BG_SOCIAL.copyLink()" title="${isEn ? 'Copy Link' : '링크 복사'}" class="fsi fsi-copy">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
        </a>
      </div>
    `;
    // Insert before footer-bottom
    const fb = footer.querySelector('.footer-bottom');
    if (fb) fb.parentNode.insertBefore(row, fb);
    else footer.querySelector('.container')?.appendChild(row);
  }

  /* ── Kakao SDK Loader ── */
  function loadKakaoSDK() {
    if (window.Kakao) return;
    const s = document.createElement('script');
    s.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
    s.crossOrigin = 'anonymous';
    s.onload = () => {
      // Using a demo app key; replace with your own for production
      if (!Kakao.isInitialized()) {
        Kakao.init('YOUR_KAKAO_APP_KEY');
      }
    };
    document.head.appendChild(s);
  }

  /* ── Init ── */
  function init() {
    loadKakaoSDK();
    injectSidebar();
    injectKakaoChat();
    injectFooterSocial();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ── Public API ── */
  return {
    shareKakaoTalk,
    shareKakaoStory,
    shareKakao: shareKakaoTalk, // alias
    shareNaverBlog,
    shareNaverBand,
    shareDaumCafe,
    shareBrunch,
    shareFacebook,
    shareTwitter,
    shareLINE,
    shareTikTok,
    copyLink,
    showToast
  };
})();