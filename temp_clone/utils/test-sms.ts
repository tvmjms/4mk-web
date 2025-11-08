// Test SMS API directly
const testSms = async () => {
  try {
    const response = await fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: '2489355617',  // The phone number from the screenshot
        needId: 'test-123',
        needTitle: 'Test SMS Message'
      })
    });
    
    const result = await response.json();
    console.log('SMS Test Response:', response.status, result);
    return result;
  } catch (error) {
    console.error('SMS Test Error:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Test email sending functionality
const testEmail = async () => {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'tvmjms@hotmail.com',  // The email from the screenshot
        subject: 'Test Email - 4MK',
        needId: 'test-123',
        needTitle: 'Test Email Message'
      })
    });
    
    const result = await response.json();
    console.log('Email Test Response:', response.status, result);
    return result;
  } catch (error) {
    console.error('Email Test Error:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Export for testing
if (typeof window !== 'undefined') {
  (window as any).testSms = testSms;
  (window as any).testEmail = testEmail;
}

export { testSms, testEmail };