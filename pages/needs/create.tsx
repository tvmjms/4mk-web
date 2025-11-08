// pages/needs/create.tsx

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { usStatesAndCities } from "@/utils/usStatesAndCities";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import imageCompression from 'browser-image-compression';

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
  if (city && state && usStatesAndCities[state]) {
    parts.push(`${city}, ${state}`);
  } else if (city) {
    parts.push(city);
  } else if (state && usStatesAndCities[state]) {
    parts.push(`${usStatesAndCities[state].name}`);
  }
  if (zipCode) parts.push(zipCode);
  return parts.length > 0 ? parts.join(' • ') : null;
};

export default function NewNeedPage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated, user } = useAuthGuard();

  // Form state variables
  const [title, setTitle] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [category, setCategory] = useState("other");
  
  // Available cities based on selected state
  const availableCities = state && usStatesAndCities[state] ? usStatesAndCities[state].cities : [];
  
  const handleStateChange = (newState: string) => {
    setState(newState);
    setCity(""); // Reset city when state changes
  };

  // Phone number formatter for user convenience
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const digits = input.replace(/\D/g, '');
    
    // Limit to 10 digits
    if (digits.length <= 10) {
      setContactPhone(formatPhoneNumber(input));
    }
  };
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [whatsappId, setWhatsappId] = useState('');
  const [preferredContact, setPreferredContact] = useState('');
  const [provider, setProvider] = useState("web");

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [needId, setNeedId] = useState<string | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [smsSending, setSmsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [lastSubmissionTime, setLastSubmissionTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedFormData, setSubmittedFormData] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  
  // File upload state (images and documents, no videos)
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    id: string, 
    url: string, 
    file: File, 
    type: 'image' | 'document', 
    name: string,
    extension?: string,
    isOfficeDoc?: boolean,
    isTextFile?: boolean
  }>>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Content moderation state - separate state per field
  const [titleModerationError, setTitleModerationError] = useState<string | null>(null);
  const [descriptionModerationError, setDescriptionModerationError] = useState<string | null>(null);
  const [isModeratingTitle, setIsModeratingTitle] = useState(false);
  const [isModeratingDescription, setIsModeratingDescription] = useState(false);
  
  // Separate timeout refs per field to prevent cross-field cancellation
  const titleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const descriptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track request IDs to prevent stale responses
  const titleRequestIdRef = useRef<number>(0);
  const descriptionRequestIdRef = useRef<number>(0);
  
  // 🔍 DEBUG: Track component renders to detect double-rendering
  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log('🔄 COMPONENT RENDER #', renderCount.current, {
    timestamp: new Date().toISOString(),
    isSubmitting,
    saving,
    showConfirmation
  });

  // Auto-fill contact email with user's login email
  useEffect(() => {
    if (user?.email && !contactEmail) {
      setContactEmail(user.email);
      console.log('Auto-filled contact email with user email:', user.email);
    }
  }, [user?.email]);

  useEffect(() => {
    // Clear any daily limit restrictions from browser storage (only once)
    localStorage.removeItem('dailyLimit');
    localStorage.removeItem('submissionCount');
    localStorage.removeItem('lastSubmissionDate');
    sessionStorage.removeItem('dailyLimit');
    sessionStorage.removeItem('submissionCount');

    // 🔍 DEBUG: Global click tracker to detect unexpected clicks
    const globalClickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const inputElement = target as HTMLInputElement;
      if (inputElement?.type === 'submit' || target?.closest('form')) {
        console.log('🌍 GLOBAL CLICK on form element:', {
          timestamp: new Date().toISOString(),
          tagName: target.tagName,
          type: inputElement?.type || 'no-type',
          className: target.className,
          id: target.id,
          detail: e.detail,
          isTrusted: e.isTrusted
        });
      }
    };

    document.addEventListener('click', globalClickHandler, true);
    return () => document.removeEventListener('click', globalClickHandler, true);
  }, []); // Only run once on mount

  // Cleanup moderation timeouts on unmount
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    // 🔍 DEBUG: Track event details
    console.log('🎯 SUBMISSION EVENT DETECTED:', {
      timestamp: new Date().toISOString(),
      eventType: e.type,
      eventTarget: (e.target as HTMLElement)?.tagName || 'unknown',
      isSubmitting,
      saving,
      submissionId,
      eventPhase: e.eventPhase,
      isTrusted: e.isTrusted
    });

    // Stronger duplicate prevention
    if (isSubmitting || saving) {
      console.log('Form submission blocked - already in progress');
      setErr("Form is being processed. Please wait.");
      return;
    }

    const now = Date.now();
    if (now - lastSubmissionTime < 3000) { // Increased to 3 seconds for better protection
      console.log('Form submission blocked - too soon after last submission');
      setErr("Please wait a moment before submitting again.");
      return;
    }

    // Generate unique submission ID to track this specific submission
    const currentSubmissionId = `${user?.id || 'unknown'}-${now}-${Math.random().toString(36).substr(2, 9)}`;
    if (submissionId === currentSubmissionId) {
      console.log('Form submission blocked - duplicate submission ID');
      setErr("This submission is already being processed.");
      return;
    }
    setSubmissionId(currentSubmissionId);

    // Check for identical form data
    const currentFormData = JSON.stringify({
      title: title.trim(),
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      category: category.trim(),
      description: description.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      whatsappId: whatsappId.trim()
    });

    if (submittedFormData === currentFormData) {
      console.log('Form submission blocked - identical data already submitted');
      setErr("This exact need has already been submitted. Please modify the form or wait before submitting again.");
      return;
    }
    
    // Check if moderation is still in progress (prevent race condition)
    if (isModeratingTitle || isModeratingDescription) {
      setErr("Please wait for content safety check to complete.");
      return;
    }
    
    // Check for moderation errors in any field
    if (titleModerationError || descriptionModerationError) {
      setErr("Please fix the content safety issues before submitting.");
      return;
    }
    
    setIsSubmitting(true);
    setLastSubmissionTime(now);
    setSubmittedFormData(currentFormData);
    
    console.log('Form submission started at:', new Date().toISOString());

    if (!title.trim()) {
      setErr("Please enter a title.");
      return;
    }

    // Require at least one contact method
    if (!contactEmail.trim() && !contactPhone.trim() && !whatsappId.trim()) {
      setErr("Please provide at least one contact method (email, phone, or WhatsApp).");
      setIsSubmitting(false);
      return;
    }

    // Validate phone number format if provided
    if (contactPhone.trim()) {
      const phoneDigits = contactPhone.replace(/\D/g, '');
      if (phoneDigits.length !== 10 && !(phoneDigits.length === 11 && phoneDigits.startsWith('1'))) {
        setErr(`Invalid phone number format. Please enter a 10-digit US phone number. You entered ${phoneDigits.length} digits: "${phoneDigits}"`);
        setIsSubmitting(false);
        return;
      }
    }

    setSaving(true);

    if (!user) {
      setSaving(false);
      setIsSubmitting(false);
      setErr("You must be signed in.");
      return;
    }

    console.log('Form submission - User ID:', user.id);

    const payload = {
      owner_id: user.id,
      title: title.trim(),
      street: street.trim() || null,
      city: city.trim() || null,
      state: state.trim() || null,
      zip_code: zipCode.trim() || null,
      category: category.trim() || null,
      description: description.trim() || null,
      contact_email: contactEmail.trim() || null,
      contact_phone_e164: contactPhone.trim() || null,
      whatsapp_id: whatsappId.trim() || null,
      provider: provider.trim() || null,
      status: 'new', // Required by database constraint
      images: uploadedFiles.map(f => f.url) // File URLs from Supabase Storage
    };

    // Try using API route to bypass any client-side issues
    try {
      const response = await fetch('/api/create-need-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      setSaving(false);
      setIsSubmitting(false);

      if (!response.ok) {
        console.error('API route error:', result);
        
        // Handle duplicate detection specifically
        if (result.code === 'DUPLICATE_NEED' && result.existingNeedId) {
          setErr(`This need appears to already exist. A very similar need was created recently. Would you like to view it instead?`);
          // Reset submission tracking on duplicate
          setSubmissionId(null);
          setSubmittedFormData(null);
          // Could redirect to the existing need: router.push(`/needs/${result.existingNeedId}`);
          return;
        }
        
        // Reset submission tracking on other errors
        setSubmissionId(null);
        setSubmittedFormData(null);
        setErr(`Database error: ${result.error || 'Unknown error'}`);
        return;
      }

      console.log('API route success:', result);
      setNeedId(result.needId);
      setShowConfirmation(true);
      
      // CRITICAL: Clear error state on successful submission
      setErr(null);
      
      // Reset form data hash after successful submission
      setSubmittedFormData(null);
      
      // Clear uploaded files after successful submission
      setUploadedFiles([]);
    } catch (fetchError) {
      setSaving(false);
      setIsSubmitting(false);
      // Reset submission tracking on network error
      setSubmissionId(null);
      setSubmittedFormData(null);
      console.error('Fetch error:', fetchError);
      setErr(`Network error: ${fetchError}`);
      return;
    }
    
    // Don't reset form yet - user needs data for receipt
    // Form will be reset when they navigate away
  }

  const resetForm = () => {
    setTitle("");
    setStreet("");
    setCity("");
    setState("");
    setZipCode("");
    setCategory("other");
    setDescription("");
    setContactEmail("");
    setContactPhone("");
    setWhatsappId("");
    setPreferredContact("");
    setProvider("web");
  };

  const sendEmailReceipt = async () => {
    // Use contact email if provided, otherwise use user's login email
    const emailToUse = contactEmail.trim() || user?.email;
    
    if (!needId || !emailToUse || emailSending) return;
    
    setEmailSending(true);
    setErr(null); // Clear any previous errors
    
    try {
      console.log('Sending email receipt to:', emailToUse);
      
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailToUse,
          subject: 'Need Created Successfully - 4MK',
          needId,
          needTitle: title,
          street: street.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          zipCode: zipCode.trim() || null,
          category: category.trim() || null,
          description: description.trim() || null,
          contactEmail: contactEmail.trim() || null,
          contactPhone: contactPhone.trim() || null,
          whatsappId: whatsappId.trim() || null
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
      // Always reset sending state
      setEmailSending(false);
    }
  };

  const sendSmsReceipt = async () => {
    if (!needId || !contactPhone.trim() || smsSending) {
      console.log('SMS send blocked:', { needId, phone: contactPhone, sending: smsSending });
      return;
    }
    
    // Extract only digits from phone number for SMS API
    const phoneDigitsOnly = contactPhone.replace(/\D/g, '');
    console.log('Sending SMS to:', phoneDigitsOnly, 'for need:', needId);
    setSmsSending(true);
    setErr(null); // Clear any previous errors
    
    try {
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phoneDigitsOnly,
          needId,
          needTitle: title
        })
      });
      
      const result = await response.json();
      console.log('SMS API response:', result);
      
      if (response.ok) {
        setSmsSent(true);
        console.log('SMS sent successfully');
      } else {
        console.error('SMS send failed:', result.error);
        // More user-friendly SMS error message
        if (result.error?.includes('timeout') || result.error?.includes('Timeout')) {
          setErr('SMS timed out. Email-to-SMS can be slow. Check your messages in a few minutes.');
        } else if (result.error?.includes('unreliable')) {
          setErr('SMS service is currently unreliable. Your need was created successfully - SMS is optional.');
        } else {
          setErr(`SMS failed: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('Failed to send SMS receipt:', error);
      setErr('SMS service temporarily unavailable. Your need was created successfully.');
    } finally {
      // Always reset sending state
      setSmsSending(false);
    }
  };

  const supabase = useSupabaseClient();

  // Debounced content moderation function with per-field tracking
  const moderateContent = async (text: string, field: 'title' | 'description') => {
    // Select the appropriate refs and setters for this field
    const timeoutRef = field === 'title' ? titleTimeoutRef : descriptionTimeoutRef;
    const requestIdRef = field === 'title' ? titleRequestIdRef : descriptionRequestIdRef;
    const setError = field === 'title' ? setTitleModerationError : setDescriptionModerationError;
    const setModeratingState = field === 'title' ? setIsModeratingTitle : setIsModeratingDescription;

    // Clear any existing timeout for THIS field only
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't moderate empty text
    if (!text || text.trim().length === 0) {
      setError(null);
      setModeratingState(false);
      return;
    }

    // Increment request ID to track this specific request
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    // Set moderating state
    setModeratingState(true);

    // Debounce - wait 500ms after user stops typing
    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/moderate-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });

        const result = await response.json();

        // Only apply results if this is still the most recent request (prevent stale responses)
        if (currentRequestId === requestIdRef.current) {
          // If content is flagged as inappropriate
          if (!result.approved) {
            setError(`⚠️ ${result.reasons.join('. ')}. Please revise your ${field}.`);
          } else {
            setError(null);
          }
        }

      } catch (error) {
        console.error('Moderation error:', error);
        // Fail open - don't block user if moderation service is down
        // Only clear error if this is still the most recent request
        if (currentRequestId === requestIdRef.current) {
          setError(null);
        }
      } finally {
        // Only clear moderating state if this is still the most recent request
        if (currentRequestId === requestIdRef.current) {
          setModeratingState(false);
        }
      }
    }, 500); // 500ms debounce
  };

  // Updated Title change handler with moderation
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTitle(value);
    moderateContent(value, 'title');
  };

  // Updated Description change handler with moderation
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDescription(value);
    moderateContent(value, 'description');
  };

  // File upload handler (images and PDFs, no videos) with moderation
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingFile(true);
    
    try {
      const file = files[0];
      
      // Validate file type - allow images, documents, block videos
      const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      
      // Common document MIME types
      const allowedDocTypes = [
        'application/pdf',                                    // PDF
        'application/msword',                                 // .doc (Word 97-2003)
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.ms-excel',                           // .xls (Excel 97-2003)
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-powerpoint',                      // .ppt (PowerPoint 97-2003)
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
        'text/plain',                                         // .txt
        'text/csv',                                           // .csv
        'application/rtf',                                     // .rtf
        'application/vnd.oasis.opendocument.text',            // .odt (OpenDocument Text)
        'application/vnd.oasis.opendocument.spreadsheet',    // .ods (OpenDocument Spreadsheet)
        'application/vnd.oasis.opendocument.presentation',    // .odp (OpenDocument Presentation)
      ];
      
      const videoTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi', 'video/quicktime'];
      
      // Block videos explicitly
      if (videoTypes.some(vt => file.type.includes(vt))) {
        setErr('⚠️ Videos are not allowed. Please upload images or documents only.');
        setUploadingFile(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      // Check if it's an allowed type
      const isImage = allowedImageTypes.includes(file.type) || file.type.startsWith('image/');
      const isDocument = allowedDocTypes.includes(file.type) || 
                         file.name.toLowerCase().match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|rtf|odt|ods|odp)$/i);
      
      if (!isImage && !isDocument) {
        setErr('⚠️ File type not supported. Please upload images or standard document formats (PDF, Word, Excel, PowerPoint, Text, CSV, RTF, OpenDocument).');
        setUploadingFile(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      // Check file size - larger limit for documents (20MB), smaller for images (10MB)
      const maxSize = isImage ? 10 * 1024 * 1024 : 20 * 1024 * 1024; // 10MB for images, 20MB for documents
      const maxSizeMB = isImage ? 10 : 20;
      if (file.size > maxSize) {
        setErr(`⚠️ File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of ${maxSizeMB}MB`);
        setUploadingFile(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      let fileToUpload = file;
      let fileData: string;
      
      // For images: compress for sustainability
      if (isImage) {
        const options = {
          maxSizeMB: 0.5,          // max 500KB
          maxWidthOrHeight: 800,    // max 800px
          useWebWorker: true,
          fileType: 'image/jpeg'   // convert to JPEG for better compression
        };
        
        console.log('Compressing image...', { originalSize: (file.size / 1024).toFixed(2) + 'KB' });
        fileToUpload = await imageCompression(file, options);
        console.log('Compressed image:', { compressedSize: (fileToUpload.size / 1024).toFixed(2) + 'KB' });
      }
      
      // Convert file to base64 for API upload and moderation
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(fileToUpload);
      });
      
      fileData = await base64Promise;
      
      // 🛡️ MODERATE FILE/IMAGE before uploading (FREE OpenAI Moderation API)
      console.log('Moderating file for inappropriate content...', { type: file.type, name: file.name });
      const moderationResponse = await fetch('/api/moderate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageData: fileData,
          fileName: file.name,
          fileType: file.type
        })
      });
      
      const moderationResult = await moderationResponse.json();
      
      if (moderationResult.flagged || !moderationResult.approved) {
        // File contains inappropriate content - show error and abort upload
        const categories = moderationResult.flaggedCategories?.join(', ') || moderationResult.message || 'inappropriate content';
        setErr(`⚠️ File Rejected: This file contains ${categories}. Please select a different file.`);
        setUploadingFile(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      console.log('File moderation passed - safe to upload');
      
      // Upload via API route (bypasses RLS using service role key)
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData,
          fileName: file.name,
          userId: user?.id,
          contentType: file.type,
          fileType: file.type
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Upload error:', result.error);
        throw new Error(result.error || 'Failed to upload file');
      }

      console.log('Upload successful:', result);
      
      // Determine file type for display
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      const isOfficeDoc = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExtension);
      const isTextFile = ['txt', 'csv', 'rtf'].includes(fileExtension);
      
      // Add to uploaded files array
      const newFile = {
        id: Date.now().toString(),
        url: result.url,
        file: fileToUpload,
        type: isImage ? 'image' as const : 'document' as const,
        name: file.name,
        extension: fileExtension,
        isOfficeDoc,
        isTextFile
      };
      
      setUploadedFiles(prev => [...prev, newFile]);
      
    } catch (error: any) {
      console.error('File upload error:', error);
      setErr(error.message || 'Failed to upload file. Please try again.');
    } finally {
      setUploadingFile(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove uploaded file
  const removeFile = async (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (!file) return;

    try {
      // Extract file path from public URL
      const url = new URL(file.url);
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/need-attachments\/(.+)/);
      if (pathMatch && pathMatch[1]) {
        const filePath = pathMatch[1];
        await supabase.storage.from('need-attachments').remove([filePath]);
      }
    } catch (error) {
      console.error('Error deleting file from storage:', error);
    }

    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Show loading while auth is initializing
  if (authLoading || !isAuthenticated) {
    return (
      <main className="min-h-screen px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-turquoise-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Checking authentication...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4">
      {/* Page Title */}
      <div className="mx-auto max-w-6xl py-4">
        <h1 className="text-lg font-bold mb-4 text-slate-800 text-center">Create a Need</h1>
        
        {/* Error Message - Only show if not showing confirmation */}
        {err && !showConfirmation && <p className="text-red-600 mb-4 text-center bg-red-50 p-2 rounded text-xs">{err}</p>}

        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
            
            {/* Left Card - Need Information */}
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 p-4">
              
              {/* Form Lock Alert - Shows when any field has moderation error */}
              {(titleModerationError || descriptionModerationError) && (
                <div className="mb-3 p-3 bg-red-100 border-2 border-red-400 rounded-lg">
                  <div className="flex items-start">
                    <div className="text-red-600 text-xl mr-2">🔒</div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-red-800 mb-1">Form Locked - Content Safety Issue</h4>
                      <p className="text-xs text-red-700">
                        {titleModerationError && "Fix the issue in the Title field to unlock the form."}
                        {descriptionModerationError && !titleModerationError && "Fix the issue in the Description field to unlock the form."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Title */}
              <div className="mb-2">
                <label className="block font-medium text-slate-700 mb-0.5 text-xs">Title *</label>
                <input
                  value={title}
                  onChange={handleTitleChange}
                  className="w-full px-2 py-0.5 rounded border border-slate-300 text-xs focus:border-turquoise-400 focus:ring-1 focus:ring-turquoise-400"
                  required
                  disabled={isSubmitting}
                  readOnly={descriptionModerationError ? true : false}
                  placeholder="What do you need help with?"
                />
                {/* Title moderation status */}
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
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-2 py-0.5 rounded border border-slate-300 text-xs focus:border-turquoise-400 focus:ring-1 focus:ring-turquoise-400"
                  disabled={isSubmitting || !!titleModerationError || !!descriptionModerationError}
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
                  value={description}
                  onChange={handleDescriptionChange}
                  className="w-full px-2 py-0.5 rounded border border-slate-300 text-xs focus:border-turquoise-400 focus:ring-1 focus:ring-turquoise-400"
                  rows={2}
                  disabled={isSubmitting}
                  readOnly={titleModerationError ? true : false}
                  placeholder="Provide more details about your need..."
                />
                {/* Description moderation status */}
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

              {/* Address (Optional) */}
              <fieldset className="border border-slate-200 p-2 rounded">
                <legend className="font-medium text-slate-700 px-1 text-xs">Address (Optional)</legend>
                <div className="space-y-1 mt-1">
                  <div>
                    <label className="block font-medium text-slate-600 mb-0.5 text-[10px]">Street</label>
                    <input
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full px-1 py-0.5 rounded border border-slate-300 text-xs focus:border-turquoise-400"
                      placeholder="Street address"
                      disabled={isSubmitting || !!titleModerationError || !!descriptionModerationError}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-medium text-slate-600 mb-0.5 text-[10px]">State</label>
                      <select
                        value={state}
                        onChange={(e) => handleStateChange(e.target.value)}
                        className="w-full px-1 py-0.5 rounded border border-slate-300 text-xs focus:border-turquoise-400"
                        disabled={isSubmitting || !!titleModerationError || !!descriptionModerationError}
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
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-1 py-0.5 rounded border border-slate-300 text-xs focus:border-turquoise-400"
                        disabled={!state || isSubmitting || !!titleModerationError || !!descriptionModerationError}
                      >
                        <option value="">
                          {state ? "Select City" : "Select State First"}
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
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="w-full px-1 py-0.5 rounded border border-slate-300 text-xs focus:border-turquoise-400"
                      placeholder="Zip code"
                      disabled={isSubmitting || !!titleModerationError || !!descriptionModerationError}
                    />
                  </div>
                </div>
              </fieldset>

              {/* File Upload Section (Images & PDFs, no videos) */}
              <fieldset className="border border-slate-200 p-2 rounded mt-3">
                <legend className="font-medium text-slate-700 px-1 text-xs">Photos & Documents (Optional)</legend>
                <div className="mt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.odt,.ods,.odp"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isSubmitting || uploadingFile || !!titleModerationError || !!descriptionModerationError}
                  />
                  
                  {/* Upload Button */}
                  {uploadedFiles.length < 3 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSubmitting || uploadingFile || !!titleModerationError || !!descriptionModerationError}
                      className="w-full px-2 py-1.5 rounded border-2 border-dashed border-slate-300 text-xs font-medium text-slate-600 hover:border-turquoise-400 hover:text-turquoise-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {uploadingFile ? '⏳ Processing & Checking Safety...' : '📎 Add Photo or Document (No Videos)'}
                    </button>
                  )}
                  
                  {/* File Previews */}
                  {uploadedFiles.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {uploadedFiles.map((file) => {
                        // Determine icon based on file type
                        let icon = '📄';
                        if (file.type === 'image') {
                          icon = '🖼️';
                        } else if (file.isOfficeDoc) {
                          const ext = file.extension || '';
                          if (['doc', 'docx'].includes(ext)) icon = '📝';
                          else if (['xls', 'xlsx'].includes(ext)) icon = '📊';
                          else if (['ppt', 'pptx'].includes(ext)) icon = '📽️';
                        } else if (file.extension === 'pdf') {
                          icon = '📕';
                        } else if (file.isTextFile) {
                          icon = '📄';
                        }
                        
                        return (
                          <div key={file.id} className="relative group">
                            {file.type === 'image' ? (
                              <img
                                src={file.url}
                                alt="Upload preview"
                                className="w-full h-20 object-cover rounded border border-slate-200"
                              />
                            ) : (
                              <div className="w-full h-20 bg-slate-100 rounded border border-slate-200 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="text-2xl mb-1">{icon}</div>
                                  <div className="text-[8px] text-slate-600 truncate px-1" title={file.name}>
                                    {file.name.length > 15 ? file.name.substring(0, 15) + '...' : file.name}
                                  </div>
                                </div>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => removeFile(file.id)}
                              className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-colors opacity-90 hover:opacity-100"
                              title="Remove file"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {uploadedFiles.length > 0 && (
                    <p className="text-[9px] text-slate-500 mt-1">
                      ✅ {uploadedFiles.filter(f => f.type === 'image').length > 0 ? 'Images auto-compressed. ' : ''}
                      {uploadedFiles.filter(f => f.isOfficeDoc).length > 0 ? 'Office files already compressed. ' : ''}
                      All files checked for safety ({uploadedFiles.length}/3)
                    </p>
                  )}
                  
                  <p className="text-[9px] text-slate-400 mt-1">
                    💡 Allowed: Images (JPG, PNG, WebP, GIF), Documents (PDF, Word, Excel, PowerPoint, Text, CSV, RTF, OpenDocument). Videos not allowed.
                  </p>
                </div>
              </fieldset>
            </div>

            {/* Right Card - Contact & Actions */}
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 p-4">
              
              {/* Contact Methods - Compact */}
              <fieldset className="border border-slate-200 p-2 rounded mb-3">
                <legend className="font-medium text-slate-700 px-1 text-xs">Contact Info * (At least one required)</legend>
                <div className="grid grid-cols-1 gap-1 mt-1">
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-2 py-0.5 rounded border border-slate-300 text-xs focus:border-turquoise-400"
                    placeholder="Email address"
                    disabled={isSubmitting || !!titleModerationError || !!descriptionModerationError}
                  />
                  <div className="relative">
                    <input
                      value={contactPhone}
                      onChange={handlePhoneChange}
                      className="w-full px-2 py-0.5 pr-6 rounded border border-slate-300 text-xs focus:border-turquoise-400"
                      placeholder="Phone number (will auto-format)"
                      title="Enter 10-digit phone number - will format automatically as you type"
                      maxLength={12}
                      disabled={isSubmitting || !!titleModerationError || !!descriptionModerationError}
                    />
                    {contactPhone && (
                      <span className="absolute right-1 top-0.5 text-xs">
                        {contactPhone.replace(/\D/g, '').length === 10 ? '✓' : '⚠️'}
                      </span>
                    )}
                  </div>
                  <input
                    value={whatsappId}
                    onChange={(e) => setWhatsappId(e.target.value)}
                    className="w-full px-2 py-0.5 rounded border border-slate-300 text-xs focus:border-turquoise-400"
                    placeholder="WhatsApp ID"
                    disabled={isSubmitting || !!titleModerationError || !!descriptionModerationError}
                  />
                </div>
              </fieldset>

              {/* Preferred Contact Method */}
              <div className="mb-3">
                <label className="block font-medium text-slate-700 mb-0.5 text-xs">Preferred Contact Method</label>
                <select
                  value={preferredContact}
                  onChange={(e) => setPreferredContact(e.target.value)}
                  className="w-full px-2 py-0.5 rounded border border-slate-300 text-xs focus:border-turquoise-400"
                  disabled={!!titleModerationError || !!descriptionModerationError}
                >
                  <option value="">Select preferred method</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={`w-full py-1.5 rounded-md text-center font-semibold text-xs mb-3 transition-all ${
                  saving || isSubmitting || isModeratingTitle || isModeratingDescription || !!titleModerationError || !!descriptionModerationError
                    ? "bg-gray-400 cursor-not-allowed animate-pulse" 
                    : "btn-turquoise hover:opacity-90"
                }`}
                disabled={saving || isSubmitting || isModeratingTitle || isModeratingDescription || !!titleModerationError || !!descriptionModerationError}
                onClick={(e) => {
                  // 🔍 DEBUG: Track button clicks specifically
                  console.log('🖱️ BUTTON CLICK DETECTED:', {
                    timestamp: new Date().toISOString(),
                    eventType: e.type,
                    button: e.button,
                    buttons: e.buttons,
                    detail: e.detail, // Click count (1 = single, 2 = double)
                    clientX: e.clientX,
                    clientY: e.clientY,
                    isTrusted: e.isTrusted,
                    currentlySubmitting: isSubmitting || saving
                  });
                  
                  // Don't prevent default - let form submission handle it
                }}
              >
                {saving || isSubmitting 
                  ? "Creating… Please wait (do not click again)"
                  : (isModeratingTitle || isModeratingDescription)
                  ? "🔍 Checking Content Safety..."
                  : (titleModerationError || descriptionModerationError)
                  ? "⚠️ Fix Content Issues Above"
                  : "Create Need"}
              </button>

              {/* Confirmation Message */}
              {showConfirmation && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center mb-2">
                    <div className="text-green-600 text-lg mr-2">✅</div>
                    <h4 className="text-sm font-semibold text-green-800">Need Created Successfully!</h4>
                  </div>
                  <p className="text-xs text-green-700 mb-3">
                    Your need "<strong>{title}</strong>" has been posted and is now visible to the community members who can help.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowReceipt(true);
                        // Clear any lingering errors when showing receipt for successful submission
                        setErr(null);
                      }}
                      className="flex-1 bg-blue-600 text-white py-1.5 px-3 rounded text-xs font-medium hover:bg-blue-700"
                    >
                      Show Receipt
                    </button>
                    <button
                      onClick={() => router.push('/')}
                      className="flex-1 bg-green-600 text-white py-1.5 px-3 rounded text-xs font-medium hover:bg-green-700"
                    >
                      Return to Home Page
                    </button>
                  </div>
                </div>
              )}

              {/* Preview Box */}
              <div className="p-2 bg-slate-50 border border-slate-200 rounded mb-3">
                <h4 className="text-[10px] font-semibold text-slate-700 mb-1">Quick Preview:</h4>
                {title.trim() ? (
                  <div className="text-[10px] text-slate-600">
                    <div className="font-medium mb-0.5">{title}</div>
                    {(street.trim() || city.trim() || state.trim() || zipCode.trim()) && (
                      <div>📍 {[
                        street.trim(),
                        city.trim(),
                        state.trim() && usStatesAndCities[state] ? usStatesAndCities[state].name : state.trim(),
                        zipCode.trim()
                      ].filter(Boolean).join(', ')}</div>
                    )}
                    {(contactEmail.trim() || contactPhone.trim() || whatsappId.trim()) && (
                      <div className="mt-0.5">
                        Contact: {[
                          contactEmail.trim() && 'Email',
                          contactPhone.trim() && 'Phone', 
                          whatsappId.trim() && 'WhatsApp'
                        ].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400">Fill form to see preview</div>
                )}
              </div>

              {/* Two Column Layout for Tips and What Happens Next */}
              <div className="grid grid-cols-2 gap-2">
                {/* Tips */}
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <h4 className="text-[10px] font-semibold text-slate-700 mb-1">💡 Tips:</h4>
                  <ul className="text-[9px] text-slate-600 space-y-0.5">
                    <li>• Be specific about your need</li>
                    <li>• Include timing if urgent</li>
                    <li>• Add your location area</li>
                    <li>• Provide multiple contacts</li>
                    <li>• Set preferred method</li>
                  </ul>
                </div>

                {/* What Happens Next - Quick Summary */}
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <h4 className="text-[10px] font-semibold text-slate-700 mb-1">🚀 What's Next:</h4>
                  <ul className="text-[9px] text-slate-600 space-y-0.5">
                    <li>• Need gets posted instantly</li>
                    <li>• Get confirmation receipt</li>
                    <li>• People contact you</li>
                    <li>• Status updated by contact</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Receipt Modal - Compact Real Receipt Design */}
      {showReceipt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[85vh] overflow-y-auto border-2 border-gray-200">
            {/* Receipt Header - Compact */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-t-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold">4MK COMMUNITY RECEIPT</h3>
                  <p className="text-xs opacity-90">#{needId?.slice(-8) || 'XXXXXXXX'}</p>
                </div>
                <button
                  onClick={() => setShowReceipt(false)}
                  className="text-white hover:text-gray-200 text-xl leading-none"
                  title="Close"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Receipt Body - Compact Layout */}
            <div className="p-4 space-y-3">
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
                    <span className="w-16 font-medium">Category:</span>
                    <span className="capitalize">{category}</span>
                  </div>
                  {formatLocation(street, city, state, zipCode) && (
                    <div className="flex">
                      <span className="w-16 font-medium">Location:</span>
                      <span className="flex-1">{formatLocation(street, city, state, zipCode)}</span>
                    </div>
                  )}
                  {description && (
                    <div className="mt-2">
                      <span className="w-16 font-medium block">Description:</span>
                      <div className="bg-gray-50 p-2 rounded text-xs mt-1">{description}</div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Contact Info - Compact */}
              <div className="border-b pb-3">
                <p className="font-medium text-gray-900 text-xs mb-1">CONTACT METHODS:</p>
                <div className="text-xs text-gray-700 space-y-0.5">
                  {contactEmail && <div>📧 {contactEmail}</div>}
                  {contactPhone && <div>📱 {contactPhone}</div>}
                  {whatsappId && <div>💬 {whatsappId}</div>}
                </div>
              </div>
              
              {/* Send Receipt Options - Compact */}
              <div className="bg-blue-50 p-2 rounded border">
                <p className="text-xs font-medium text-gray-700 mb-2">Send receipt copy:</p>
                <div className="flex gap-2">
                  {(contactEmail.trim() || user?.email) && (
                    <button
                      onClick={sendEmailReceipt}
                      disabled={emailSending || emailSent}
                      className="flex-1 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      title={contactEmail.trim() ? `Send to ${contactEmail}` : `Send to ${user?.email}`}
                    >
                      {emailSending ? "Sending..." : emailSent ? "✅ Sent" : "📧 Email"}
                    </button>
                  )}
                  {contactPhone.trim() && (
                    <div className="flex-1 bg-gray-300 text-gray-600 px-2 py-1 rounded text-xs font-medium text-center">
                      📱 SMS Coming Soon
                      <div className="text-[10px] text-gray-500">v2.0 with Twilio</div>
                    </div>
                  )}
                </div>
                {err && !needId && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-xs text-red-700">{err}</p>
                    {(err.toLowerCase().includes('email') || err.toLowerCase().includes('configuration')) && (
                      <p className="text-xs text-red-600 mt-1">
                        💡 <strong>Tip:</strong> Email service needs configuration. Check the docs folder for setup guide.
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Action Buttons - Compact */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => router.push('/dashboard')}
                    disabled={emailSending}
                    className="bg-blue-600 text-white py-2 px-3 rounded text-xs font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
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
              
              {/* Footer */}
              <div className="pt-2 border-t text-center">
                <p className="text-xs text-gray-400">ForMyKin Community Platform</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
