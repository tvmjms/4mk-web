import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import MediaUpload from '@/components/MediaUpload';

interface OfferFormProps {
  needId: string;
  needTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EnhancedOfferForm({ needId, needTitle, onClose, onSuccess }: OfferFormProps) {
  const [formData, setFormData] = useState({
    offerType: 'general' as 'general' | 'digital_service' | 'store_pickup' | 'service_booking',
    message: '',
    offerDescription: '',
    contactMethod: 'email' as 'email' | 'platform_message'
  });
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const offerTypeLabels = {
    general: 'General Help',
    digital_service: 'Digital Service (Codes/Orders)',
    store_pickup: 'Store Pickup',
    service_booking: 'Service Booking'
  };

  const offerTypeDescriptions = {
    general: 'Advice, explanations, or information help',
    digital_service: 'Order online services, provide pickup codes (for requester pickup)',
    store_pickup: 'Buy items at store, arrange requester pickup with confirmation',
    service_booking: 'Make appointments/reservations in your name (for requester)'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('Please log in to submit an offer');
      }
      
      const response = await fetch('/api/fulfillment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          needId,
          message: formData.message,
          offerType: formData.offerType,
          offerDescription: formData.offerDescription,
          contactMethod: formData.contactMethod
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit offer');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
        <div className="p-5">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 pr-2">
              <h2 className="text-base font-semibold text-slate-800 leading-tight">
                Offer Help
              </h2>
              <p className="text-xs text-slate-600 mt-1 truncate">{needTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-lg flex-shrink-0"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Offer Type Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Type of Help *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(offerTypeLabels).map(([key, label]) => (
                  <label key={key} className="flex items-start space-x-2 cursor-pointer p-2 hover:bg-slate-50 rounded border">
                    <input
                      type="radio"
                      name="offerType"
                      value={key}
                      checked={formData.offerType === key}
                      onChange={(e) => setFormData({ ...formData, offerType: e.target.value as any })}
                      className="mt-0.5 text-turquoise-600 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-800 text-xs">{label}</div>
                      <div className="text-[10px] text-slate-600 mt-0.5 leading-tight">
                        {offerTypeDescriptions[key as keyof typeof offerTypeDescriptions]}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Offer Description for non-general types */}
            {formData.offerType !== 'general' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Specific Details *
                </label>
                <textarea
                  value={formData.offerDescription}
                  onChange={(e) => setFormData({ ...formData, offerDescription: e.target.value })}
                  placeholder={
                    formData.offerType === 'digital_service' 
                      ? 'e.g., "I can order DoorDash and send you the pickup code via email"'
                      : formData.offerType === 'store_pickup'
                      ? 'e.g., "I can buy groceries at Walmart and arrange pickup with confirmation number"'
                      : 'e.g., "I can make a doctor appointment in your name and send details"'
                  }
                  className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-turquoise-500 focus:border-turquoise-500"
                  rows={3}
                  required
                />
              </div>
            )}

            {/* General Message */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {formData.offerType === 'general' ? 'Message *' : 'Additional Notes'}
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder={
                  formData.offerType === 'general' 
                    ? "Describe how you can help..."
                    : "Any additional information or questions..."
                }
                className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-turquoise-500 focus:border-turquoise-500"
                rows={3}
                required={formData.offerType === 'general'}
              />
            </div>

            {/* Contact Method */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                How should we coordinate?
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="contactMethod"
                    value="email"
                    checked={formData.contactMethod === 'email'}
                    onChange={(e) => setFormData({ ...formData, contactMethod: e.target.value as any })}
                    className="text-turquoise-600"
                  />
                  <span className="text-sm text-slate-700">
                    Email (I'll share codes/details via email)
                  </span>
                </label>
              </div>
            </div>

            {/* Media Upload */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Attach Photos or Documents (Optional)
              </label>
              <div className="text-xs text-blue-600 mb-2">
                💡 Share photos of items you can provide, receipts, or helpful documents
              </div>
              <MediaUpload 
                onMediaUpdate={setMediaFiles}
                maxFiles={3}
                disabled={isSubmitting}
              />
            </div>

            {/* Legal Disclaimers */}
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md text-xs">
              <p className="font-medium text-yellow-800 mb-2">📋 Important Guidelines:</p>
              <ul className="text-yellow-700 space-y-1">
                <li>• Keep all communications appropriate and legal</li>
                <li>• Requester must communicate and verify any allergies/dietary restrictions</li>
                <li>• 4MK and helpers are not liable for any issues or miscommunications</li>
                <li>• Communications through this platform are stored for safety and record-keeping</li>
                <li>• Share images/videos via email if needed (not captured in system)</li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-turquoise-600 text-white rounded-md hover:bg-turquoise-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Offer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}