// Simple test script to debug SMS functionality
const { spawn } = require('child_process');

// Test 1: Check if the API endpoints are responsive
async function testApiEndpoints() {
  console.log('🔍 Testing API endpoints...\n');
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    // Test SMS endpoint
    console.log('Testing SMS endpoint...');
    const smsResponse = await fetch('http://localhost:3000/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: '2489355617',
        needId: 'test-debug-123',
        needTitle: 'SMS Debug Test'
      })
    });
    
    const smsResult = await smsResponse.json();
    console.log('SMS API Response:', smsResponse.status, smsResult);
    
    // Test email endpoint
    console.log('\nTesting Email endpoint...');
    const emailResponse = await fetch('http://localhost:3000/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'tvmjms@hotmail.com',
        subject: 'Email Debug Test - 4MK',
        needId: 'test-debug-123',
        needTitle: 'Email Debug Test'
      })
    });
    
    const emailResult = await emailResponse.json();
    console.log('Email API Response:', emailResponse.status, emailResult);
    
  } catch (error) {
    console.error('API Test Error:', error.message);
  }
}

// Test 2: Direct nodemailer test with current env
async function testDirectEmail() {
  console.log('\n📧 Testing direct email sending...\n');
  
  try {
    // Load environment variables
    require('dotenv').config({ path: '.env.local' });
    const nodemailer = require('nodemailer');
    
    console.log('Environment check:');
    console.log('- EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET');
    console.log('- EMAIL_FROM:', process.env.EMAIL_FROM || 'NOT SET');
    console.log('- EMAIL_PASS length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 'NOT SET');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email credentials not configured');
    }
    
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    
    console.log('\nTesting SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful');
    
    // Test sending to multiple SMS gateways
    const carriers = [
      { name: 'AT&T', gateway: 'txt.att.net' },
      { name: 'Verizon', gateway: 'vtext.com' },
      { name: 'T-Mobile', gateway: 'tmomail.net' }
    ];
    
    const phoneNumber = '2489355617';
    
    for (const carrier of carriers) {
      try {
        console.log(`\nTesting ${carrier.name} gateway (${carrier.gateway})...`);
        const emailAddress = `${phoneNumber}@${carrier.gateway}`;
        
        const info = await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: emailAddress,
          subject: '4MK SMS Test',
          text: `🏠 4MK SMS Test via ${carrier.name}\n\nThis is a test message to verify SMS delivery.`
        });
        
        console.log(`✅ ${carrier.name}: Email sent (ID: ${info.messageId})`);
      } catch (error) {
        console.log(`❌ ${carrier.name}: Failed - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Direct email test failed:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting SMS Debug Session\n');
  console.log('=' + '='.repeat(50) + '\n');
  
  // First test API endpoints
  await testApiEndpoints();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Then test direct email
  await testDirectEmail();
  
  console.log('\n🎯 Debug session complete!');
}

main().catch(console.error);