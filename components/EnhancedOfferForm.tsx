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
    offerType: 'voucher' as 'voucher' | 'delivery' | 'pickup' | 'transport_credit' | 'shelter_credit' | 'general',
    message: '',
    offerDescription: '',
    contactMethod: 'email' as 'email' | 'platform_message',
    maxCashlessAmount: '',
    orderId: '',
    deliveryPreferences: '',
    brandPreference: '',
    caseManagerInfo: ''
  });
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const offerTypeLabels = {
    voucher: 'Gift Card / Voucher',
    delivery: 'Online Delivery',
    pickup: 'Retail Pickup',
    transport_credit: 'Transport Credit (Train/Bus)',
    shelter_credit: 'Shelter Aid',
    general: 'General Help'
  };

  const offerTypeDescriptions = {
    voucher: 'Gift cards or vouchers (voidable/reassignable if unused)',
    delivery: 'Online delivery services (intercept or refund possible)',
    pickup: 'Store pickup with confirmation (cancel or return possible)',
    transport_credit: 'Train/bus credits for travel assistance',
    shelter_credit: 'Shelter aid (processed only if case data verified)',
    general: 'Advice, explanations, or information help'
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
      
      // Upload proof file if provided
      let uploadedProofUrl = proofUrl;
      if (mediaFiles.length > 0 && !proofUrl) {
        // Upload the first file as proof
        const proofFile = mediaFiles[0];
        if (proofFile.uploaded_url) {
          uploadedProofUrl = proofFile.uploaded_url;
        }
      }

      // Validate max cashless amount
      let maxCashlessAmount: number | null = null;
      if (formData.maxCashlessAmount) {
        const amount = Number(formData.maxCashlessAmount);
        if (isNaN(amount) || amount < 0 || amount > 100) {
          throw new Error('Max cashless amount must be between $0 and $100');
        }
        maxCashlessAmount = amount;
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
          contactMethod: formData.contactMethod,
          maxCashlessAmount,
          orderId: formData.orderId || null,
          proofUrl: uploadedProofUrl,
          deliveryPreferences: formData.deliveryPreferences || null,
          brandPreference: formData.brandPreference || null,
          caseManagerInfo: formData.caseManagerInfo || null
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

            {/* Max Cashless Amount */}
            {(formData.offerType === 'voucher' || formData.offerType === 'delivery' || formData.offerType === 'pickup' || formData.offerType === 'transport_credit') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Max Cashless Amount (USD) *
                  <span className="text-xs text-slate-500 ml-1">(Max $100 per transaction)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.maxCashlessAmount}
                  onChange={(e) => setFormData({ ...formData, maxCashlessAmount: e.target.value })}
                  placeholder="0.00"
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-turquoise-500 focus:border-turquoise-500"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Maximum $100 per transaction per 4MK policy</p>
              </div>
            )}

            {/* Order ID */}
            {(formData.offerType === 'delivery' || formData.offerType === 'pickup') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Order ID / Transaction Reference
                </label>
                <input
                  type="text"
                  value={formData.orderId}
                  onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                  placeholder="e.g., ORD-12345 or confirmation code"
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-turquoise-500 focus:border-turquoise-500"
                />
              </div>
            )}

            {/* Proof Upload */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Upload Proof (Optional)
              </label>
              <div className="text-xs text-blue-600 mb-2">
                💡 Share photos of receipts, order confirmations, or proof of purchase
              </div>
              <MediaUpload 
                onMediaUpdate={(files) => {
                  setMediaFiles(files);
                  // Set proof URL from first uploaded file
                  if (files.length > 0 && files[0].uploaded_url) {
                    setProofUrl(files[0].uploaded_url);
                  }
                }}
                maxFiles={1}
                disabled={isSubmitting}
              />
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
                    formData.offerType === 'voucher'
                      ? 'e.g., "I can provide a $50 Amazon gift card"'
                      : formData.offerType === 'delivery'
                      ? 'e.g., "I can order DoorDash and send you the pickup code via email"'
                      : formData.offerType === 'pickup'
                      ? 'e.g., "I can buy groceries at Walmart and arrange pickup with confirmation number"'
                      : formData.offerType === 'transport_credit'
                      ? 'e.g., "I can provide train/bus credits for your travel"'
                      : 'e.g., "I can provide shelter assistance"'
                  }
                  className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-turquoise-500 focus:border-turquoise-500"
                  rows={3}
                  required
                />
              </div>
            )}

            {/* Delivery Preferences (Requester Information) */}
            {(formData.offerType === 'delivery' || formData.offerType === 'pickup') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Delivery Preferences (Optional)
                </label>
                <textarea
                  value={formData.deliveryPreferences}
                  onChange={(e) => setFormData({ ...formData, deliveryPreferences: e.target.value })}
                  placeholder="e.g., Preferred delivery time, special instructions, dietary restrictions"
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-turquoise-500 focus:border-turquoise-500"
                  rows={2}
                />
              </div>
            )}

            {/* Brand Preference */}
            {(formData.offerType === 'voucher' || formData.offerType === 'pickup') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Brand Preference (Optional)
                </label>
                <input
                  type="text"
                  value={formData.brandPreference}
                  onChange={(e) => setFormData({ ...formData, brandPreference: e.target.value })}
                  placeholder="e.g., Walmart, Target, Amazon"
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-turquoise-500 focus:border-turquoise-500"
                />
              </div>
            )}

            {/* Case Manager Info (for shelter aid) */}
            {formData.offerType === 'shelter_credit' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Case Manager Information (Optional)
                </label>
                <textarea
                  value={formData.caseManagerInfo}
                  onChange={(e) => setFormData({ ...formData, caseManagerInfo: e.target.value })}
                  placeholder="Case manager name, contact info, or verification details"
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-turquoise-500 focus:border-turquoise-500"
                  rows={2}
                />
                <p className="text-xs text-slate-500 mt-1">Shelter aid is processed only if case data is verified</p>
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