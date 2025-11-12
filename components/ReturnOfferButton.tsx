import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ReturnOfferButtonProps {
  fulfillmentId: string;
  offerType?: string;
  isNonReversible?: boolean;
  onReturned: () => void;
}

export default function ReturnOfferButton({ 
  fulfillmentId, 
  offerType = 'general',
  isNonReversible = false,
  onReturned 
}: ReturnOfferButtonProps) {
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState('');
  const [action, setAction] = useState<'initiate' | 'complete'>('initiate');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReturn = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Please log in to process return');
      }

      const response = await fetch('/api/offers/return', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fulfillmentId,
          action,
          reason: reason.trim() || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process return');
      }

      setShowForm(false);
      setReason('');
      onReturned();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process return');
    } finally {
      setIsProcessing(false);
    }
  };

  const getReturnTypeInfo = () => {
    switch (offerType) {
      case 'voucher':
        return { label: 'Gift Card', reversible: true, note: 'Can be voided/reassigned if unused' };
      case 'delivery':
        return { label: 'Online Delivery', reversible: true, note: 'Can be intercepted or refunded' };
      case 'pickup':
        return { label: 'Retail Pickup', reversible: true, note: 'Can be cancelled or returned' };
      case 'transport_credit':
        return { label: 'Transport Credit', reversible: true, note: 'Reversible if pending' };
      case 'utility':
        return { label: 'Utility', reversible: false, note: 'Non-reversible' };
      case 'shelter_credit':
        return { label: 'Shelter Aid', reversible: false, note: 'Processed only if verified' };
      default:
        return { label: 'General', reversible: true, note: 'May be reversible depending on circumstances' };
    }
  };

  const returnInfo = getReturnTypeInfo();

  return (
    <>
      <button
        onClick={() => setShowForm(true)}
        className="px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded hover:bg-orange-100 transition-colors"
      >
        Initiate Return
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">
              {action === 'initiate' ? 'Initiate Return' : 'Complete Return'}
            </h3>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm font-medium text-blue-800 mb-1">Return Type: {returnInfo.label}</p>
              <p className="text-xs text-blue-700">{returnInfo.note}</p>
              {isNonReversible && (
                <p className="text-xs text-red-700 mt-2 font-medium">
                  ⚠️ This return is marked as non-reversible
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reason *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you returning this offer?"
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                rows={3}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm mb-4">
                {error}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowForm(false);
                  setReason('');
                  setError(null);
                }}
                className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleReturn}
                disabled={isProcessing || !reason.trim()}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : action === 'initiate' ? 'Initiate Return' : 'Complete Return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}




