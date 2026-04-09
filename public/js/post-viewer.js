// Post Viewer - Display single post with comments
const PostViewer = (() => {
  const API_BASE = '/api/posts';
  let currentPost = null;
  let currentUser = null;

  // Get post ID from URL
  function getPostId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  // Format date
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Get category name in Korean
  function getCategoryName(category) {
    const categories = {
      'korean_thought': '한국사상과성경',
      'world_thought': '세계사상과성경',
      'publications': '책과논문',
      'forum': '열린마당',
      'announcements': '공지사항',
      'general': '게시판',
      'media': '이미지&동영상'
    };
    return categories[category] || category;
  }

  // Load post data
  async function loadPost() {
    const postId = getPostId();
    if (!postId) {
      alert('게시글 ID가 없습니다.');
      window.location.href = 'forum.html';
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/${postId}`);
      const result = await response.json();

      if (!result.success) {
        alert('게시글을 찾을 수 없습니다.');
        window.location.href = 'forum.html';
        return;
      }

      currentPost = result.data;
      displayPost(currentPost);
      displayComments(currentPost.comments || []);
      checkAuth();
    } catch (error) {
      console.error('Error loading post:', error);
      alert('게시글 로드 중 오류가 발생했습니다.');
    }
  }

  // Display post content
  function displayPost(post) {
    document.getElementById('post-loading').style.display = 'none';
    document.getElementById('post-content').style.display = 'block';
    document.getElementById('comments-section').style.display = 'block';

    document.getElementById('post-category').textContent = getCategoryName(post.category);
    document.getElementById('post-title').textContent = post.title;
    document.getElementById('post-author').textContent = `👤 ${post.author_name}`;
    document.getElementById('post-date').textContent = `📅 ${formatDate(post.created_at)}`;
    document.getElementById('post-views').textContent = `👁️ 조회 ${post.view_count}`;

    // Display tags
    const tagsContainer = document.getElementById('post-tags');
    if (post.tags) {
      const tags = post.tags.split(',').map(tag => tag.trim());
      tagsContainer.innerHTML = tags.map(tag => 
        `<span class="tag">#${tag}</span>`
      ).join('');
    } else {
      tagsContainer.innerHTML = '';
    }

    // Display content
    document.getElementById('post-body').innerHTML = post.content;

    // Display media
    const mediaContainer = document.getElementById('post-media');
    let mediaHtml = '';
    if (post.image_url) {
      mediaHtml += `<img src="${post.image_url}" alt="첨부 이미지" style="max-width: 100%; margin: 1rem 0; border-radius: 8px;">`;
    }
    if (post.video_url) {
      mediaHtml += `<div style="margin: 1rem 0; text-align: center;">
        <a href="${post.video_url}" target="_blank" class="btn btn-outline">🎬 동영상 보기</a>
      </div>`;
    }
    mediaContainer.innerHTML = mediaHtml;

    // Update page title
    document.title = `${post.title} - 성경 사랑방`;
  }

  // Display comments
  function displayComments(comments) {
    const container = document.getElementById('comments-list');
    
    if (comments.length === 0) {
      container.innerHTML = '<div class="no-posts"><p>등록된 댓글이 없습니다.</p></div>';
      return;
    }

    container.innerHTML = comments.map(comment => `
      <div class="comment-item" data-comment-id="${comment.id}">
        <div class="comment-header">
          <span class="comment-author">${comment.author_name}</span>
          <span class="comment-date">${formatDate(comment.created_at)}</span>
        </div>
        <div class="comment-content">${comment.content}</div>
        <div class="comment-actions">
          <button onclick="PostViewer.deleteComment(${comment.id})" class="btn btn-sm btn-danger" ${currentUser && (currentUser.role === 'admin' || comment.author_id === currentUser.id) ? '' : 'style="display: none;"'}>삭제</button>
        </div>
      </div>
    `).join('');
  }

  // Check authentication
  async function checkAuth() {
    try {
      const response = await fetch('/api/auth/me');
      const result = await response.json();
      
      if (result.success) {
        currentUser = result.user;
        document.getElementById('comment-form-container').style.display = 'block';
        
        // Show edit/delete buttons for post author or admin
        if (currentUser.role === 'admin' || currentPost.author_id === currentUser.id) {
          document.getElementById('post-edit-actions').style.display = 'flex';
        }
      } else {
        document.getElementById('login-to-comment').style.display = 'block';
      }
    } catch (error) {
      document.getElementById('login-to-comment').style.display = 'block';
    }
  }

  // Submit comment
  async function submitComment() {
    const content = document.getElementById('comment-content').value.trim();
    
    if (!content) {
      alert('댓글 내용을 입력하세요.');
      return;
    }

    const postId = getPostId();

    try {
      const response = await fetch(`${API_BASE}/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      const result = await response.json();

      if (result.success) {
        document.getElementById('comment-content').value = '';
        loadPost(); // Reload to show new comment
      } else {
        alert('댓글 작성 실패: ' + result.error);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('댓글 작성 중 오류가 발생했습니다.');
    }
  }

  // Delete comment
  async function deleteComment(commentId) {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) {
      return;
    }

    const postId = getPostId();

    try {
      const response = await fetch(`${API_BASE}/${postId}/comments/${commentId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        loadPost(); // Reload to update comments
      } else {
        alert('댓글 삭제 실패: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('댓글 삭제 중 오류가 발생했습니다.');
    }
  }

  // Delete post
  async function deletePost() {
    if (!confirm('이 게시글을 삭제하시겠습니까?')) {
      return;
    }

    const postId = getPostId();

    try {
      const response = await fetch(`${API_BASE}/${postId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        alert('게시글이 삭제되었습니다.');
        window.location.href = 'forum.html';
      } else {
        alert('게시글 삭제 실패: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('게시글 삭제 중 오류가 발생했습니다.');
    }
  }

  // Initialize
  function init() {
    loadPost();

    // Event listeners
    document.getElementById('submit-comment')?.addEventListener('click', submitComment);
    document.getElementById('delete-post-btn')?.addEventListener('click', deletePost);
  }

  // Expose functions globally
  window.PostViewer = {
    init,
    deleteComment
  };

  return { init };
})();

// Auto-initialize
PostViewer.init();