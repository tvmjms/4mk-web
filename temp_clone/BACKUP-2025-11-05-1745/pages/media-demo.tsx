// pages/media-demo.tsx
// Comprehensive demonstration of AI-moderated media upload with sustainability tracking

import React, { useState } from 'react';
import Head from 'next/head';
import MediaUpload from '@/components/MediaUpload';
import MediaViewer from '@/components/MediaViewer';
import SustainabilityDashboard, { useSustainabilityTracking } from '@/components/SustainabilityDashboard';

interface MediaFile {
  id: string;
  file: File;
  preview?: string;
  type: 'image' | 'video' | 'document';
  uploading: boolean;
  moderating: boolean;
  moderation_status?: 'approved' | 'pending' | 'rejected' | 'flagged';
  moderation_reason?: string;
  uploaded_url?: string;
  signed_url?: string;
  optimization_info?: {
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
    carbonSavings: string;
  };
}

export default function MediaDemo() {
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  const { stats } = useSustainabilityTracking();

  const handleMediaUpdate = (files: MediaFile[]) => {
    setSelectedFiles(files);
  };

  const approvedFiles = selectedFiles.filter(f => f.moderation_status === 'approved' && f.signed_url);
  const pendingFiles = selectedFiles.filter(f => f.moderation_status === 'pending' || f.moderating);
  const rejectedFiles = selectedFiles.filter(f => f.moderation_status === 'rejected' || f.moderation_status === 'flagged');

  return (
    <>
      <Head>
        <title>AI Media Upload Demo - Sustainable & Secure</title>
        <meta name="description" content="Demonstration of AI-powered media upload with content moderation and environmental optimization" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🚀 AI Media Upload System
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Upload images, videos, and documents with <strong>AI content moderation</strong>, 
              automatic <strong>environmental optimization</strong>, and real-time sustainability tracking.
            </p>
            
            <div className="flex justify-center gap-4 mt-6">
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-100 px-3 py-1 rounded-full">
                🤖 AI Content Safety
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                🌍 Carbon Footprint Reduction
              </div>
              <div className="flex items-center gap-2 text-sm text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                📊 Real-time Analytics
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Upload Area */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  📁 Upload Media Files
                </h2>
                <p className="text-gray-600 mb-6">
                  Drag & drop or click to select images, videos, or PDFs. 
                  All content is automatically screened by AI and optimized for sustainability.
                </p>
                
                <MediaUpload 
                  onMediaUpdate={handleMediaUpdate}
                  maxFiles={8}
                />
              </div>

              {/* File Status Overview */}
              {selectedFiles.length > 0 && (
                <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    📊 Upload Status Overview
                  </h3>
                  
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600">{approvedFiles.length}</div>
                      <div className="text-sm text-green-700">✅ Approved</div>
                    </div>
                    
                    <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="text-2xl font-bold text-yellow-600">{pendingFiles.length}</div>
                      <div className="text-sm text-yellow-700">⏳ Processing</div>
                    </div>
                    
                    <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-2xl font-bold text-red-600">{rejectedFiles.length}</div>
                      <div className="text-sm text-red-700">❌ Rejected</div>
                    </div>
                  </div>

                  {/* Advanced Stats Toggle */}
                  <div className="text-center">
                    <button
                      onClick={() => setShowAdvancedStats(!showAdvancedStats)}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      {showAdvancedStats ? 'Hide' : 'Show'} Advanced Statistics
                    </button>
                  </div>

                  {showAdvancedStats && (
                    <div className="mt-4 grid md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-gray-50 p-3 rounded">
                        <strong>Content Safety:</strong><br />
                        • AI moderation using OpenAI GPT-4 Vision<br />
                        • Personal information detection<br />
                        • Inappropriate content filtering
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <strong>Optimization:</strong><br />
                        • Automatic WebP conversion<br />
                        • Responsive image variants<br />
                        • Real-time carbon calculations
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Media Viewer for Approved Files */}
              {approvedFiles.length > 0 && (
                <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    🖼️ Approved Media Gallery
                  </h3>
                  <MediaViewer 
                    attachments={approvedFiles.map(f => ({
                      id: f.id,
                      url: f.signed_url!,
                      type: f.type,
                      mime_type: f.file.type,
                      filename: f.file.name,
                      moderation_status: f.moderation_status,
                      size: f.file.size,
                      uploaded_at: new Date().toISOString()
                    }))}
                    bucket="need-attachments"
                    showModeration={true}
                  />
                </div>
              )}
            </div>

            {/* Sidebar with Sustainability Dashboard */}
            <div className="space-y-6">
              {/* Global Sustainability Stats */}
              <SustainabilityDashboard stats={stats} />

              {/* Features Panel */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  ⚡ System Features
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <div>
                      <strong>AI Content Moderation</strong><br />
                      <span className="text-gray-600">Automatically screens for inappropriate content</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <div>
                      <strong>Smart Optimization</strong><br />
                      <span className="text-gray-600">Reduces file sizes while maintaining quality</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <div>
                      <strong>Environmental Impact</strong><br />
                      <span className="text-gray-600">Tracks and minimizes carbon footprint</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <div>
                      <strong>Secure Storage</strong><br />
                      <span className="text-gray-600">Encrypted uploads with signed URLs</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Info */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-800 mb-3">
                  🔧 Technical Stack
                </h3>
                <div className="text-xs space-y-2 text-purple-700">
                  <div><strong>AI:</strong> OpenAI GPT-4 Vision API</div>
                  <div><strong>Storage:</strong> Supabase with RLS</div>
                  <div><strong>Optimization:</strong> Canvas API + WebP</div>
                  <div><strong>Security:</strong> Content-based validation</div>
                  <div><strong>Analytics:</strong> Real-time tracking</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center text-gray-500 text-sm">
            <p>
              🌟 This system combines <strong>AI safety</strong>, <strong>environmental responsibility</strong>, 
              and <strong>user experience</strong> for the next generation of media uploads.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}