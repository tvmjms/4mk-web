import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../../../lib/supabase';
import { usStatesAndCities } from '@/utils/usStatesAndCities';
import { useAuthGuard } from '@/hooks/useAuthGuard';

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
  
  // Available cities based on selected state
  const availableCities = need?.state && usStatesAndCities[need.state] ? usStatesAndCities[need.state].cities : [];
  
  // Handle state change and reset city
  const handleStateChange = (newState: string) => {
    if (need) {
      setNeed({ ...need, state: newState, city: "" });
    }
  };

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
      }
      setLoading(false);
    })();
  }, [id, user, isAuthenticated]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!need) return;

    setSaving(true);
    setErr(null);

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
                  onChange={(e) => setNeed({ ...need, title: e.target.value })}
                  className="w-full px-2 py-0.5 rounded border border-slate-300 text-xs focus:border-turquoise-400 focus:ring-1 focus:ring-turquoise-400"
                  required
                  placeholder="What do you need help with?"
                />
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
                  onChange={(e) => setNeed({ ...need, description: e.target.value })}
                  className="w-full px-2 py-0.5 rounded border border-slate-300 text-xs focus:border-turquoise-400 focus:ring-1 focus:ring-turquoise-400"
                  rows={2}
                  placeholder="Provide more details about your need..."
                />
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
                      <label className="block font-medium text-slate-600 mb-0.5 text-[10px]">State</label>
                      <select
                        value={need.state || ""}
                        onChange={(e) => handleStateChange(e.target.value)}
                        className="w-full px-1 py-0.5 rounded border border-slate-300 text-xs focus:border-turquoise-400"
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
                      <label className="block font-medium text-slate-600 mb-0.5 text-[10px]">City</label>
                      <select
                        value={need.city || ""}
                        onChange={(e) => setNeed({ ...need, city: e.target.value })}
                        className="w-full px-1 py-0.5 rounded border border-slate-300 text-xs focus:border-turquoise-400"
                        disabled={!need.state}
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
