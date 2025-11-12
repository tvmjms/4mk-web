import React, { useState, useEffect } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AccountSettings() {
  const { isLoading: authLoading, isAuthenticated, user } = useAuthGuard();
  const { language, setLanguage } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Load user's language preference from profile
    const loadLanguagePreference = async () => {
      try {
        const { data, error } = await supabase
          .from('user_profile')
          .select('preferred_language')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && data?.preferred_language) {
          setLanguage(data.preferred_language as 'en' | 'es');
        }
      } catch (err) {
        console.error('Error loading language preference:', err);
      }
    };

    loadLanguagePreference();
  }, [user, isAuthenticated, setLanguage]);

  const handleLanguageChange = async (newLanguage: 'en' | 'es') => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Update language in context (immediate UI update)
      setLanguage(newLanguage);

      // Save to user profile
      if (user) {
        const { error } = await supabase
          .from('user_profile')
          .upsert({
            user_id: user.id,
            preferred_language: newLanguage
          }, {
            onConflict: 'user_id'
          });

        if (error) throw error;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save language preference');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-6">Account Settings</h1>

          {/* Language Preference */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Preferred Language
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="language"
                  value="en"
                  checked={language === 'en'}
                  onChange={() => handleLanguageChange('en')}
                  disabled={saving}
                  className="text-blue-600"
                />
                <span className="text-sm text-slate-700">English</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="language"
                  value="es"
                  checked={language === 'es'}
                  onChange={() => handleLanguageChange('es')}
                  disabled={saving}
                  className="text-blue-600"
                />
                <span className="text-sm text-slate-700">Español</span>
              </label>
            </div>
            {success && (
              <p className="text-sm text-green-600 mt-2">✓ Language preference saved</p>
            )}
            {error && (
              <p className="text-sm text-red-600 mt-2">{error}</p>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
            <p>
              <strong>Note:</strong> Your language preference will be applied across the 4MK platform. 
              Currently, English and Spanish are supported.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}




