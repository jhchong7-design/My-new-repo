const { Board, Media } = require('./database');

// Create Post
const createPost = async (req, res) => {
  try {
    const { title, content, category, boardType, tags, images, videoUrl, attachment, isPinned } = req.body;
    
    const post = new Board({
      title,
      content,
      author: req.userName || '관리자',
      authorId: req.userId,
      category,
      boardType,
      tags: tags || [],
      images: images || [],
      videoUrl,
      attachment,
      isPinned: isPinned || false
    });

    await post.save();

    res.status(201).json({
      success: true,
      message: '게시글이 작성되었습니다.',
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ 
      success: false, 
      message: '게시글 작성 중 오류가 발생했습니다.' 
    });
  }
};

// Get Posts (with pagination and filtering)
const getPosts = async (req, res) => {
  try {
    const { boardType, page = 1, limit = 10, category, search } = req.query;
    
    const query = {};
    
    // Only filter by boardType if provided
    if (boardType) {
      query.boardType = boardType;
    }
    
    // Exclude page_content from general listing
    if (!boardType) {
      query.boardType = { $ne: 'page_content' };
    }
    
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    const posts = await Board.find(query)
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean();

    const total = await Board.countDocuments(query);

    res.json({
      success: true,
      posts,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalPosts: total
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ 
      success: false, 
      message: '게시글 가져오기 중 오류가 발생했습니다.' 
    });
  }
};

// Get Post by ID
const getPostById = async (req, res) => {
  try {
    const post = await Board.findById(req.params.id).lean();

    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: '게시글을 찾을 수 없습니다.' 
      });
    }

    // Increment view count
    await Board.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ 
      success: false, 
      message: '게시글 가져오기 중 오류가 발생했습니다.' 
    });
  }
};

// Update Post
const updatePost = async (req, res) => {
  try {
    const { title, content, category, boardType, tags, images, videoUrl, attachment, isPinned } = req.body;

    const post = await Board.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: '게시글을 찾을 수 없습니다.' 
      });
    }

    // Check ownership or admin (skip if authorId not set, e.g. seeded data)
    if (post.authorId && post.authorId.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: '수정 권한이 없습니다.' 
      });
    }

    post.title = title || post.title;
    post.content = content || post.content;
    post.category = category || post.category;
    if (boardType) post.boardType = boardType;
    post.tags = tags !== undefined ? tags : post.tags;
    post.images = images || post.images;
    post.videoUrl = videoUrl !== undefined ? videoUrl : post.videoUrl;
    post.attachment = attachment || post.attachment;
    post.isPinned = isPinned !== undefined ? isPinned : post.isPinned;

    await post.save();

    res.json({
      success: true,
      message: '게시글이 수정되었습니다.',
      post
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ 
      success: false, 
      message: '게시글 수정 중 오류가 발생했습니다.' 
    });
  }
};

// Delete Post
const deletePost = async (req, res) => {
  try {
    const post = await Board.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: '게시글을 찾을 수 없습니다.' 
      });
    }

    // Check ownership or admin (skip if authorId not set, e.g. seeded data)
    if (post.authorId && post.authorId.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: '삭제 권한이 없습니다.' 
      });
    }

    await Board.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: '게시글이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ 
      success: false, 
      message: '게시글 삭제 중 오류가 발생했습니다.' 
    });
  }
};

// Get Recent Posts for Main Page
const getRecentPosts = async (req, res) => {
  try {
    const recentPosts = {};

    // Get recent posts for each board type
    const boards = [
      { type: 'notice', count: 5, name: '공지사항' },
      { type: 'korean_bible', count: 5, name: '한국사상과성경' },
      { type: 'world_bible', count: 5, name: '세계사상과성경' },
      { type: 'books_papers', count: 5, name: '책과논문' },
      { type: 'openforum', count: 5, name: '열린마당' },
      { type: 'board', count: 5, name: '게시판' },
      { type: 'sermon', count: 5, name: '설교' }
    ];

    for (const board of boards) {
      const posts = await Board.find({ boardType: board.type })
        .sort({ isPinned: -1, createdAt: -1 })
        .limit(board.count)
        .select('title author category createdAt views isPinned')
        .lean();
      
      recentPosts[board.type] = posts;
    }

    // Get recent media
    let media = [];
    try {
      media = await Media.find({})
        .sort({ createdAt: -1 })
        .limit(6)
        .lean();
    } catch (e) {
      // Media collection may be empty
    }

    res.json({
      success: true,
      recentPosts,
      recentMedia: media
    });
  } catch (error) {
    console.error('Get recent posts error:', error);
    res.status(500).json({ 
      success: false, 
      message: '최신글 가져오기 중 오류가 발생했습니다.' 
    });
  }
};

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  getRecentPosts
};