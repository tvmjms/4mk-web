// components/NeedComments.tsx
// Comment system for needs with media upload and AI moderation

import { useEffect, useState, FormEvent, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { contentModerator } from '@/lib/contentModerator';
import MediaViewer from './MediaViewer';
import imageCompression from 'browser-image-compression';

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
  user_profile?: {
    user_id?: string;
    display_name?: string;
  };
}

interface NeedCommentsProps {
  needId: string;
  currentUserId?: string;
  fulfillmentId?: string; // Link comments to a specific fulfillment/connection
}

export default function NeedComments({ needId, currentUserId, fulfillmentId }: NeedCommentsProps) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    id: string;
    url: string;
    file: File;
    type: 'image' | 'document';
    name: string;
    extension: string;
    isOfficeDoc: boolean;
    isTextFile: boolean;
  }>>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentWarning, setCommentWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Create login link with current page as redirect destination
  // Use the actual need ID instead of the route template
  const currentPath = `/needs/${needId}`;
  const loginWithRedirect = `/login?next=${encodeURIComponent(currentPath)}`;

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
  }, [needId, fulfillmentId]);

  const attachProfiles = async (items: Comment[]) => {
    const userIds = Array.from(new Set(items.map((c) => c.user_id).filter(Boolean)));
    if (userIds.length === 0) {
      return items;
    }

    const { data: profiles, error } = await supabase
      .from('user_profile')
      .select('user_id, display_name')
      .in('user_id', userIds);

    if (error) {
      console.error('Error loading user profiles for comments:', error);
      return items;
    }

    const profileMap = new Map((profiles || []).map((profile) => [profile.user_id, profile]));

    return items.map((comment) => ({
      ...comment,
      user_profile: profileMap.get(comment.user_id) || null,
    }));
  };

  const loadComments = async () => {
    try {
      setError(null);
      // Build query - filter by fulfillment_id if provided (connection-based chat)
      let query = supabase
        .from('need_comments')
        .select('*')
        .eq('need_id', needId)
        .eq('moderation_status', 'approved');
      
      // If fulfillmentId is provided, only show comments for that connection (chat history)
      // This creates a private conversation between requester and helper
      // When an offer is declined, those comments won't show because fulfillmentId changes
      if (fulfillmentId) {
        query = query.eq('fulfillment_id', fulfillmentId);
      } else {
        // No active connection - show general comments not linked to any fulfillment
        query = query.is('fulfillment_id', null);
      }
      
      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading comments:', error);
        throw error;
        }
        
      const enriched = await attachProfiles(data || []);
      setComments(enriched);
    } catch (error: any) {
      console.error('Error loading comments:', error);
      // Only show error if it's a critical failure
      if (error?.code !== 'PGRST116') {
        setError(error?.message || 'Failed to load comments');
      } else {
        // PGRST116 is "no rows returned" - not really an error
        setComments([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingFile(true);
    setError(null);
    
    try {
      const file = files[0];
      
      // Validate file type - allow images, documents, block videos
      const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      
      // Common document MIME types
      const allowedDocTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'application/rtf',
        'application/vnd.oasis.opendocument.text',
        'application/vnd.oasis.opendocument.spreadsheet',
        'application/vnd.oasis.opendocument.presentation',
      ];
      
      const videoTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi', 'video/quicktime'];
      
      // Block videos explicitly
      if (videoTypes.some(vt => file.type.includes(vt))) {
        setError('⚠️ Videos are not allowed. Please upload images or documents only.');
        setUploadingFile(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      // Check if it's an allowed type
      const isImage = allowedImageTypes.includes(file.type) || file.type.startsWith('image/');
      const isDocument = allowedDocTypes.includes(file.type) || 
                         file.name.toLowerCase().match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|rtf|odt|ods|odp)$/i);
      
      if (!isImage && !isDocument) {
        setError('⚠️ File type not supported. Please upload images or standard document formats (PDF, Word, Excel, PowerPoint, Text, CSV, RTF, OpenDocument).');
        setUploadingFile(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      // Check file size - larger limit for documents (20MB), smaller for images (10MB)
      const maxSize = isImage ? 10 * 1024 * 1024 : 20 * 1024 * 1024;
      const maxSizeMB = isImage ? 10 : 20;
      if (file.size > maxSize) {
        setError(`⚠️ File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of ${maxSizeMB}MB`);
        setUploadingFile(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      let fileToUpload = file;
      
      // For images: compress for sustainability
      if (isImage) {
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 800,
          useWebWorker: true,
          fileType: 'image/jpeg'
        };
        
        fileToUpload = await imageCompression(file, options);
      }
      
      // Convert file to base64 for API upload and moderation
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(fileToUpload);
      });
      
      const fileData = await base64Promise;
      
      // Moderate file before uploading
      const moderationResponse = await fetch('/api/moderate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageData: fileData,
          fileName: file.name,
          fileType: file.type
        })
      });
      
      const moderationResult = await moderationResponse.json();
      
      if (moderationResult.flagged || !moderationResult.approved) {
        const categories = moderationResult.flaggedCategories?.join(', ') || moderationResult.message || 'inappropriate content';
        setError(`⚠️ File Rejected: This file contains ${categories}. Please select a different file.`);
        setUploadingFile(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      // Upload via API route
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData,
          fileName: file.name,
          userId: currentUserId,
          contentType: file.type,
          fileType: file.type
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload file');
      }
      
      // Determine file type for display
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      const isOfficeDoc = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExtension);
      const isTextFile = ['txt', 'csv', 'rtf'].includes(fileExtension);
      
      // Add to uploaded files array
      const newFile = {
        id: Date.now().toString(),
        url: result.url,
        file: fileToUpload,
        type: isImage ? 'image' as const : 'document' as const,
        name: file.name,
        extension: fileExtension,
        isOfficeDoc,
        isTextFile
      };
      
      setUploadedFiles(prev => [...prev, newFile]);
      
    } catch (error: any) {
      console.error('File upload error:', error);
      setError(error.message || 'Failed to upload file. Please try again.');
    } finally {
      setUploadingFile(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove uploaded file
  const removeFile = async (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (!file) return;

    try {
      // Extract file path from public URL
      const url = new URL(file.url);
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/need-attachments\/(.+)/);
      if (pathMatch && pathMatch[1]) {
        const filePath = pathMatch[1];
        await supabase.storage.from('need-attachments').remove([filePath]);
      }
    } catch (error) {
      console.error('Error deleting file from storage:', error);
    }

    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      setError('You must be logged in to comment');
      return;
    }

    if (!newComment.trim() && uploadedFiles.length === 0) {
      setError('Please enter a comment or attach media');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // AI moderate the comment text - conduct check
      if (newComment.trim()) {
        try {
        const textModeration = await contentModerator.moderateText(newComment);
        if (!textModeration.approved) {
            const reasons = textModeration.reasons.length > 0 
              ? textModeration.reasons.join(', ') 
              : 'inappropriate content detected';
            setError(`⚠️ Content not approved: ${reasons}. Please revise your message.`);
            setSubmitting(false);
            return;
          }
        } catch (modError: any) {
          console.error('Text moderation error:', modError);
          setError('⚠️ Unable to verify content safety. Please try again.');
          setSubmitting(false);
          return;
        }
      }

      // Verify uploaded files have been moderated (they should be moderated during upload)
      // Double-check that all files passed moderation
      const unmoderatedFiles = uploadedFiles.filter(f => !f.url);
      if (unmoderatedFiles.length > 0) {
        setError('⚠️ Some files are still being processed. Please wait and try again.');
        setSubmitting(false);
        return;
      }

      // Prepare media attachments from uploadedFiles
      const approvedMedia = uploadedFiles.map(f => ({
        id: f.id,
        filename: f.name,
        type: f.type,
        mime_type: f.file.type,
        size: f.file.size,
        url: f.url,
        uploaded_at: new Date().toISOString(),
        moderation_status: 'approved' as const,
        moderation_reason: undefined
      }));

      // Insert comment - link to fulfillment if provided (connection-based chat)
      const { data, error } = await supabase
        .from('need_comments')
        .insert({
          need_id: needId,
          user_id: currentUserId,
          fulfillment_id: fulfillmentId || null, // Link to active fulfillment/connection
          message: newComment.trim() || null,
          attachments: approvedMedia.length > 0 ? approvedMedia : null,
          attachment_count: approvedMedia.length,
          moderation_status: 'approved'
        })
        .select('*')
        .single();

      if (error) throw error;

      const [enrichedComment] = await attachProfiles([data]);

      setComments(prev => [...prev, enrichedComment || data]);
      setNewComment('');
      setUploadedFiles([]);

    } catch (error: any) {
      console.error('Error submitting comment:', error);
      // Provide more specific error messages
      if (error?.message) {
        setError(error.message);
      } else if (error?.error) {
        setError(error.error);
      } else {
        setError('Failed to post. Please check your connection and try again.');
      }
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
        {comments.length > 0 && comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
              {/* Comment Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                    {comment.user_profile?.display_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {comment.user_profile?.display_name || 'Anonymous User'}
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
          ))}
      </div>

      {/* New Comment Form */}
      {currentUserId && (
        <form onSubmit={handleSubmitComment} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="space-y-3">
            {/* File Upload - Images and Documents only, no videos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attach photos or documents (optional)
              </label>
              <div className="text-xs text-blue-600 mb-2">
                💡 Share photos of items you can provide, receipts, or helpful documents
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.odt,.ods,.odp"
                onChange={handleFileSelect}
                className="hidden"
                disabled={submitting || uploadingFile}
              />
              
              {/* Upload Button */}
              {uploadedFiles.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting || uploadingFile}
                  className="w-full px-3 py-2 rounded border-2 border-dashed border-gray-300 text-xs font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploadingFile ? '⏳ Processing & Checking Safety...' : '📎 Add Photo or Document (No Videos)'}
                </button>
              )}
              
              {/* File Previews */}
              {uploadedFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {uploadedFiles.map((file) => {
                    // Determine icon based on file type
                    let icon = '📄';
                    if (file.type === 'image') {
                      icon = '🖼️';
                    } else if (file.isOfficeDoc) {
                      const ext = file.extension || '';
                      if (['doc', 'docx'].includes(ext)) icon = '📝';
                      else if (['xls', 'xlsx'].includes(ext)) icon = '📊';
                      else if (['ppt', 'pptx'].includes(ext)) icon = '📽️';
                    } else if (file.extension === 'pdf') {
                      icon = '📕';
                    } else if (file.isTextFile) {
                      icon = '📄';
                    }
                    
                    return (
                      <div key={file.id} className="relative group">
                        {file.type === 'image' ? (
                          <img
                            src={file.url}
                            alt="Upload preview"
                            className="w-full h-20 object-cover rounded border border-gray-200"
                          />
                        ) : (
                          <div className="w-full h-20 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-2xl mb-1">{icon}</div>
                              <div className="text-[8px] text-gray-600 truncate px-1" title={file.name}>
                                {file.name.length > 15 ? file.name.substring(0, 15) + '...' : file.name}
                              </div>
                            </div>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-colors opacity-90 hover:opacity-100"
                          title="Remove file"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {uploadedFiles.length > 0 && (
                <p className="text-[9px] text-gray-500 mt-1">
                  ✅ {uploadedFiles.filter(f => f.type === 'image').length > 0 ? 'Images auto-compressed. ' : ''}
                  {uploadedFiles.filter(f => f.isOfficeDoc).length > 0 ? 'Office files already compressed. ' : ''}
                  All files checked for safety ({uploadedFiles.length}/5)
                </p>
              )}
            </div>

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
                  setUploadedFiles([]);
                  setError(null);
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                disabled={submitting}
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={submitting || (!newComment.trim() && uploadedFiles.length === 0)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Posting...
                  </span>
                ) : (
                  'Post'
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {!currentUserId && (
        <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <a href={loginWithRedirect} className="font-medium hover:underline">Sign in</a> to offer help or ask questions
          </p>
        </div>
      )}
    </div>
  );
}