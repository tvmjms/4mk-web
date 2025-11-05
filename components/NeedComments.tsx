// components/NeedComments.tsx
// Comment system for needs with media upload and AI moderation

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { contentModerator } from '@/lib/contentModerator';
import MediaViewer from './MediaViewer';

interface Comment {
  id: string;
  need_id: string;
  user_id: string;
  message: string;
  attachments: any[] | null;
  attachment_count: number;
  created_at: string;
  updated_at: string;
  moderation_status: 'approved' | 'pending' | 'rejected' | 'flagged';
  moderation_reason?: string;
  user_profiles?: {
    display_name?: string;
  };
}

interface NeedCommentsProps {
  needId: string;
  currentUserId?: string;
}

export default function NeedComments({ needId, currentUserId }: NeedCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentWarning, setCommentWarning] = useState<string | null>(null);

  // Simple inappropriate content detection for immediate warnings
  const checkInappropriateContent = (text: string): string | null => {
    if (!text || text.length < 3) return null;
    
    const inappropriatePatterns = [
      /\b(porn|sex|xxx|nude|naked|fuck|shit|bitch|ass|drug|weed|cocaine|heroin|scam|fraud|steal|rob|kill|die|suicide|bomb|weapon|gun|knife|hate|racist)\b/i,
      /\b(420|69|666)\b/,
      /(.)\1{4,}/, // repeated characters (spam-like)
      /\$\$\$+|💰+|🤑+/, // money symbols spam
      /\b(buy.*now|click.*here|free.*money|get.*rich|work.*from.*home)\b/i
    ];

    for (const pattern of inappropriatePatterns) {
      if (pattern.test(text)) {
        return "⚠️ This content may not be appropriate for a community help platform. Please keep messages respectful and family-friendly.";
      }
    }
    
    return null;
  };

  useEffect(() => {
    loadComments();
  }, [needId]);

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('need_comments')
        .select(`
          *,
          user_profiles:user_id (display_name)
        `)
        .eq('need_id', needId)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      setError('You must be logged in to comment');
      return;
    }

    if (!newComment.trim() && mediaFiles.length === 0) {
      setError('Please enter a comment or attach media');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // AI moderate the comment text
      if (newComment.trim()) {
        const textModeration = await contentModerator.moderateText(newComment);
        if (!textModeration.approved) {
          setError(`Comment not approved: ${textModeration.reasons.join(', ')}`);
          setSubmitting(false);
          return;
        }
      }

      // Prepare media attachments
      const approvedMedia = mediaFiles.filter(f => 
        f.moderation_status === 'approved' && f.uploaded_url
      ).map(f => ({
        id: f.id,
        filename: f.file.name,
        type: f.type,
        mime_type: f.file.type,
        size: f.file.size,
        url: f.uploaded_url,
        uploaded_at: new Date().toISOString(),
        moderation_status: f.moderation_status,
        moderation_reason: f.moderation_reason
      }));

      // Insert comment
      const { data, error } = await supabase
        .from('need_comments')
        .insert({
          need_id: needId,
          user_id: currentUserId,
          message: newComment.trim() || null,
          attachments: approvedMedia.length > 0 ? approvedMedia : null,
          attachment_count: approvedMedia.length,
          moderation_status: 'approved'
        })
        .select(`
          *,
          user_profiles:user_id (display_name)
        `)
        .single();

      if (error) throw error;

      setComments(prev => [...prev, data]);
      setNewComment('');
      setMediaFiles([]);

    } catch (error) {
      console.error('Error posting comment:', error);
      setError('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No comments yet. Be the first to help!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
              {/* Comment Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                    {comment.user_profiles?.display_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {comment.user_profiles?.display_name || 'Anonymous User'}
                  </span>
                  {comment.user_id === currentUserId && (
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">You</span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(comment.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              {/* Comment Message */}
              {comment.message && (
                <p className="text-gray-800 text-sm mb-2">{comment.message}</p>
              )}

              {/* Comment Media */}
              {comment.attachments && comment.attachments.length > 0 && (
                <MediaViewer
                  attachments={comment.attachments}
                  bucket="need-attachments"
                  maxDisplay={4}
                />
              )}
            </div>
          ))
        )}
      </div>

      {/* New Comment Form */}
      {currentUserId && (
        <form onSubmit={handleSubmitComment} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="space-y-3">
            {/* Text Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add a comment or offer to help
              </label>
              <textarea
                value={newComment}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setNewComment(newValue);
                  // Check for inappropriate content in real-time
                  const warning = checkInappropriateContent(newValue);
                  setCommentWarning(warning);
                }}
                placeholder="Share how you can help, ask questions, or provide updates..."
                className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-1 ${
                  commentWarning 
                    ? 'border-orange-400 focus:border-orange-400 bg-orange-50' 
                    : 'border-gray-300 focus:border-blue-400 focus:ring-blue-400'
                }`}
                rows={3}
                disabled={submitting}
                maxLength={500}
              />
              {commentWarning && (
                <div className="mt-1 text-[10px] text-orange-700 bg-orange-100 border border-orange-300 rounded p-2 flex items-start gap-1">
                  <span className="text-xs">⚠️</span>
                  <span>{commentWarning}</span>
                </div>
              )}
              <div className="text-xs text-gray-500 mt-1">
                {newComment.length}/500 characters
              </div>
            </div>

            {/* Media Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attach photos or documents (optional)
              </label>
              <div className="text-xs text-blue-600 mb-2">
                💡 Share photos of items you can provide, receipts, or helpful documents
              </div>
              {/* Note: You would import and use MediaUpload component here */}
              <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center text-sm text-gray-500">
                Media upload component would go here
                <br />
                <span className="text-xs">(Drag & drop photos, videos, or PDFs)</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setNewComment('');
                  setMediaFiles([]);
                  setError(null);
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                disabled={submitting}
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={submitting || (!newComment.trim() && mediaFiles.length === 0)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Posting...
                  </span>
                ) : (
                  'Post Comment'
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {!currentUserId && (
        <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <a href="/login" className="font-medium hover:underline">Sign in</a> to offer help or ask questions
          </p>
        </div>
      )}
    </div>
  );
}