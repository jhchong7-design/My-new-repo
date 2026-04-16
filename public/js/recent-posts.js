// Recent Posts Manager - Loads and displays recent posts from the board API
const RecentPosts = (() => {
  const API_BASE = '/api/posts';

  // Format date to Korean format
  function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // If less than 24 hours, show relative time
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      if (hours === 0) {
        const minutes = Math.floor(diff / 60000);
        return minutes === 0 ? '방금' : `${minutes}분 전`;
      }
      return `${hours}시간 전`;
    }
    
    // Otherwise show formatted date
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  // Strip HTML tags and truncate text
  function truncateText(text, maxLength = 100) {
    // Remove HTML tags
    const temp = document.createElement('div');
    temp.innerHTML = text;
    const plainText = temp.textContent || temp.innerText || '';
    
    if (plainText.length <= maxLength) {
      return plainText;
    }
    
    return plainText.substring(0, maxLength) + '...';
  }

  // Create post item HTML
  function createPostItem(post) {
    const excerpt = truncateText(post.content, 150);
    const formattedDate = formatDate(post.created_at);
    
    let mediaIndicator = '';
    if (post.image_url) {
      mediaIndicator = '<span class="post-media-icon">🖼️</span>';
    } else if (post.video_url) {
      mediaIndicator = '<span class="post-media-icon">🎬</span>';
    }
    
    return `
      <div class="recent-post-item">
        <a href="#" data-post-id="${post.id}" class="post-link">
          ${mediaIndicator}
          <span class="post-title">${post.title}</span>
        </a>
        <div class="post-meta">
          <span class="post-date">${formattedDate}</span>
          <span class="post-author">${post.author_name}</span>
        </div>
        <p class="post-excerpt">${excerpt}</p>
      </div>
    `;
  }

  // Load and display recent posts
  async function loadRecentPosts() {
    try {
      const response = await fetch(`${API_BASE}/recent?limit=5`);
      const result = await response.json();
      
      if (!result.success) {
        console.error('Failed to load recent posts:', result.error);
        return;
      }

      const data = result.data;
      
      // Update Korean Thought section
      updateSection('recent-korean-thought', data.korean_thought?.posts || []);
      
      // Update World Thought section
      updateSection('recent-world-thought', data.world_thought?.posts || []);
      
      // Update Publications section
      updateSection('recent-publications', data.publications?.posts || []);
      
      // Update Forum section
      updateSection('recent-forum', data.forum?.posts || []);
      
      // Update Announcements section
      updateSection('recent-announcements', data.announcements?.posts || []);
      
      // Update General Board section
      updateSection('recent-general', data.general?.posts || []);
      
      // Update Media section
      updateSection('recent-media', data.media?.posts || []);
      
      // Add click handlers for post links
      addPostClickHandlers();
      
    } catch (error) {
      console.error('Error loading recent posts:', error);
    }
  }

  // Update a specific section with posts
  function updateSection(containerId, posts) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (posts.length === 0) {
      container.innerHTML = `
        <div class="no-posts">
          <p>등록된 글이 없습니다.</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = posts.map(post => createPostItem(post)).join('');
  }

  // Add click handlers for post links
  function addPostClickHandlers() {
    const postLinks = document.querySelectorAll('.post-link[data-post-id]');
    postLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const postId = link.getAttribute('data-post-id');
        
        // Open post in forum page with post ID
        window.location.href = `post.html?id=${postId}`;
      });
    });
  }

  // Initialize when DOM is ready
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadRecentPosts);
    } else {
      loadRecentPosts();
    }
  }

  return {
    init,
    loadRecentPosts
  };
})();

// Auto-initialize
RecentPosts.init();