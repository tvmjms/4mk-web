// components/MediaUpload.tsx
// Comprehensive media upload component for needs creation with AI moderation

import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { contentModerator } from '@/lib/contentModerator';
import { mediaOptimizer } from '@/lib/mediaOptimizer';

interface MediaFile {
  id: string;
  file: File;
  preview?: string;
  type: 'image' | 'video' | 'document';
  uploading: boolean;
  moderating: boolean;
  optimizing?: boolean;
  moderation_status?: 'approved' | 'pending' | 'rejected' | 'flagged';
  moderation_reason?: string;
  uploaded_url?: string;
  optimization_info?: {
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
    carbonSavings: string;
  };
  optimizedFiles?: {
    thumbnail?: Blob;
    preview?: Blob;
    full?: Blob;
  };
}

interface MediaUploadProps {
  onMediaUpdate: (mediaFiles: MediaFile[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export default function MediaUpload({ onMediaUpdate, maxFiles = 5, disabled = false }: MediaUploadProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList) => {
    if (disabled) return;
    
    const newFiles = Array.from(files).slice(0, maxFiles - mediaFiles.length);
    
    for (const file of newFiles) {
      // Basic validation
      const maxSizeVideo = 50 * 1024 * 1024; // 50MB for videos
      const maxSizeImage = 10 * 1024 * 1024; // 10MB for images/docs
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/mov'];
      const allowedDocTypes = ['application/pdf'];
      const allAllowedTypes = [...allowedImageTypes, ...allowedVideoTypes, ...allowedDocTypes];
      
      if (!allAllowedTypes.includes(file.type)) {
        alert(`File type not supported: ${file.name}\nAllowed: JPG, PNG, WebP, GIF, MP4, WebM, MOV, PDF`);
        continue;
      }

      const isVideo = allowedVideoTypes.includes(file.type);
      const isImage = allowedImageTypes.includes(file.type);
      const maxSize = isVideo ? maxSizeVideo : maxSizeImage;
      
      if (file.size > maxSize) {
        alert(`File too large: ${file.name}\nMax size: ${maxSize / 1024 / 1024}MB`);
        continue;
      }

      // Create media file object
      const mediaFile: MediaFile = {
        id: crypto.randomUUID(),
        file,
        type: isImage ? 'image' : isVideo ? 'video' : 'document',
        uploading: false,
        moderating: true,
        optimizing: false,
        moderation_status: 'pending'
      };

      // Add to state immediately
      setMediaFiles(prev => [...prev, mediaFile]);

      // Start optimization for images
      if (isImage) {
        optimizeAndCreatePreview(mediaFile);
      } else if (isVideo) {
        analyzeVideo(mediaFile);
      } else {
        // For documents, just create a generic preview
        setMediaFiles(prev => 
          prev.map(f => 
            f.id === mediaFile.id 
              ? { ...f, preview: undefined }
              : f
          )
        );
      }
      
      // Start AI moderation
      moderateFile(mediaFile);
    }
  };

  const optimizeAndCreatePreview = async (mediaFile: MediaFile) => {
    setMediaFiles(prev => 
      prev.map(f => 
        f.id === mediaFile.id ? { ...f, optimizing: true } : f
      )
    );

    try {
      // Create responsive variants for sustainable loading
      const variants = await mediaOptimizer.createResponsiveVariants(mediaFile.file);
      
      // Create preview URL from thumbnail
      const previewUrl = URL.createObjectURL(variants.thumbnail.optimizedBlob);
      
      setMediaFiles(prev => 
        prev.map(f => 
          f.id === mediaFile.id 
            ? { 
                ...f, 
                optimizing: false,
                preview: previewUrl,
                optimization_info: {
                  originalSize: mediaFile.file.size,
                  optimizedSize: variants.full.optimizedSize,
                  compressionRatio: variants.totalSavings.compressionRatio,
                  carbonSavings: variants.totalSavings.carbonFootprintReduction
                },
                optimizedFiles: {
                  thumbnail: variants.thumbnail.optimizedBlob,
                  preview: variants.preview.optimizedBlob,
                  full: variants.full.optimizedBlob
                }
              }
            : f
        )
      );
    } catch (error) {
      console.error('Optimization error:', error);
      setMediaFiles(prev => 
        prev.map(f => 
          f.id === mediaFile.id 
            ? { ...f, optimizing: false }
            : f
        )
      );
      
      // Fallback to original preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaFiles(prev => 
          prev.map(f => 
            f.id === mediaFile.id 
              ? { ...f, preview: e.target?.result as string }
              : f
          )
        );
      };
      reader.readAsDataURL(mediaFile.file);
    }
  };

  const analyzeVideo = async (mediaFile: MediaFile) => {
    try {
      const analysis = await mediaOptimizer.optimizeVideo(mediaFile.file);
      
      setMediaFiles(prev => 
        prev.map(f => 
          f.id === mediaFile.id 
            ? { 
                ...f, 
                optimization_info: {
                  originalSize: analysis.originalSize,
                  optimizedSize: analysis.estimatedOptimizedSize,
                  compressionRatio: analysis.originalSize / analysis.estimatedOptimizedSize,
                  carbonSavings: analysis.sustainabilityImpact.carbonFootprintReduction
                }
              }
            : f
        )
      );
    } catch (error) {
      console.error('Video analysis error:', error);
    }
  };

  const moderateFile = async (mediaFile: MediaFile) => {
    try {
      let moderationResult;
      
      if (mediaFile.type === 'image') {
        const buffer = await mediaFile.file.arrayBuffer();
        moderationResult = await contentModerator.moderateImage(Buffer.from(buffer), mediaFile.file.name);
      } else if (mediaFile.type === 'video') {
        const buffer = await mediaFile.file.arrayBuffer();
        moderationResult = await contentModerator.moderateVideo(Buffer.from(buffer), mediaFile.file.name);
      } else {
        // Documents - basic approval
        moderationResult = {
          approved: true,
          confidence: 0.8,
          reasons: ['Document type approved'],
          category: 'safe' as const,
          suggestedAction: 'approve' as const
        };
      }

      // Update moderation status
      setMediaFiles(prev => 
        prev.map(f => 
          f.id === mediaFile.id 
            ? { 
                ...f, 
                moderating: false,
                moderation_status: moderationResult.approved ? 'approved' : 'rejected',
                moderation_reason: moderationResult.reasons.join(', ')
              }
            : f
        )
      );

      // If rejected, show error
      if (!moderationResult.approved) {
        console.warn('Content rejected:', moderationResult.reasons);
      }

    } catch (error) {
      console.error('Moderation error:', error);
      setMediaFiles(prev => 
        prev.map(f => 
          f.id === mediaFile.id 
            ? { 
                ...f, 
                moderating: false,
                moderation_status: 'flagged',
                moderation_reason: 'Moderation service error'
              }
            : f
        )
      );
    }
  };

  const uploadFile = async (mediaFile: MediaFile) => {
    if (mediaFile.moderation_status !== 'approved') return;

    setMediaFiles(prev => 
      prev.map(f => 
        f.id === mediaFile.id ? { ...f, uploading: true } : f
      )
    );

    try {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2);
      
      // Upload optimized version if available, otherwise use original
      let fileToUpload = mediaFile.file;
      let fileExtension = mediaFile.file.name.split('.').pop();
      
      if (mediaFile.optimizedFiles?.full && mediaFile.type === 'image') {
        fileToUpload = new File(
          [mediaFile.optimizedFiles.full], 
          `optimized_${mediaFile.file.name.replace(/\.[^/.]+$/, '')}.webp`, 
          { type: 'image/webp' }
        );
        fileExtension = 'webp';
      }

      const fileName = `needs-media/${timestamp}-${randomId}.${fileExtension}`;
      
      console.log(`🌱 Sustainable upload: ${mediaFile.file.name}`);
      if (mediaFile.optimization_info) {
        console.log(`🌍 Environmental impact: ${mediaFile.optimization_info.carbonSavings} saved`);
        console.log(`📊 Compression: ${mediaFile.optimization_info.compressionRatio.toFixed(1)}x smaller`);
      }

      const { data, error } = await supabase.storage
        .from('need-attachments')
        .upload(fileName, fileToUpload);

      if (error) throw error;

      setMediaFiles(prev => 
        prev.map(f => 
          f.id === mediaFile.id 
            ? { ...f, uploading: false, uploaded_url: fileName }
            : f
        )
      );

    } catch (error) {
      console.error('Upload error:', error);
      setMediaFiles(prev => 
        prev.map(f => 
          f.id === mediaFile.id ? { ...f, uploading: false } : f
        )
      );
    }
  };

  const removeFile = (fileId: string) => {
    setMediaFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Notify parent component of changes
  React.useEffect(() => {
    onMediaUpdate(mediaFiles);
  }, [mediaFiles, onMediaUpdate]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : mediaFiles.length > 0
            ? 'border-gray-300 bg-gray-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/mp4,video/webm,video/mov,application/pdf"
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="space-y-2">
          <div className="text-4xl">📎</div>
          <div className="text-sm text-gray-600">
            <p className="font-medium">
              {mediaFiles.length === 0 
                ? 'Add photos, videos, or documents' 
                : `${mediaFiles.length}/${maxFiles} files selected`
              }
            </p>
            <p className="text-xs mt-1">
              Click to browse or drag & drop files here
            </p>
          </div>
          
          <div className="flex justify-center gap-4 text-xs text-gray-500">
            <span>📷 Images</span>
            <span>🎥 Videos</span>
            <span>📄 PDFs (10MB)</span>
          </div>
          

        </div>
      </div>

      {/* File List */}
      {mediaFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Attached Files:</p>
          {mediaFiles.map((mediaFile) => (
            <div 
              key={mediaFile.id} 
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
            >
              {/* Preview/Icon */}
              <div className="flex-shrink-0">
                {mediaFile.preview ? (
                  <img 
                    src={mediaFile.preview} 
                    alt="Preview" 
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-lg">
                    {mediaFile.type === 'video' ? '🎥' : '📄'}
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {mediaFile.file.name}
                </p>
                
                {/* Size and Optimization Info */}
                <div className="text-xs text-gray-500 space-y-0.5">
                  {mediaFile.optimization_info ? (
                    <div>
                      <span className="line-through">{(mediaFile.optimization_info.originalSize / 1024 / 1024).toFixed(1)} MB</span>
                      {' → '}
                      <span className="text-green-600 font-medium">
                        {(mediaFile.optimization_info.optimizedSize / 1024 / 1024).toFixed(1)} MB
                      </span>
                      <span className="text-green-600 ml-1">
                        ({mediaFile.optimization_info.compressionRatio.toFixed(1)}x smaller)
                      </span>
                    </div>
                  ) : (
                    <div>{(mediaFile.file.size / 1024 / 1024).toFixed(1)} MB</div>
                  )}
                  

                </div>
                
                {/* Status */}
                <div className="mt-1">
                  {mediaFile.optimizing && (
                    <span className="text-xs text-blue-600">🌱 Optimizing for Earth...</span>
                  )}
                  {mediaFile.moderating && !mediaFile.optimizing && (
                    <span className="text-xs text-blue-600">🤖 Checking content...</span>
                  )}
                  {mediaFile.uploading && (
                    <span className="text-xs text-blue-600">⬆️ Uploading optimized version...</span>
                  )}
                  {mediaFile.moderation_status === 'approved' && !mediaFile.uploading && !mediaFile.optimizing && (
                    <span className="text-xs text-green-600">✅ Ready - optimized & approved</span>
                  )}
                  {mediaFile.moderation_status === 'rejected' && (
                    <span className="text-xs text-red-600">❌ Content rejected: {mediaFile.moderation_reason}</span>
                  )}
                  {mediaFile.moderation_status === 'flagged' && (
                    <span className="text-xs text-yellow-600">⚠️ Needs review: {mediaFile.moderation_reason}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {mediaFile.moderation_status === 'approved' && !mediaFile.uploaded_url && (
                  <button
                    onClick={() => uploadFile(mediaFile)}
                    disabled={mediaFile.uploading}
                    className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    Upload
                  </button>
                )}
                
                <button
                  onClick={() => removeFile(mediaFile.id)}
                  className="text-gray-400 hover:text-red-500 p-1"
                  title="Remove file"
                >
                  ❌
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload All Button */}
      {mediaFiles.some(f => f.moderation_status === 'approved' && !f.uploaded_url) && (
        <div className="text-center">
          <button
            onClick={() => {
              mediaFiles
                .filter(f => f.moderation_status === 'approved' && !f.uploaded_url)
                .forEach(uploadFile);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Upload All Approved Files
          </button>
        </div>
      )}
    </div>
  );
}