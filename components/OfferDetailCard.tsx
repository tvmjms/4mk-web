import React from 'react';

interface OfferDetailCardProps {
  fulfillment: {
    id: string;
    status: string;
    offer_type?: string;
    offer_description?: string;
    max_cashless_amount?: number;
    order_id?: string;
    proof_url?: string;
    delivery_preferences?: string;
    brand_preference?: string;
    case_manager_info?: string;
    message?: string;
    created_at: string;
    accepted_at?: string;
    withdrawn_at?: string;
    return_initiated_at?: string;
    returned_at?: string;
    completed_at?: string;
  };
  isRequester?: boolean;
  isHelper?: boolean;
  onWithdraw?: () => void;
  onReturn?: () => void;
  onClarify?: () => void;
  onResume?: () => void;
}

export default function OfferDetailCard({
  fulfillment,
  isRequester = false,
  isHelper = false,
  onWithdraw,
  onReturn,
  onClarify,
  onResume
}: OfferDetailCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'proposed': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'fulfilled': return 'bg-purple-100 text-purple-800';
      case 'withdrawn': return 'bg-gray-100 text-gray-800';
      case 'clarifying': return 'bg-blue-100 text-blue-800';
      case 'return_initiated': return 'bg-orange-100 text-orange-800';
      case 'returned': return 'bg-pink-100 text-pink-800';
      case 'non_reversible': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const offerTypeLabels: Record<string, string> = {
    voucher: 'Gift Card / Voucher',
    delivery: 'Online Delivery',
    pickup: 'Retail Pickup',
    transport_credit: 'Transport Credit',
    shelter_credit: 'Shelter Aid',
    general: 'General Help'
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(fulfillment.status)}`}>
            {fulfillment.status.charAt(0).toUpperCase() + fulfillment.status.slice(1).replace('_', ' ')}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          Created: {formatDate(fulfillment.created_at)}
        </div>
      </div>

      {/* Offer Type */}
      {fulfillment.offer_type && (
        <div>
          <span className="text-xs font-medium text-gray-700">Type: </span>
          <span className="text-xs text-gray-600">
            {offerTypeLabels[fulfillment.offer_type] || fulfillment.offer_type}
          </span>
        </div>
      )}

      {/* Amount */}
      {fulfillment.max_cashless_amount && (
        <div>
          <span className="text-xs font-medium text-gray-700">Amount: </span>
          <span className="text-xs text-gray-600">${fulfillment.max_cashless_amount.toFixed(2)}</span>
        </div>
      )}

      {/* Order ID */}
      {fulfillment.order_id && (
        <div>
          <span className="text-xs font-medium text-gray-700">Order ID: </span>
          <span className="text-xs text-gray-600 font-mono">{fulfillment.order_id}</span>
        </div>
      )}

      {/* Description */}
      {fulfillment.offer_description && (
        <div>
          <span className="text-xs font-medium text-gray-700">Description:</span>
          <p className="text-xs text-gray-600 mt-1">{fulfillment.offer_description}</p>
        </div>
      )}

      {/* Delivery Preferences */}
      {fulfillment.delivery_preferences && (
        <div>
          <span className="text-xs font-medium text-gray-700">Delivery Preferences:</span>
          <p className="text-xs text-gray-600 mt-1">{fulfillment.delivery_preferences}</p>
        </div>
      )}

      {/* Brand Preference */}
      {fulfillment.brand_preference && (
        <div>
          <span className="text-xs font-medium text-gray-700">Brand Preference: </span>
          <span className="text-xs text-gray-600">{fulfillment.brand_preference}</span>
        </div>
      )}

      {/* Case Manager Info */}
      {fulfillment.case_manager_info && (
        <div>
          <span className="text-xs font-medium text-gray-700">Case Manager Info:</span>
          <p className="text-xs text-gray-600 mt-1">{fulfillment.case_manager_info}</p>
        </div>
      )}

      {/* Proof */}
      {fulfillment.proof_url && (
        <div>
          <span className="text-xs font-medium text-gray-700">Proof: </span>
          <a
            href={fulfillment.proof_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            View Proof
          </a>
        </div>
      )}

      {/* Message */}
      {fulfillment.message && (
        <div>
          <span className="text-xs font-medium text-gray-700">Message:</span>
          <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{fulfillment.message}</p>
        </div>
      )}

      {/* Timeline */}
      <div className="border-t pt-2 space-y-1">
        <div className="text-xs font-medium text-gray-700">Timeline:</div>
        {fulfillment.accepted_at && (
          <div className="text-xs text-gray-600">Accepted: {formatDate(fulfillment.accepted_at)}</div>
        )}
        {fulfillment.withdrawn_at && (
          <div className="text-xs text-gray-600">Withdrawn: {formatDate(fulfillment.withdrawn_at)}</div>
        )}
        {fulfillment.return_initiated_at && (
          <div className="text-xs text-gray-600">Return Initiated: {formatDate(fulfillment.return_initiated_at)}</div>
        )}
        {fulfillment.returned_at && (
          <div className="text-xs text-gray-600">Returned: {formatDate(fulfillment.returned_at)}</div>
        )}
        {fulfillment.completed_at && (
          <div className="text-xs text-gray-600">Completed: {formatDate(fulfillment.completed_at)}</div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="border-t pt-3 flex flex-wrap gap-2">
        {isHelper && fulfillment.status === 'proposed' && onWithdraw && (
          <button
            onClick={onWithdraw}
            className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100"
          >
            Withdraw
          </button>
        )}
        {isRequester && fulfillment.status === 'fulfilled' && onReturn && (
          <button
            onClick={onReturn}
            className="px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded hover:bg-orange-100"
          >
            Initiate Return
          </button>
        )}
        {(isRequester || isHelper) && fulfillment.status === 'accepted' && onClarify && (
          <button
            onClick={onClarify}
            className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
          >
            Need Clarification
          </button>
        )}
        {(isRequester || isHelper) && fulfillment.status === 'clarifying' && onResume && (
          <button
            onClick={onResume}
            className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100"
          >
            Resume
          </button>
        )}
      </div>
    </div>
  );
}

