import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { contentModerator } from '@/lib/contentModerator';

interface OfferAttachment {
  id: string;
  filename: string;
  type: 'qr_code' | 'screenshot' | 'order_number' | 'photo' | 'video' | 'other';
  mime_type: string;
  size: number;
  url: string;
  uploaded_at: string;
  description?: string;
  moderation_status?: 'approved' | 'pending' | 'rejected' | 'flagged';
  moderation_reason?: string;
}

interface OfferUploadProps {
  fulfillmentId: string;
  userId: string;
  onUploadComplete: (attachments: OfferAttachment[]) => void;
  onClose: () => void;
}

export default function OfferUpload({ fulfillmentId, userId, onUploadComplete, onClose }: OfferUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [moderating, setModerating] = useState(false);
  const [attachmentType, setAttachmentType] = useState<OfferAttachment['type']>('photo');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Enhanced file validation
    const maxSizeVideo = 50 * 1024 * 1024; // 50MB for videos
    const maxSizeImage = 10 * 1024 * 1024; // 10MB for images
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/mov'];
    const allowedDocTypes = ['application/pdf'];
    const allAllowedTypes = [...allowedImageTypes, ...allowedVideoTypes, ...allowedDocTypes];
    
    if (!allAllowedTypes.includes(file.type)) {
      setError('File type not supported. Use JPG, PNG, WebP, GIF, MP4, WebM, MOV, or PDF');
      return;
    }

    const isVideo = allowedVideoTypes.includes(file.type);
    const isImage = allowedImageTypes.includes(file.type);
    const maxSize = isVideo ? maxSizeVideo : maxSizeImage;
    
    if (file.size > maxSize) {
      setError(`File size must be under ${maxSize / 1024 / 1024}MB for ${isVideo ? 'videos' : 'images'}`);
      return;
    }

    // Auto-set attachment type based on file
    if (isImage) {
      setAttachmentType('photo');
    } else if (isVideo) {
      setAttachmentType('video');
    }

    // Create preview for images
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }

    setUploading(true);
    setModerating(true);
    setError(null);

    try {
      // AI Content Moderation
      console.log('Starting AI moderation for:', file.name);
      
      let moderationResult;
      if (isImage) {
        const buffer = await file.arrayBuffer();
        moderationResult = await contentModerator.moderateImage(Buffer.from(buffer), file.name);
      } else if (isVideo) {
        const buffer = await file.arrayBuffer();
        moderationResult = await contentModerator.moderateVideo(Buffer.from(buffer), file.name);
      } else {
        // For PDFs, just check filename and basic validation
        moderationResult = {
          approved: true,
          confidence: 0.8,
          reasons: ['Document type approved'],
          category: 'safe' as const,
          suggestedAction: 'approve' as const
        };
      }

      // Also moderate the description if provided
      if (description.trim()) {
        const textModeration = await contentModerator.moderateText(description);
        if (!textModeration.approved) {
          moderationResult = {
            approved: false,
            confidence: textModeration.confidence,
            reasons: ['Description: ' + textModeration.reasons.join(', ')],
            category: textModeration.category,
            suggestedAction: textModeration.suggestedAction
          };
        }
      }

      setModerating(false);

      if (!moderationResult.approved) {
        setError(`Content not approved: ${moderationResult.reasons.join(', ')}`);
        setUploading(false);
        return;
      }

      console.log('Content approved by AI moderation:', moderationResult);
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${fulfillmentId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('offer-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL (with auth required)
      const { data: urlData } = supabase.storage
        .from('offer-attachments')
        .getPublicUrl(fileName);

      // Create attachment object with moderation status
      const newAttachment: OfferAttachment = {
        id: crypto.randomUUID(),
        filename: file.name,
        type: attachmentType,
        mime_type: file.type,
        size: file.size,
        url: fileName, // Store storage path, not full URL
        uploaded_at: new Date().toISOString(),
        description: description.trim() || undefined,
        moderation_status: moderationResult.approved ? 'approved' : 'flagged',
        moderation_reason: moderationResult.reasons.join(', ')
      };

      // Update fulfillment record with attachment
      const { data: currentFulfillment, error: fetchError } = await supabase
        .from('fulfillment')
        .select('attachments')
        .eq('id', fulfillmentId)
        .single();

      if (fetchError) throw fetchError;

      const currentAttachments = currentFulfillment.attachments || [];
      const updatedAttachments = [...currentAttachments, newAttachment];

      const { error: updateError } = await supabase
        .from('fulfillment')
        .update({
          attachments: updatedAttachments,
          attachment_count: updatedAttachments.length,
          last_attachment_at: new Date().toISOString()
        })
        .eq('id', fulfillmentId);

      if (updateError) throw updateError;

      onUploadComplete(updatedAttachments);
      setDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Upload Offer Details</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Attachment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What are you sharing?
            </label>
            <select
              value={attachmentType}
              onChange={(e) => setAttachmentType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="photo">📷 Photo</option>
              <option value="video">🎥 Video</option>
              <option value="screenshot">📱 Screenshot</option>
              <option value="qr_code">📱 QR Code</option>
              <option value="order_number">🧾 Order Confirmation</option>
              <option value="other">📄 Other Document</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="E.g., 'QR code for store pickup', 'Order #12345'"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              maxLength={100}
            />
          </div>

          {/* Preview Area */}
          {preview && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview
              </label>
              <div className="border border-gray-200 rounded-md p-2">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="max-w-full h-auto max-h-40 mx-auto rounded"
                />
              </div>
            </div>
          )}

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-gray-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                accept="image/*,video/mp4,video/webm,video/mov,application/pdf"
                disabled={uploading || moderating}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-2"
              />
              <p className="text-xs text-gray-500">
                📷 Images: JPG, PNG, WebP, GIF (max 10MB)<br/>
                🎥 Videos: MP4, WebM, MOV (max 50MB)<br/>
                📄 Documents: PDF (max 10MB)
              </p>
              {moderating && (
                <p className="text-xs text-blue-600 mt-2">
                  🤖 AI checking content for safety...
                </p>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Upload Status */}
          {uploading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-sm text-gray-600">Uploading...</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300"
          >
            {uploading ? 'Uploading...' : 'Choose File'}
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs text-blue-700">
            💡 <strong>Tip:</strong> Upload QR codes for easy pickup, screenshots of confirmations, or order numbers to help coordinate with the requester.
          </p>
        </div>
      </div>
    </div>
  );
}