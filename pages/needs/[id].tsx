import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { supabase } from "@/lib/supabase";
import { useAuthGuard } from "@/hooks/useAuthGuard";

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

type Need = {
  id: string;
  title: string;
  description: string;
  street?: string;
  city: string;
  state: string;
  zip_code?: string;
  category: string;
  created_at: string;
  fulfilled: boolean;
  owner_id: string;
  contact_email?: string | null;
  contact_phone_e164?: string | null;
  whatsapp_id?: string | null;
  status?: string;
};

export default function NeedDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { isLoading: authLoading, isAuthenticated, user } = useAuthGuard();

  const [need, setNeed] = useState<Need | null>(null);
  const [loading, setLoading] = useState(true);
  const [helping, setHelping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  
  // Email/SMS states for owner receipt functionality
  const [emailSending, setEmailSending] = useState(false);
  const [smsSending, setSmsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (id && user && isAuthenticated) {
      fetchNeedAndUser();
    }
  }, [id, user, isAuthenticated]);

  async function fetchNeedAndUser() {
    if (!user || !isAuthenticated) return;
    
    setLoading(true);
    setError(null);

    // Get need details
    const { data, error } = await supabase
      .from("needs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      setError(error.message);
    } else {
      setNeed(data);
      setIsOwner(user?.id === data?.owner_id);
    }

    setLoading(false);
  }

  async function handleOffer() {
    try {
      setHelping(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;

      const r = await fetch("/api/offers/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ needId: id }),
      });

      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Failed to accept");

      alert("Thanks! The requester will be notified.");
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setHelping(false);
    }
  }

  const sendEmailReceipt = async () => {
    if (!need?.id || !need?.contact_email?.trim() || emailSending) return;
    
    setEmailSending(true);
    setErr(null);
    
    try {
      console.log('Sending email receipt to:', need.contact_email.trim());
      
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: need.contact_email.trim(),
          subject: 'Need Receipt - 4MK',
          needId: need.id,
          needTitle: need.title,
          street: need.street || null,
          city: need.city || null,
          state: need.state || null,
          zipCode: need.zip_code || null,
          category: need.category || null,
          description: need.description || null,
          contactEmail: need.contact_email || null,
          contactPhone: need.contact_phone_e164 || null,
          whatsappId: need.whatsapp_id || null
        })
      });
      
      const result = await response.json();
      console.log('Email API response:', result);
      
      if (response.ok) {
        setEmailSent(true);
        console.log('Email sent successfully');
      } else {
        console.error('Email send failed:', result);
        setErr(`Email failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to send email receipt:', error);
      setErr('Failed to send email receipt. Please check your network connection.');
    } finally {
      setEmailSending(false);
    }
  };

  const sendSmsReceipt = async () => {
    if (!need?.id || !need?.contact_phone_e164?.trim() || smsSending) return;
    
    setSmsSending(true);
    setErr(null);
    
    try {
      console.log('Sending SMS to:', need.contact_phone_e164.trim());
      
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: need.contact_phone_e164.trim(),
          needId: need.id,
          needTitle: need.title
        })
      });
      
      const result = await response.json();
      console.log('SMS API response:', result);
      
      if (response.ok) {
        setSmsSent(true);
        console.log('SMS sent successfully');
      } else {
        console.error('SMS send failed:', result.error);
        setErr(`SMS failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to send SMS receipt:', error);
      setErr('Failed to send SMS. Please try again.');
    } finally {
      setSmsSending(false);
    }
  };

  // Show loading while authenticating
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Checking access...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-600">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-20 text-red-500">Error: {error}</div>;
  }

  if (!need) {
    return <div className="text-center py-20 text-gray-600">Need not found.</div>;
  }

  return (
    <>
      <Head>
        <title>{need.title} — 4MK</title>
      </Head>

      <main className="min-h-screen flex items-center justify-center px-2 py-4" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
        {/* Receipt-Style Modal for All Users */}
        <div className="max-w-lg w-full bg-white rounded-lg shadow-xl border-2 border-gray-200">
          {/* Receipt Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-t-lg">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold">4MK COMMUNITY NEED</h3>
                <p className="text-xs opacity-90">#{need.id.slice(-8)}</p>
              </div>
              <button
                onClick={() => router.push('/')}
                className="text-white hover:text-gray-200 text-xl leading-none"
                title="Back to Home"
              >
                ×
              </button>
            </div>
          </div>
          
          {/* Receipt Body */}
          <div className="p-3 space-y-3">
            {/* Status */}
            <div className="text-center py-2 px-3 bg-green-50 border border-green-200 rounded">
              <p className={`font-medium text-sm ${need.fulfilled ? 'text-green-700' : 'text-blue-700'}`}>
                {need.fulfilled ? '✅ FULFILLED' : '🟢 ACTIVE & SEEKING HELP'}
              </p>
              <p className="text-xs text-gray-600">Posted: {formatDateTime(new Date(need.created_at))}</p>
            </div>
            
            {/* Need Details */}
            <div className="border-b pb-2">
              <h4 className="font-semibold text-gray-900 mb-1">{need.title}</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex">
                  <span className="w-16 font-medium text-[10px]">Category:</span>
                  <span className="capitalize">{need.category}</span>
                </div>
                {formatLocation(need.street, need.city, need.state, need.zip_code) && (
                  <div className="flex">
                    <span className="w-16 font-medium text-[10px]">Location:</span>
                    <span className="flex-1">{formatLocation(need.street, need.city, need.state, need.zip_code)}</span>
                  </div>
                )}
              </div>
              {need.description && (
                <div className="flex mt-1">
                  <span className="w-16 font-medium text-[10px]">Description:</span>
                  <span className="flex-1 text-xs">{need.description}</span>
                </div>
              )}
            </div>
            
            {/* Contact Info */}
            <div className="border-b pb-2">
              <p className="font-medium text-gray-900 text-[10px] mb-1">CONTACT METHODS:</p>
              <div className="text-xs text-gray-700 space-y-1">
                {need.contact_email && <div>📧 {need.contact_email}</div>}
                {need.contact_phone_e164 && <div>📱 {need.contact_phone_e164}</div>}
                {need.whatsapp_id && <div>💬 {need.whatsapp_id}</div>}
              </div>
            </div>

        {isOwner ? (
          // Owner-specific options
          <>
            {/* Send Receipt Options */}
            {(need.contact_email || need.contact_phone_e164) && (
              <div className="bg-blue-50 p-2 rounded border">
                <p className="text-xs font-medium text-gray-700 mb-1">Send receipt copy:</p>
                <div className="flex gap-1 mb-1">
                  {need.contact_email && (
                    <button
                      onClick={sendEmailReceipt}
                      disabled={emailSending || emailSent}
                      className="flex-1 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {emailSending ? "Sending..." : emailSent ? "✅ Sent" : "📧 Email"}
                    </button>
                  )}
                  {need.contact_phone_e164 && (
                    <button
                      onClick={sendSmsReceipt}
                      disabled={smsSending || smsSent}
                      className="flex-1 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {smsSending ? "Sending..." : smsSent ? "✅ Sent" : "📱 SMS"}
                    </button>
                  )}
                </div>
                {err && (
                  <div className="p-1 bg-red-50 border border-red-200 rounded">
                    <p className="text-xs text-red-700">{err}</p>
                    <p className="text-xs text-red-600 mt-1">
                      💡 <strong>Tip:</strong> Email service needs configuration.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Owner Action Buttons */}
            <div className="space-y-1">
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => router.push('/dashboard')}
                  disabled={emailSending || smsSending}
                  className="bg-blue-600 text-white py-1.5 px-2 rounded text-xs font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => router.push(`/needs/${need.id}/edit`)}
                  disabled={emailSending || smsSending}
                  className="bg-blue-600 text-white py-1.5 px-2 rounded text-xs font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Edit Need
                </button>
              </div>
              <button
                onClick={() => router.push('/')}
                disabled={emailSending || smsSending}
                className="w-full bg-green-600 text-white py-1.5 px-2 rounded text-xs font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Return to Home
              </button>
            </div>
          </>
        ) : (
          // Helper/Visitor options
          <div className="space-y-2">
            {!need.fulfilled && (
              <button
                onClick={handleOffer}
                disabled={helping}
                className={`w-full px-3 py-2 rounded-lg text-white font-medium text-sm transition ${
                  helping
                    ? "bg-purple-400 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                {helping ? "Sending..." : "🤝 I Can Help With This"}
              </button>
            )}
            
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-600 text-white py-1.5 px-2 rounded text-xs font-medium hover:bg-gray-700"
            >
              Back to All Needs
            </button>
          </div>
        )}

            {/* Footer */}
            <div className="pt-1 border-t text-center">
              <p className="text-xs text-gray-400">ForMyKin Community Platform</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
