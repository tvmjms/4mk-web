import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface WithdrawOfferButtonProps {
  fulfillmentId: string;
  onWithdrawn: () => void;
}

export default function WithdrawOfferButton({ fulfillmentId, onWithdrawn }: WithdrawOfferButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [reason, setReason] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Please log in to withdraw offer');
      }

      const response = await fetch('/api/offers/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fulfillmentId,
          reason: reason.trim() || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to withdraw offer');
      }

      setShowConfirm(false);
      setReason('');
      onWithdrawn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to withdraw offer');
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
      >
        Withdraw Offer
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Withdraw Offer</h3>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to withdraw this offer? The requester will be notified.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reason (Optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you withdrawing this offer?"
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={3}
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
                  setShowConfirm(false);
                  setReason('');
                  setError(null);
                }}
                className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
                disabled={isWithdrawing}
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={isWithdrawing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isWithdrawing ? 'Withdrawing...' : 'Confirm Withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}




