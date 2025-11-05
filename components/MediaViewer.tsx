// components/MediaViewer.tsx
// Responsive media viewer with moderation status and safety features

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface MediaAttachment {
  id: string;
  filename: string;
  type: string;
  mime_type: string;
  size: number;
  url: string;
  uploaded_at: string;
  moderation_status?: 'approved' | 'pending' | 'rejected' | 'flagged';
  moderation_reason?: string;
}

interface MediaViewerProps {
  attachments: MediaAttachment[];
  bucket: string;
  showModeration?: boolean;
  maxDisplay?: number;
}

export default function MediaViewer({ 
  attachments, 
  bucket, 
  showModeration = false,
  maxDisplay = 6 
}: MediaViewerProps) {
  const [selectedMedia, setSelectedMedia] = useState<MediaAttachment | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [loadingUrls, setLoadingUrls] = useState<Record<string, boolean>>({});

  const getSignedUrl = async (attachment: MediaAttachment) => {
    if (imageUrls[attachment.id]) return imageUrls[attachment.id];
    if (loadingUrls[attachment.id]) return null;

    setLoadingUrls(prev => ({ ...prev, [attachment.id]: true }));

    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(attachment.url, 3600); // 1 hour expiry

      if (error) throw error;

      setImageUrls(prev => ({ ...prev, [attachment.id]: data.signedUrl }));
      setLoadingUrls(prev => ({ ...prev, [attachment.id]: false }));
      
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      setLoadingUrls(prev => ({ ...prev, [attachment.id]: false }));
      return null;
    }
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');
  const isVideo = (mimeType: string) => mimeType.startsWith('video/');
  const isPdf = (mimeType: string) => mimeType === 'application/pdf';

  const getModerationIcon = (status?: string) => {
    switch (status) {
      case 'approved': return '✅';
      case 'pending': return '⏳';
      case 'rejected': return '❌';
      case 'flagged': return '⚠️';
      default: return '';
    }
  };

  const getModerationColor = (status?: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      case 'flagged': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Filter out rejected content unless showModeration is true
  const visibleAttachments = attachments.filter(att => 
    showModeration || att.moderation_status !== 'rejected'
  ).slice(0, maxDisplay);

  if (visibleAttachments.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
        {visibleAttachments.map((attachment) => (
          <MediaThumbnail
            key={attachment.id}
            attachment={attachment}
            getSignedUrl={getSignedUrl}
            onClick={() => setSelectedMedia(attachment)}
            showModeration={showModeration}
            getModerationIcon={getModerationIcon}
            getModerationColor={getModerationColor}
            isImage={isImage}
            isVideo={isVideo}
            isPdf={isPdf}
          />
        ))}
        
        {attachments.length > maxDisplay && (
          <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center text-gray-600">
              <div className="text-2xl mb-1">📁</div>
              <div className="text-xs">
                +{attachments.length - maxDisplay} more
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full-size Modal */}
      {selectedMedia && (
        <MediaModal
          attachment={selectedMedia}
          getSignedUrl={getSignedUrl}
          onClose={() => setSelectedMedia(null)}
          showModeration={showModeration}
          getModerationIcon={getModerationIcon}
          getModerationColor={getModerationColor}
          isImage={isImage}
          isVideo={isVideo}
          isPdf={isPdf}
        />
      )}
    </>
  );
}

interface MediaThumbnailProps {
  attachment: MediaAttachment;
  getSignedUrl: (attachment: MediaAttachment) => Promise<string | null>;
  onClick: () => void;
  showModeration: boolean;
  getModerationIcon: (status?: string) => string;
  getModerationColor: (status?: string) => string;
  isImage: (mimeType: string) => boolean;
  isVideo: (mimeType: string) => boolean;
  isPdf: (mimeType: string) => boolean;
}

function MediaThumbnail({
  attachment,
  getSignedUrl,
  onClick,
  showModeration,
  getModerationIcon,
  getModerationColor,
  isImage,
  isVideo,
  isPdf
}: MediaThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isImage(attachment.mime_type)) {
      setLoading(true);
      getSignedUrl(attachment).then(url => {
        setThumbnailUrl(url);
        setLoading(false);
      });
    }
  }, [attachment.id]);

  return (
    <div className="relative group">
      <div 
        onClick={onClick}
        className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
      >
        {loading && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {isImage(attachment.mime_type) && thumbnailUrl && !loading && (
          <img
            src={thumbnailUrl}
            alt={attachment.filename}
            className="w-full h-full object-cover"
          />
        )}
        
        {isVideo(attachment.mime_type) && (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <div className="text-center">
              <div className="text-3xl mb-1">🎥</div>
              <div className="text-xs text-gray-600 px-2 truncate">
                {attachment.filename}
              </div>
            </div>
          </div>
        )}
        
        {isPdf(attachment.mime_type) && (
          <div className="w-full h-full flex items-center justify-center bg-red-50">
            <div className="text-center">
              <div className="text-3xl mb-1">📄</div>
              <div className="text-xs text-gray-600 px-2 truncate">
                {attachment.filename}
              </div>
            </div>
          </div>
        )}
        
        {/* Play button overlay for videos */}
        {isVideo(attachment.mime_type) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/50 rounded-full p-2">
              <div className="w-6 h-6 text-white">▶️</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Moderation Status Badge */}
      {showModeration && attachment.moderation_status && (
        <div className={`absolute top-1 right-1 px-1 py-0.5 rounded text-xs ${getModerationColor(attachment.moderation_status)}`}>
          {getModerationIcon(attachment.moderation_status)}
        </div>
      )}
      
      {/* File Size */}
      <div className="absolute bottom-1 left-1 bg-black/70 text-white px-1 py-0.5 rounded text-xs">
        {(attachment.size / 1024 / 1024).toFixed(1)}MB
      </div>
    </div>
  );
}

interface MediaModalProps {
  attachment: MediaAttachment;
  getSignedUrl: (attachment: MediaAttachment) => Promise<string | null>;
  onClose: () => void;
  showModeration: boolean;
  getModerationIcon: (status?: string) => string;
  getModerationColor: (status?: string) => string;
  isImage: (mimeType: string) => boolean;
  isVideo: (mimeType: string) => boolean;
  isPdf: (mimeType: string) => boolean;
}

function MediaModal({
  attachment,
  getSignedUrl,
  onClose,
  showModeration,
  getModerationIcon,
  getModerationColor,
  isImage,
  isVideo,
  isPdf
}: MediaModalProps) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    getSignedUrl(attachment).then(url => {
      setMediaUrl(url);
      setLoading(false);
    });
  }, [attachment.id]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold truncate">{attachment.filename}</h3>
            <p className="text-sm text-gray-500">
              {(attachment.size / 1024 / 1024).toFixed(1)} MB • {new Date(attachment.uploaded_at).toLocaleDateString()}
            </p>
          </div>
          
          {showModeration && attachment.moderation_status && (
            <div className={`mr-3 px-2 py-1 rounded text-sm ${getModerationColor(attachment.moderation_status)}`}>
              {getModerationIcon(attachment.moderation_status)} {attachment.moderation_status}
              {attachment.moderation_reason && (
                <div className="text-xs mt-1">{attachment.moderation_reason}</div>
              )}
            </div>
          )}
          
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        
        {/* Media Content */}
        <div className="p-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          {mediaUrl && isImage(attachment.mime_type) && !loading && (
            <img
              src={mediaUrl}
              alt={attachment.filename}
              className="max-w-full h-auto mx-auto rounded-lg"
            />
          )}
          
          {mediaUrl && isVideo(attachment.mime_type) && !loading && (
            <video
              src={mediaUrl}
              controls
              className="max-w-full h-auto mx-auto rounded-lg"
            >
              Your browser does not support video playback.
            </video>
          )}
          
          {mediaUrl && isPdf(attachment.mime_type) && !loading && (
            <div className="text-center">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-gray-600 mb-4">PDF documents open in a new tab for security.</p>
              <a
                href={mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                📄 Open PDF
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}