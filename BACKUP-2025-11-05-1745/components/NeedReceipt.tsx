// components/NeedReceipt.tsx - Unified Receipt Component
import { useRouter } from 'next/router';
import { useState } from 'react';

interface NeedReceiptProps {
  needId: string;
  title: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  category?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  whatsappId?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
  mode?: 'modal' | 'inline'; // Different display modes
}

// Utility function to format date nicely
const formatDateTime = (date: Date) => {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Utility function to format location nicely
const formatLocation = (street?: string, city?: string, state?: string, zipCode?: string) => {
  const parts = [];
  if (street) parts.push(street);
  if (city && state) {
    parts.push(`${city}, ${state}`);
  } else if (city) {
    parts.push(city);
  } else if (state) {
    parts.push(state);
  }
  if (zipCode) parts.push(zipCode);
  return parts.length > 0 ? parts.join(' • ') : null;
};

export default function NeedReceipt({
  needId,
  title,
  street,
  city,
  state,
  zipCode,
  category,
  description,
  contactEmail,
  contactPhone,
  whatsappId,
  onClose,
  showCloseButton = true,
  mode = 'modal'
}: NeedReceiptProps) {
  const router = useRouter();
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const sendEmailReceipt = async () => {
    if (!needId || !contactEmail?.trim() || emailSending) return;
    
    setEmailSending(true);
    
    try {
      console.log('Sending email receipt to:', contactEmail.trim());
      
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: contactEmail.trim(),
          subject: 'Need Created Successfully - 4MK',
          needId,
          needTitle: title,
          street: street || null,
          city: city || null,
          state: state || null,
          zipCode: zipCode || null,
          category: category || null,
          description: description || null,
          contactEmail: contactEmail.trim() || null,
          contactPhone: contactPhone || null,
          whatsappId: whatsappId || null
        })
      });
      
      const result = await response.json();
      console.log('Email API response:', result);
      
      if (response.ok) {
        setEmailSent(true);
        console.log('Email sent successfully');
      } else {
        console.error('Email send failed:', result);
      }
    } catch (error) {
      console.error('Failed to send email receipt:', error);
    } finally {
      setEmailSending(false);
    }
  };

  const receiptContent = (
    <div className="space-y-3">
      {/* Status */}
      <div className="text-center p-2 bg-green-50 border border-green-200 rounded">
        <p className="text-green-700 font-medium text-sm">✅ POSTED SUCCESSFULLY</p>
        <p className="text-xs text-gray-600">{formatDateTime(new Date())}</p>
      </div>
      
      {/* Need Details */}
      <div className="border-b pb-3">
        <h4 className="font-semibold text-gray-900 text-sm mb-2">{title}</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex">
            <span className="w-16 font-medium">Status:</span>
            <span className="text-green-600 font-medium">🟢 Active & Visible</span>
          </div>
          <div className="flex">
            <span className="w-16 font-medium">ID:</span>
            <span className="font-mono">#{needId?.slice(-8)}</span>
          </div>
          {category && (
            <div className="flex">
              <span className="w-16 font-medium">Type:</span>
              <span className="capitalize">{category}</span>
            </div>
          )}
          {formatLocation(street, city, state, zipCode) && (
            <div className="flex">
              <span className="w-16 font-medium">Area:</span>
              <span>{formatLocation(street, city, state, zipCode)}</span>
            </div>
          )}
        </div>
        {description && (
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
            <span className="font-medium">Details:</span> {description}
          </div>
        )}
      </div>
      
      {/* Contact Info */}
      <div className="border-b pb-3">
        <p className="font-medium text-gray-900 text-xs mb-1">CONTACT METHODS:</p>
        <div className="text-xs text-gray-700 space-y-0.5">
          {contactEmail && <div>📧 {contactEmail}</div>}
          {contactPhone && <div>📱 {contactPhone}</div>}
          {whatsappId && <div>💬 {whatsappId}</div>}
        </div>
      </div>
      
      {/* Email Receipt Section */}
      {contactEmail && (
        <div className="bg-blue-50 p-2 rounded border">
          <p className="text-xs font-medium text-gray-700 mb-1">Send receipt copy:</p>
          <p className="text-xs text-blue-600 mb-2">✨ Email delivery is instant and reliable</p>
          <div className="flex gap-2">
            <button
              onClick={sendEmailReceipt}
              disabled={emailSending || emailSent}
              className="flex-1 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {emailSending ? "Sending..." : emailSent ? "✅ Sent" : "📧 Email"}
            </button>
            {/* SMS placeholder - consistent with main form */}
            {contactPhone && (
              <div className="flex-1 bg-gray-300 text-gray-600 px-2 py-1 rounded text-xs font-medium text-center">
                📱 SMS Coming Soon
                <div className="text-xs text-gray-500">v2.0 with Twilio</div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              if (!emailSending) {
                router.push('/dashboard');
              }
            }}
            disabled={emailSending}
            className="bg-blue-600 text-white py-2 px-3 rounded text-xs font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Dashboard
          </button>
          <button
            onClick={() => {
              if (needId && !emailSending) {
                router.push(`/needs/${needId}/edit`);
              }
            }}
            disabled={emailSending}
            className="bg-blue-600 text-white py-2 px-3 rounded text-xs font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Edit Need
          </button>
        </div>
        <button
          onClick={() => {
            if (!emailSending) {
              router.push('/');
            }
          }}
          disabled={emailSending}
          className="w-full bg-green-600 text-white py-2 px-3 rounded text-xs font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Return to Home
        </button>
      </div>
    </div>
  );

  if (mode === 'inline') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        {receiptContent}
      </div>
    );
  }

  // Modal mode (default)
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
        {/* Modal Header */}
        {showCloseButton && (
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-bold text-gray-900">Need Receipt</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ×
            </button>
          </div>
        )}
        
        {/* Modal Body */}
        <div className="p-4">
          {receiptContent}
        </div>
        
        {/* Modal Footer */}
        <div className="p-4 border-t bg-gray-50 text-center">
          <p className="text-xs text-gray-500">4MK Community Platform</p>
        </div>
      </div>
    </div>
  );
}