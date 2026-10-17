import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Image as ImageIcon,
  Send,
  MoreVertical,
  Trash2,
  MapPin,
  Smile,
  Sparkles,
  Plus,
  CheckCircle,
  Loader2,
  X,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { compressImage } from '../../lib/compression';
import { CreateStoryModal } from '../../components/stories/CreateStoryModal';
import { StoryViewerModal, UserStoryGroup } from '../../components/stories/StoryViewerModal';

interface PostComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

interface PostItem {
  id: string;
  userId: string;
  caption: string;
  mediaUrls: string[];
  feeling?: string;
  location?: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  comments: PostComment[];
  createdAt: string;
  author: {
    id: string;
    displayName: string;
    avatar: string;
    verifiedBadge: boolean;
    city: string;
  };
}

export const Feed: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Feed Posts state
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loadingPosts, setLoadingPosts] = useState<boolean>(true);

  // Stories state
  const [storyGroups, setStoryGroups] = useState<UserStoryGroup[]>([]);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState<boolean>(false);
  const [activeStoryViewerIndex, setActiveStoryViewerIndex] = useState<number | null>(null);

  // Create Post state
  const [newCaption, setNewCaption] = useState<string>('');
  const [selectedFeeling, setSelectedFeeling] = useState<string>('');
  const [postLocation, setPostLocation] = useState<string>('Kigali, Rwanda');
  const [compressedPhotos, setCompressedPhotos] = useState<string[]>([]);
  const [isCompressingPhotos, setIsCompressingPhotos] = useState<boolean>(false);
  const [spaceSavings, setSpaceSavings] = useState<{ original: string; compressed: string; savedPct: number } | null>(null);
  const [isSubmittingPost, setIsSubmittingPost] = useState<boolean>(false);
  const [postError, setPostError] = useState<string>('');

  // Comment section state
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const feelingsList = [
    'Feeling romantic ❤️',
    'Exploring Kigali 🌆',
    'Coffee vibes ☕',
    'Weekend mood 🎉',
    'Deep in thought 💭',
    'Ready for love 🌹',
  ];

  // Fetch Feed & Stories
  const fetchFeed = async () => {
    try {
      const res = await api.get('/posts');
      if (res.data.success && Array.isArray(res.data.posts)) {
        setPosts(res.data.posts);
      }
    } catch (e) {
      console.warn('Error fetching posts:', e);
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchStories = async () => {
    try {
      const res = await api.get('/stories');
      if (res.data.success && Array.isArray(res.data.storiesGrouped)) {
        setStoryGroups(res.data.storiesGrouped);
      }
    } catch (e) {
      console.warn('Error fetching stories:', e);
    }
  };

  useEffect(() => {
    fetchFeed();
    fetchStories();
  }, []);

  // Handle Photo selection with Space-Saving Canvas Compression
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressingPhotos(true);
    setPostError('');

    let totalOrig = 0;
    let totalComp = 0;
    const compressedList: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        totalOrig += file.size;
        const res = await compressImage(file, 1440, 1440, 0.78);
        totalComp += res.compressedSize;
        compressedList.push(res.dataUrl);
      }

      setCompressedPhotos((prev) => [...prev, ...compressedList]);

      const saved = Math.max(0, totalOrig - totalComp);
      const savedPct = totalOrig > 0 ? Math.round((saved / totalOrig) * 100) : 0;
      setSpaceSavings({
        original: `${Math.round(totalOrig / 1024)} KB`,
        compressed: `${Math.round(totalComp / 1024)} KB`,
        savedPct,
      });
    } catch (err: any) {
      setPostError('Error compressing photos for space optimization.');
    } finally {
      setIsCompressingPhotos(false);
    }
  };

  // Submit Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaption.trim() && compressedPhotos.length === 0) {
      setPostError('Please write a caption or add a photo to post.');
      return;
    }

    setIsSubmittingPost(true);
    setPostError('');

    try {
      // Upload compressed images with safe fallback to dataUrl
      const uploadedUrls: string[] = [];
      for (let i = 0; i < compressedPhotos.length; i++) {
        try {
          const uploadRes = await api.post('/upload', {
            fileBase64: compressedPhotos[i],
            filename: `post_${Date.now()}_${i}.jpg`,
            mimeType: 'image/jpeg',
          });
          if (uploadRes.data?.success && uploadRes.data?.url) {
            uploadedUrls.push(uploadRes.data.url);
          } else {
            uploadedUrls.push(compressedPhotos[i]);
          }
        } catch {
          uploadedUrls.push(compressedPhotos[i]);
        }
      }

      const postRes = await api.post('/posts', {
        caption: newCaption,
        mediaUrls: uploadedUrls,
        feeling: selectedFeeling || null,
        location: postLocation || null,
      });

      if (postRes.data?.success && postRes.data?.post) {
        setPosts((prev) => [postRes.data.post, ...prev]);
        setNewCaption('');
        setSelectedFeeling('');
        setCompressedPhotos([]);
        setSpaceSavings(null);
      }
    } catch (err: any) {
      setPostError(err.response?.data?.error || err.message || 'Failed to share post.');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // Like / Unlike Post
  const handleToggleLike = async (postId: string) => {
    try {
      const res = await api.post('/posts', { action: 'like', postId });
      if (res.data?.success) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, isLiked: res.data.isLiked, likesCount: res.data.likesCount } : p
          )
        );
      }
    } catch (e) {
      console.warn('Like error:', e);
    }
  };

  // Submit Comment
  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    try {
      const res = await api.post('/posts', { action: 'comment', postId, content: text });
      if (res.data?.success && res.data?.comment) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  commentsCount: res.data.commentsCount,
                  comments: [...p.comments, res.data.comment],
                }
              : p
          )
        );
        setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      }
    } catch (e) {
      console.warn('Comment error:', e);
    }
  };

  // Delete Post
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/posts?id=${postId}`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (e) {
      console.warn('Delete post error:', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 md:pb-12 pt-4">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        {/* STORIES CAROUSEL */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">24h Stories</h2>
            <span className="text-[11px] text-rose-600 font-medium">Expires in 24h</span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {/* Add Story Button Ring */}
            <div
              onClick={() => setIsCreateStoryOpen(true)}
              className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
            >
              <div className="relative w-16 h-16 rounded-full p-0.5 border-2 border-dashed border-rose-300 group-hover:border-rose-500 flex items-center justify-center transition-all bg-rose-50">
                <div className="w-14 h-14 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <Plus className="w-6 h-6" />
                </div>
              </div>
              <span className="text-[11px] font-semibold text-slate-700">Your Story</span>
            </div>

            {/* Member Stories Rings */}
            {storyGroups.map((group, idx) => (
              <div
                key={group.userId}
                onClick={() => setActiveStoryViewerIndex(idx)}
                className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
              >
                <div className="relative w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shadow-sm group-hover:scale-105 transition-transform">
                  <img
                    src={group.avatar}
                    alt={group.displayName}
                    className="w-full h-full rounded-full object-cover ring-2 ring-white"
                  />
                  {group.stories.length > 1 && (
                    <span className="absolute -bottom-1 -right-1 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-white">
                      {group.stories.length}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-medium text-slate-800 truncate max-w-[64px]">
                  {group.displayName.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CREATE POST CARD */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
          <form onSubmit={handleCreatePost} className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-violet-600 text-white font-bold flex items-center justify-center shrink-0 shadow-sm">
                {user?.email?.charAt(0).toUpperCase() || 'K'}
              </div>
              <div className="flex-1">
                <textarea
                  rows={2}
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="Share a moment, feeling, or dating thought with Kunda community..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-2xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none resize-none transition-colors"
                />
              </div>
            </div>

            {/* Selected Feeling Badge */}
            {selectedFeeling && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-full">
                  <Smile className="w-3.5 h-3.5" />
                  {selectedFeeling}
                  <button
                    type="button"
                    onClick={() => setSelectedFeeling('')}
                    className="hover:text-rose-900 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              </div>
            )}

            {/* Compressed Photos Preview with Space-Savings indicator */}
            {compressedPhotos.length > 0 && (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  {compressedPhotos.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 group">
                      <img src={url} alt={`Upload ${i}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setCompressedPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {spaceSavings && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      Optimized with Canvas Compression
                    </span>
                    <span className="font-bold text-emerald-700">
                      Saved {spaceSavings.savedPct}% ({spaceSavings.original} → {spaceSavings.compressed})
                    </span>
                  </div>
                )}
              </div>
            )}

            {postError && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                {postError}
              </p>
            )}

            {/* Bottom Actions of Create Post */}
            {/* Bottom Actions of Create Post */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressingPhotos}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                >
                  <ImageIcon className="w-4 h-4 text-rose-500" />
                  <span>{isCompressingPhotos ? 'Compressing...' : 'Add Photos'}</span>
                </button>

                {/* Vibe / Feeling Picker */}
                <select
                  value={selectedFeeling}
                  onChange={(e) => setSelectedFeeling(e.target.value)}
                  className="text-xs bg-slate-100 border-none text-slate-700 rounded-xl px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer max-w-[130px] sm:max-w-[160px]"
                >
                  <option value="">Feeling / Vibe...</option>
                  {feelingsList.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmittingPost || isCompressingPhotos}
                className="flex items-center gap-1.5 px-4 sm:px-5 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-500/20 disabled:opacity-50 transition-all shrink-0 ml-auto"
              >
                {isSubmittingPost ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Post
                  </>
                )}
              </button>
            </div>
          </form>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handlePhotoSelect}
          />
        </div>

        {/* POSTS LIST */}
        <div className="space-y-5">
          {loadingPosts ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-500" />
              Loading community feed...
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-100">
              <p className="text-sm font-semibold text-slate-700">No community posts yet.</p>
              <p className="text-xs text-slate-400 mt-1">Be the first to share a post with Rwandan singles!</p>
            </div>
          ) : (
            posts.map((post) => {
              const isOwner = user?.id === post.userId;
              const isCommentsOpen = activeCommentPostId === post.id;

              return (
                <article
                  key={post.id}
                  className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
                >
                  {/* Post Header */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={post.author.avatar}
                        alt={post.author.displayName}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-rose-100"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-slate-900">{post.author.displayName}</h4>
                          {post.author.verifiedBadge && (
                            <CheckCircle className="w-3.5 h-3.5 text-rose-500 fill-rose-50" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          {post.location && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {post.location}
                            </span>
                          )}
                          <span>•</span>
                          <span>{new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isOwner && (
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-full transition-colors"
                          title="Delete post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Post Caption */}
                  {post.caption && (
                    <div className="px-4 pb-3">
                      <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{post.caption}</p>
                      {post.feeling && (
                        <span className="inline-block mt-2 px-2.5 py-0.5 bg-rose-50 text-rose-700 text-[11px] font-medium rounded-full">
                          {post.feeling}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Post Media Gallery */}
                  {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <div className="relative bg-slate-900 max-h-[500px] overflow-hidden flex items-center justify-center">
                      <img
                        src={post.mediaUrls[0]}
                        alt="Post media"
                        className="w-full object-contain max-h-[480px]"
                      />
                    </div>
                  )}

                  {/* Post Stats & Action Buttons */}
                  <div className="p-4 border-t border-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Like Button */}
                        <button
                          onClick={() => handleToggleLike(post.id)}
                          className={`flex items-center gap-1.5 text-xs font-semibold transition-all ${
                            post.isLiked ? 'text-rose-600' : 'text-slate-600 hover:text-rose-600'
                          }`}
                        >
                          <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-rose-600 text-rose-600 scale-110' : ''}`} />
                          <span>{post.likesCount}</span>
                        </button>

                        {/* Comment Toggle Button */}
                        <button
                          onClick={() => setActiveCommentPostId(isCommentsOpen ? null : post.id)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span>{post.commentsCount}</span>
                        </button>
                      </div>

                      {/* Direct Message button to author */}
                      {!isOwner && (
                        <button
                          onClick={() => navigate('/dashboard/messages')}
                          className="flex items-center gap-1 px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-full transition-colors"
                        >
                          <Send className="w-3 h-3" />
                          Message {post.author.displayName.split(' ')[0]}
                        </button>
                      )}
                    </div>

                    {/* Interactive Comments Drawer */}
                    {isCommentsOpen && (
                      <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in-50">
                        {/* Existing Comments */}
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {post.comments.length === 0 ? (
                            <p className="text-xs text-slate-400 py-1">No comments yet. Say something nice!</p>
                          ) : (
                            post.comments.map((comment) => (
                              <div key={comment.id} className="flex items-start gap-2.5 text-xs">
                                <img
                                  src={comment.userAvatar}
                                  alt={comment.userName}
                                  className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
                                />
                                <div className="flex-1 bg-slate-50 p-2 rounded-2xl">
                                  <span className="font-bold text-slate-800 mr-1.5">{comment.userName}</span>
                                  <span className="text-slate-700">{comment.content}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Add Comment Form */}
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={commentInputs[post.id] || ''}
                            onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                            placeholder="Add a comment..."
                            className="flex-1 bg-slate-100 border-none rounded-full px-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddComment(post.id)}
                            disabled={!commentInputs[post.id]?.trim()}
                            className="p-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white rounded-full transition-all"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      {/* MODALS */}
      <CreateStoryModal
        isOpen={isCreateStoryOpen}
        onClose={() => setIsCreateStoryOpen(false)}
        onStoryCreated={() => {
          fetchStories();
        }}
      />

      {activeStoryViewerIndex !== null && (
        <StoryViewerModal
          isOpen={true}
          userGroups={storyGroups}
          initialUserIndex={activeStoryViewerIndex}
          onClose={() => setActiveStoryViewerIndex(null)}
          onStoryDeleted={() => {
            fetchStories();
          }}
        />
      )}
    </div>
  );
};
