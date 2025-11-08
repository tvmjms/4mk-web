import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { supabase } from "@/lib/supabase";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import EnhancedOfferForm from "@/components/EnhancedOfferForm";
import NeedComments from "@/components/NeedComments";

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
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [hasExistingOffer, setHasExistingOffer] = useState(false);
  const [activeFulfillmentId, setActiveFulfillmentId] = useState<string | null>(null);
  const [showOfferForm, setShowOfferForm] = useState(false);
  
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
      setLoading(false);
      return;
    }

    setNeed(data);
    setIsOwner(user?.id === data?.owner_id);

    // Check if current user has already made an offer (for non-owners)
    // Also get the active fulfillment ID for connection-based comments
    if (user?.id !== data?.owner_id) {
      // Check for user's own offer
      const { data: existingOffer } = await supabase
        .from("fulfillment")
        .select("id, status")
        .eq("need_id", id)
        .eq("helper_id", user.id)
        .in("status", ["proposed", "accepted"])
        .maybeSingle();

      setHasExistingOffer(!!existingOffer);
      
      // Use the user's active fulfillment (proposed or accepted) for comments
      // This creates the connection-based chat
      if (existingOffer) {
        setActiveFulfillmentId(existingOffer.id);
      }
    } else {
      // For owner: find the active fulfillment (proposed or accepted) to show that connection's chat
      // Priority: accepted > proposed (most recent first)
      const { data: activeFulfillment } = await supabase
        .from("fulfillment")
        .select("id, status")
        .eq("need_id", id)
        .in("status", ["proposed", "accepted"])
        .order("status", { ascending: false }) // 'accepted' comes before 'proposed'
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (activeFulfillment) {
        setActiveFulfillmentId(activeFulfillment.id);
      }
    }

    setLoading(false);
  }

  const handleOfferSuccess = async () => {
    setShowOfferForm(false);
    setHasExistingOffer(true);
    // Refresh to get the new fulfillment ID for comments
    await fetchNeedAndUser();
  };

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
          <>
            <div className="space-y-2">
              {!need.fulfilled && (
                <>
                  <button
                    onClick={() => setShowOfferForm(true)}
                    disabled={hasExistingOffer}
                    className={`w-full px-3 py-2 rounded-lg text-white font-medium text-sm transition ${
                      hasExistingOffer
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-purple-600 hover:bg-purple-700"
                    }`}
                  >
                    {hasExistingOffer ? "✓ Offer Already Submitted" : "🤝 I Can Help With This"}
                  </button>
                  
                  {hasExistingOffer && (
                    <p className="text-xs text-gray-600 text-center">
                      You've already submitted an offer. The requester will review it.
                    </p>
                  )}
                </>
              )}
              
              {/* Email Requester */}
              {need.contact_email && (
                <a
                  href={`mailto:${need.contact_email}?subject=Re: ${encodeURIComponent(need.title)}&body=Hi,%0D%0A%0D%0AI saw your need on 4MK and would like to help.%0D%0A%0D%0A`}
                  className="block w-full bg-blue-600 text-white py-1.5 px-2 rounded text-xs font-medium hover:bg-blue-700 text-center"
                >
                  📧 Email Requester
                </a>
              )}
              
              <button
                onClick={() => router.push('/')}
                className="w-full bg-gray-600 text-white py-1.5 px-2 rounded text-xs font-medium hover:bg-gray-700"
              >
                Back to All Needs
              </button>
            </div>
          </>
        )}

        {/* Comments Section - Linked to active fulfillment/connection (chat between requester and helper) */}
        <div className="border-t pt-3 mt-3">
          <NeedComments 
            needId={need.id} 
            currentUserId={user?.id} 
            fulfillmentId={activeFulfillmentId || undefined}
          />
        </div>

            {/* Footer */}
            <div className="pt-1 border-t text-center">
              <p className="text-xs text-gray-400">ForMyKin Community Platform</p>
            </div>
          </div>
        </div>
        
        {/* Offer Form Modal */}
        {showOfferForm && need && (
          <EnhancedOfferForm
            needId={need.id}
            needTitle={need.title}
            onClose={() => setShowOfferForm(false)}
            onSuccess={handleOfferSuccess}
          />
        )}
      </main>
    </>
  );
}
