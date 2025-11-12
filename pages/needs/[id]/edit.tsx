import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../../../lib/supabase';
import { usStatesAndCities } from '@/utils/usStatesAndCities';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import MediaUpload from '@/components/MediaUpload';

type Need = {
  id: string;
  title: string;
  street: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  category: string | null;
  description: string | null;
  contact_email?: string | null;
  contact_phone_e164?: string | null;
  whatsapp_id?: string | null;
  owner_id?: string | null;
  edit_notes?: string | null;
  last_edited_at?: string | null;
  edit_count?: number | null;
  attachments?: any;
  attachment_count?: number;
};

export default function EditNeed() {
  const router = useRouter();
  const { id } = router.query;
  const { isLoading: authLoading, isAuthenticated, user } = useAuthGuard();

  const [need, setNeed] = useState<Need | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [changeNotes, setChangeNotes] = useState<string>('');
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [titleModerationError, setTitleModerationError] = useState<string | null>(null);
  const [descriptionModerationError, setDescriptionModerationError] = useState<string | null>(null);
  const [isModeratingTitle, setIsModeratingTitle] = useState(false);
  const [isModeratingDescription, setIsModeratingDescription] = useState(false);
  const titleTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const descriptionTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const titleRequestIdRef = React.useRef(0);
  const descriptionRequestIdRef = React.useRef(0);
  
  // Available cities based on selected state
  const availableCities = need?.state && usStatesAndCities[need.state] ? usStatesAndCities[need.state].cities : [];
  
  // Handle state change and reset city
  const handleStateChange = (newState: string) => {
    if (need) {
      setNeed({ ...need, state: newState, city: "" });
    }
  };

  // Content moderation for title and description
  const moderateContent = async (text: string, field: 'title' | 'description') => {
    if (!text || text.trim().length < 3) {
      if (field === 'title') {
        setTitleModerationError(null);
        setIsModeratingTitle(false);
      } else {
        setDescriptionModerationError(null);
        setIsModeratingDescription(false);
      }
      return;
    }

    // Clear existing timeout
    if (field === 'title' && titleTimeoutRef.current) {
      clearTimeout(titleTimeoutRef.current);
    } else if (field === 'description' && descriptionTimeoutRef.current) {
      clearTimeout(descriptionTimeoutRef.current);
    }

    // Increment request ID
    if (field === 'title') {
      titleRequestIdRef.current += 1;
    } else {
      descriptionRequestIdRef.current += 1;
    }
    const currentRequestId = field === 'title' ? titleRequestIdRef.current : descriptionRequestIdRef.current;

    // Set moderating state
    if (field === 'title') {
      setIsModeratingTitle(true);
    } else {
      setIsModeratingDescription(true);
    }

    // Debounce - wait 500ms after user stops typing
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch('/api/moderate-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });

        const result = await response.json();

        // Only apply results if this is still the most recent request
        const isCurrentRequest = field === 'title' 
          ? currentRequestId === titleRequestIdRef.current
          : currentRequestId === descriptionRequestIdRef.current;

        if (isCurrentRequest) {
          if (!result.approved) {
            const errorMsg = `⚠️ ${result.reasons.join('. ')}. Please revise your ${field}.`;
            if (field === 'title') {
              setTitleModerationError(errorMsg);
            } else {
              setDescriptionModerationError(errorMsg);
            }
          } else {
            if (field === 'title') {
              setTitleModerationError(null);
            } else {
              setDescriptionModerationError(null);
            }
          }
        }
      } catch (error) {
        console.error('Moderation error:', error);
        // Fail open - don't block user if moderation service is down
        if (field === 'title') {
          setTitleModerationError(null);
        } else {
          setDescriptionModerationError(null);
        }
      } finally {
        const isCurrentRequest = field === 'title' 
          ? currentRequestId === titleRequestIdRef.current
          : currentRequestId === descriptionRequestIdRef.current;

        if (isCurrentRequest) {
          if (field === 'title') {
            setIsModeratingTitle(false);
          } else {
            setIsModeratingDescription(false);
          }
        }
      }
    }, 500);

    if (field === 'title') {
      titleTimeoutRef.current = timeout;
    } else {
      descriptionTimeoutRef.current = timeout;
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (titleTimeoutRef.current) {
        clearTimeout(titleTimeoutRef.current);
      }
      if (descriptionTimeoutRef.current) {
        clearTimeout(descriptionTimeoutRef.current);
      }
    };
  }, []);

  // Fetch the need by ID and check ownership
  useEffect(() => {
    if (!id || !user || !isAuthenticated) return;
    
    (async () => {
      const { data, error } = await supabase
        .from('needs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        setErr(error.message);
      } else if (data.owner_id !== user.id) {
        setErr("You can only edit your own needs. This need belongs to someone else.");
      } else {
        setNeed(data);
        // Load attachments if they exist
        if (data.attachments) {
          try {
            const atts = typeof data.attachments === 'string' 
              ? JSON.parse(data.attachments) 
              : data.attachments;
            setAttachments(Array.isArray(atts) ? atts : []);
            // Convert to MediaUpload format
            const media = Array.isArray(atts) ? atts.map((att: any, idx: number) => ({
              id: `existing-${idx}`,
              uploaded_url: att.url || att,
              type: att.type || 'document',
              name: att.name || 'attachment',
              uploading: false,
              moderating: false,
              moderation_status: 'approved' as const
            })) : [];
            setMediaFiles(media);
          } catch {
            setAttachments([]);
            setMediaFiles([]);
          }
        }
      }
      setLoading(false);
    })();
  }, [id, user, isAuthenticated]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!need) return;

    // Validate required fields: state and city are mandatory
    if (!need.state || !need.city) {
      setErr("State and City are required fields.");
      return;
    }

    // Block submission if moderation errors exist or moderation is in progress
    if (titleModerationError || descriptionModerationError || isModeratingTitle || isModeratingDescription) {
      setErr("Please wait for content safety check to complete or fix any flagged content before saving.");
      return;
    }

    setSaving(true);
    setErr(null);

    // Prepare attachments from media files
    const attachmentData = mediaFiles
      .filter(f => f.uploaded_url)
      .map(f => ({
        url: f.uploaded_url,
        type: f.type || 'document',
        name: f.name || 'attachment'
      }));

    const { error } = await supabase
      .from('needs')
      .update({
        title: need.title,
        street: need.street || null,
        city: need.city,
        state: need.state,
        zip_code: need.zip_code || null,
        category: need.category,
        description: need.description,
        contact_email: need.contact_email || null,
        contact_phone_e164: need.contact_phone_e164 || null,
        whatsapp_id: need.whatsapp_id || null,
        attachments: attachmentData.length > 0 ? JSON.stringify(attachmentData) : null,
        attachment_count: attachmentData.length,
        // Temporarily comment out new fields until migration is run
        // edit_notes: changeNotes.trim() || null,
        // last_edited_at: new Date().toISOString(),
        // edit_count: (need.edit_count || 0) + 1,
      })
      .eq('id', need.id);

    setSaving(false);

    if (error) {
      setErr(error.message);
      return;
    }

    // Update local state and clear change notes
    // Temporarily comment out until migration
    // setNeed({
    //   ...need,
    //   edit_notes: changeNotes.trim() || null,
    //   last_edited_at: new Date().toISOString(),
    //   edit_count: (need.edit_count || 0) + 1,
    // });
    setChangeNotes('');

    router.push(`/needs/${need.id}`);
  }

  async function onDelete() {
    if (!need) return;
    if (!confirm('Are you sure you want to delete this need?')) return;

    setDeleting(true);
    setErr(null);
    
    console.log('Attempting to delete need:', need.id);
    
    // Get current user for debugging
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user?.id, 'Need owner:', need.owner_id);
    
    const { data, error } = await supabase
      .from('needs')
      .delete()
      .eq('id', need.id)
      .eq('owner_id', user?.id); // Ensure user owns the need
    
    setDeleting(false);
    
    console.log('Delete result:', { data, error });

    if (error) {
      console.error('Delete failed:', error);
      setErr(`Delete failed: ${error.message}`);
      return;
    }

    console.log('Delete successful, redirecting...');
    router.push('/');
  }

  // Show loading while authenticating
  if (authLoading || !isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Checking access...</p>
        </div>
      </main>
    );
  }

  if (loading) return (
    <main className="min-h-screen px-4">
      <div className="mx-auto max-w-6xl py-4 text-center">Loading…</div>
    </main>
  );
  
  if (!need) return (
    <main className="min-h-screen px-4">
      <div className="mx-auto max-w-6xl py-4 text-center">Need not found.</div>
    </main>
  );

  return (
    <main className="min-h-screen px-4">
      {/* Page Title */}
      <div className="mx-auto max-w-6xl py-4">
        <h1 className="text-lg font-bold mb-4 text-slate-800 text-center">Edit Need</h1>
        
        {/* Error Message */}
        {err && <p className="text-red-600 mb-4 text-center bg-red-50 p-2 rounded text-xs">{err}</p>}

        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
            
            {/* Left Card - Need Information */}
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 p-4">
              
              {/* Title */}
              <div className="mb-2">
                <label className="block font-medium text-slate-700 mb-0.5 text-xs">Title *</label>
                <input
                  value={need.title}
                  onChange={(e) => {
                    setNeed({ ...need, title: e.target.value });
                    moderateContent(e.target.value, 'title');
                  }}
                  className={`w-full px-2 py-0.5 rounded border text-xs focus:border-turquoise-400 focus:ring-1 focus:ring-turquoise-400 ${
                    titleModerationError ? 'border-red-300' : 'border-slate-300'
                  }`}
                  required
                  placeholder="What do you need help with?"
                  disabled={!!descriptionModerationError}
                />
                {isModeratingTitle && (
                  <div className="mt-1 p-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                    🔍 Checking content safety...
                  </div>
                )}
                {titleModerationError && (
                  <div className="mt-1 p-2 bg-red-50 border border-red-300 rounded text-xs text-red-700 font-medium">
                    {titleModerationError}
                  </div>
                )}
              </div>

              {/* Category */}
              <div className="mb-2">
                <label className="block font-medium text-slate-700 mb-0.5 text-xs">Category</label>
                <select
                  value={need.category || "other"}
                  onChange={(e) => setNeed({ ...need, category: e.target.value })}
                  className="w-full px-2 py-0.5 rounded border border-slate-300 text-xs focus:border-turquoise-400 focus:ring-1 focus:ring-turquoise-400"
                >
                  <option value="food">Food</option>
                  <option value="transportation">Transportation</option>
                  <option value="housing">Housing</option>
                  <option value="medical">Medical</option>
                  <option value="childcare">Childcare</option>
                  <option value="employment">Employment</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div className="mb-2">
                <label className="block font-medium text-slate-700 mb-0.5 text-xs">Description</label>
                <textarea
                  value={need.description || ""}
                  onChange={(e) => {
                    setNeed({ ...need, description: e.target.value });
                    moderateContent(e.target.value, 'description');
                  }}
                  className={`w-full px-2 py-0.5 rounded border text-xs focus:border-turquoise-400 focus:ring-1 focus:ring-turquoise-400 ${
                    descriptionModerationError ? 'border-red-300' : 'border-slate-300'
                  }`}
                  rows={2}
                  placeholder="Provide more details about your need..."
                  disabled={!!titleModerationError}
                  readOnly={!!titleModerationError}
                />
                {isModeratingDescription && (
                  <div className="mt-1 p-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                    🔍 Checking content safety...
                  </div>
                )}
                {descriptionModerationError && (
                  <div className="mt-1 p-2 bg-red-50 border border-red-300 rounded text-xs text-red-700 font-medium">
                    {descriptionModerationError}
                  </div>
                )}
              </div>

              {/* Attachments */}
              <div className="mb-2">
                <label className="block font-medium text-slate-700 mb-0.5 text-xs">Attachments (Optional)</label>
                <MediaUpload
                  onMediaUpdate={(files) => {
                    setMediaFiles(files);
                    const uploaded = files
                      .filter(f => f.uploaded_url)
                      .map(f => ({
                        url: f.uploaded_url,
                        type: f.type || 'document',
                        name: f.name || 'attachment'
                      }));
                    setAttachments(uploaded);
                  }}
                  maxFiles={5}
                  disabled={saving}
                />
                {attachments.length > 0 && (
                  <div className="text-xs text-gray-600 mt-1">
                    {attachments.length} file(s) attached
                  </div>
                )}
              </div>

              {/* Address (Optional) */}
              <fieldset className="border border-slate-200 p-2 rounded">
                <legend className="font-medium text-slate-700 px-1 text-xs">Address (Optional)</legend>
                <div className="space-y-1 mt-1">
                  <div>
                    <label className="block font-medium text-slate-600 mb-0.5 text-[10px]">Street</label>
                    <input
                      value={need.street || ""}
                      onChange={(e) => setNeed({ ...need, street: e.target.value })}
                      className="w-full px-1 py-0.5 rounded border border-slate-300 text-xs focus:border-turquoise-400"
                      placeholder="Street address"
                    />
                  </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-medium text-slate-600 mb-0.5 text-[10px]">
                          State <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={need.state || ""}
                          onChange={(e) => handleStateChange(e.target.value)}
                          className="w-full px-1 py-0.5 rounded border border-slate-300 text-xs focus:border-turquoise-400"
                          required
                        >
                          <option value="">Select State</option>
                          {Object.keys(usStatesAndCities).map((stateCode) => (
                            <option key={stateCode} value={stateCode}>
                              {usStatesAndCities[stateCode].name} ({stateCode})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-0.5 text-[10px]">
                          City <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={need.city || ""}
                          onChange={(e) => setNeed({ ...need, city: e.target.value })}
                          className="w-full px-1 py-0.5 rounded border border-slate-300 text-xs focus:border-turquoise-400"
                          disabled={!need.state}
                          required
                        >
                          <option value="">
                            {need.state ? "Select City" : "Select State First"}
                          </option>
                          {availableCities.map((cityName) => (
                            <option key={cityName} value={cityName}>
                              {cityName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-0.5 text-[10px]">Zip Code</label>
                    <input
                      value={need.zip_code || ""}
                      onChange={(e) => setNeed({ ...need, zip_code: e.target.value })}
                      className="w-full px-1 py-0.5 rounded border border-slate-300 text-xs focus:border-turquoise-400"
                      placeholder="Zip code"
                    />
                  </div>
                </div>
              </fieldset>
            </div>

            {/* Right Card - Contact & Actions */}
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 p-4">
              
              {/* Contact Methods */}
              <fieldset className="border border-slate-200 p-2 rounded mb-3">
                <legend className="font-medium text-slate-700 px-1 text-xs">Contact Info (Optional)</legend>
                <div className="grid grid-cols-1 gap-1 mt-1">
                  <input
                    type="email"
                    value={need.contact_email || ""}
                    onChange={(e) => setNeed({ ...need, contact_email: e.target.value })}
                    className="w-full px-2 py-0.5 rounded border border-slate-300 text-xs focus:border-turquoise-400"
                    placeholder="Email address"
                  />
                  <input
                    value={need.contact_phone_e164 || ""}
                    onChange={(e) => setNeed({ ...need, contact_phone_e164: e.target.value })}
                    className="w-full px-2 py-0.5 rounded border border-slate-300 text-xs focus:border-turquoise-400"
                    placeholder="Phone number"
                  />
                  <input
                    value={need.whatsapp_id || ""}
                    onChange={(e) => setNeed({ ...need, whatsapp_id: e.target.value })}
                    className="w-full px-2 py-0.5 rounded border border-slate-300 text-xs focus:border-turquoise-400"
                    placeholder="WhatsApp ID"
                  />
                </div>
              </fieldset>

              {/* Change Notes - Simplified until migration */}
              <fieldset className="border border-slate-200 p-2 rounded mb-3">
                <legend className="font-medium text-slate-700 px-1 text-xs">
                  Edit Notes (Optional)
                </legend>
                <div className="mt-1">
                  <textarea
                    value={changeNotes}
                    onChange={(e) => setChangeNotes(e.target.value)}
                    className="w-full px-2 py-1 rounded border border-slate-300 text-xs focus:border-turquoise-400 resize-none"
                    placeholder="What changes are you making? (will be saved after DB migration)"
                    rows={2}
                  />
                  <p className="text-[10px] text-blue-600 bg-blue-50 p-1 rounded mt-1">
                    💡 Info: Run database migration to enable full change tracking
                  </p>
                </div>
              </fieldset>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  type="submit"
                  className={`w-full py-1.5 rounded-md text-center font-semibold text-xs transition-all ${
                    saving 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "btn-turquoise hover:opacity-90"
                  }`}
                  disabled={saving}
                >
                  {saving ? "Saving changes…" : "Save Changes"}
                </button>

                <button
                  type="button"
                  onClick={onDelete}
                  className={`w-full py-1.5 rounded-md text-center font-semibold text-xs transition-all ${
                    deleting 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                  disabled={deleting}
                >
                  {deleting ? "Deleting…" : "Delete Need"}
                </button>
              </div>

              {/* Preview Box */}
              <div className="p-2 bg-slate-50 border border-slate-200 rounded mt-3">
                <h4 className="text-[10px] font-semibold text-slate-700 mb-1">Preview:</h4>
                {need.title ? (
                  <div className="text-[10px] text-slate-600">
                    <div className="font-medium mb-0.5">{need.title}</div>
                    {(need.street || need.city || need.state || need.zip_code) && (
                      <div>📍 {[
                        need.street,
                        need.city,
                        need.state && usStatesAndCities[need.state] ? usStatesAndCities[need.state].name : need.state,
                        need.zip_code
                      ].filter(Boolean).join(', ')}</div>
                    )}
                    {(need.contact_email || need.contact_phone_e164 || need.whatsapp_id) && (
                      <div className="mt-0.5">
                        Contact: {[
                          need.contact_email && 'Email',
                          need.contact_phone_e164 && 'Phone', 
                          need.whatsapp_id && 'WhatsApp'
                        ].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400">Need information will appear here</div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
