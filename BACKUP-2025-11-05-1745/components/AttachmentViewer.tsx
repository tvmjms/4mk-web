import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface OfferAttachment {
  id: string;
  filename: string;
  type: 'qr_code' | 'screenshot' | 'order_number' | 'other';
  mime_type: string;
  size: number;
  url: string;
  uploaded_at: string;
  description?: string;
}

interface AttachmentViewerProps {
  attachments: OfferAttachment[];
  canDelete?: boolean;
  fulfillmentId?: string;
  onAttachmentsUpdate?: (attachments: OfferAttachment[]) => void;
}

export default function AttachmentViewer({ 
  attachments, 
  canDelete = false, 
  fulfillmentId,
  onAttachmentsUpdate 
}: AttachmentViewerProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingUrl, setViewingUrl] = useState<string | null>(null);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'qr_code': return '📱';
      case 'screenshot': return '📷';
      case 'order_number': return '📋';
      default: return '📎';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'qr_code': return 'QR Code';
      case 'screenshot': return 'Screenshot';
      case 'order_number': return 'Order Details';
      default: return 'Attachment';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / (1024 * 1024)) + ' MB';
  };

  const handleView = async (attachment: OfferAttachment) => {
    try {
      const { data } = await supabase.storage
        .from('offer-attachments')
        .createSignedUrl(attachment.url, 3600); // 1 hour expiry

      if (data?.signedUrl) {
        setViewingUrl(data.signedUrl);
      }
    } catch (error) {
      console.error('Error getting signed URL:', error);
      alert('Unable to load attachment');
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!fulfillmentId || !onAttachmentsUpdate) return;
    
    setDeletingId(attachmentId);
    
    try {
      // Find the attachment to get storage path
      const attachment = attachments.find(a => a.id === attachmentId);
      if (!attachment) return;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('offer-attachments')
        .remove([attachment.url]);

      if (storageError) throw storageError;

      // Update fulfillment record
      const updatedAttachments = attachments.filter(a => a.id !== attachmentId);
      
      const { error: updateError } = await supabase
        .from('fulfillment')
        .update({
          attachments: updatedAttachments,
          attachment_count: updatedAttachments.length,
          last_attachment_at: updatedAttachments.length > 0 ? new Date().toISOString() : null
        })
        .eq('id', fulfillmentId);

      if (updateError) throw updateError;

      onAttachmentsUpdate(updatedAttachments);
      
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete attachment');
    } finally {
      setDeletingId(null);
    }
  };

  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">
          📎 Shared Details ({attachments.length})
        </h4>
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded text-xs">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <span className="text-sm">{getTypeIcon(attachment.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {attachment.description || attachment.filename}
                  </p>
                  <p className="text-gray-500">
                    {getTypeLabel(attachment.type)} • {formatFileSize(attachment.size)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-1 ml-2">
                <button
                  onClick={() => handleView(attachment)}
                  className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                  title="View attachment"
                >
                  👁️
                </button>
                
                {canDelete && (
                  <button
                    onClick={() => handleDelete(attachment.id)}
                    disabled={deletingId === attachment.id}
                    className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 disabled:bg-red-300"
                    title="Delete attachment"
                  >
                    {deletingId === attachment.id ? '⏳' : '🗑️'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          💡 These files help coordinate pickup, orders, or verification
        </p>
      </div>

      {/* Image/PDF Viewer Modal */}
      {viewingUrl && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="relative bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <button
              onClick={() => setViewingUrl(null)}
              className="absolute top-2 right-2 z-10 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/75"
            >
              ×
            </button>
            
            {viewingUrl.includes('.pdf') ? (
              <iframe 
                src={viewingUrl} 
                className="w-full h-96"
                title="PDF Viewer"
              />
            ) : viewingUrl.includes('.mp4') || viewingUrl.includes('.webm') ? (
              <video 
                src={viewingUrl} 
                controls 
                className="max-w-full max-h-full"
              />
            ) : (
              <img 
                src={viewingUrl} 
                alt="Attachment" 
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}