import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ReportAbuseButtonProps {
  reportedUserId?: string;
  reportedNeedId?: string;
  reportedFulfillmentId?: string;
  onReported?: () => void;
}

export default function ReportAbuseButton({ 
  reportedUserId,
  reportedNeedId,
  reportedFulfillmentId,
  onReported
}: ReportAbuseButtonProps) {
  const [showForm, setShowForm] = useState(false);
  const [reportType, setReportType] = useState<'abuse' | 'fraud' | 'inappropriate' | 'spam' | 'other'>('other');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Please log in to submit a report');
      }

      const response = await fetch('/api/reports/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reportedUserId,
          reportedNeedId,
          reportedFulfillmentId,
          reportType,
          description: description.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit report');
      }

      setSuccess(true);
      setTimeout(() => {
        setShowForm(false);
        setDescription('');
        setReportType('other');
        setSuccess(false);
        if (onReported) onReported();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowForm(true)}
        className="px-2 py-1 text-xs font-medium text-red-700 hover:text-red-800 underline"
        title="Report abuse or inappropriate content"
      >
        Report
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Report Abuse</h3>

            {success ? (
              <div className="text-center py-4">
                <p className="text-green-600 font-medium mb-2">✓ Report submitted successfully</p>
                <p className="text-sm text-slate-600">4MK will review your report and take appropriate action.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Report Type *
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  >
                    <option value="abuse">Abuse</option>
                    <option value="fraud">Fraud</option>
                    <option value="inappropriate">Inappropriate Content</option>
                    <option value="spam">Spam</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Please provide details about what you're reporting..."
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    rows={4}
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md text-xs">
                  <p className="text-yellow-800">
                    <strong>Note:</strong> Reports are reviewed by 4MK moderators. False reports may result in account suspension.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setDescription('');
                      setReportType('other');
                      setError(null);
                    }}
                    className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !description.trim()}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}




