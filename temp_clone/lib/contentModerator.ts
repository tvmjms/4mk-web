// lib/contentModerator.ts
// AI-powered content moderation service for text, images, and videos

export interface ModerationResult {
  approved: boolean;
  confidence: number;
  reasons: string[];
  category: 'safe' | 'inappropriate' | 'illegal' | 'spam' | 'harmful';
  suggestedAction: 'approve' | 'review' | 'reject' | 'flag';
}

export interface TextModerationOptions {
  checkProfanity: boolean;
  checkSpam: boolean;
  checkIllegalContent: boolean;
  checkPersonalInfo: boolean;
}

export interface MediaModerationOptions {
  checkNudity: boolean;
  checkViolence: boolean;
  checkIllegalItems: boolean;
  checkSpam: boolean;
  maxFileSizeMB: number;
}

class ContentModerator {
  private readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  private readonly CONTENT_POLICY = {
    // Define what's not allowed
    prohibited: [
      'explicit sexual content',
      'violence or threats',
      'illegal drugs or weapons',
      'hate speech',
      'personal information (SSN, credit cards)',
      'spam or promotional content',
      'scams or fraudulent offers',
      'inappropriate images of minors'
    ],
    // Define what's encouraged
    encouraged: [
      'community assistance',
      'respectful communication',
      'legitimate help requests',
      'appropriate documentation'
    ]
  };

  /**
   * Moderate text content using AI
   */
  async moderateText(
    text: string, 
    options: TextModerationOptions = {
      checkProfanity: true,
      checkSpam: true,
      checkIllegalContent: true,
      checkPersonalInfo: true
    }
  ): Promise<ModerationResult> {
    try {
      // Simple pattern-based checks first (fast)
      const quickCheck = this.quickTextCheck(text);
      if (!quickCheck.approved && quickCheck.confidence > 0.8) {
        return quickCheck;
      }

      // AI-powered deep analysis for complex cases
      if (this.OPENAI_API_KEY) {
        return await this.aiModerateText(text, options);
      }

      return quickCheck;
    } catch (error) {
      console.error('Text moderation error:', error);
      return {
        approved: false,
        confidence: 0.5,
        reasons: ['Moderation service temporarily unavailable'],
        category: 'safe',
        suggestedAction: 'review'
      };
    }
  }

  /**
   * Moderate image content
   */
  async moderateImage(
    imageBuffer: Buffer | string, 
    fileName: string,
    options: MediaModerationOptions = {
      checkNudity: true,
      checkViolence: true,
      checkIllegalItems: true,
      checkSpam: true,
      maxFileSizeMB: 10
    }
  ): Promise<ModerationResult> {
    try {
      // File size check
      const sizeCheck = this.checkFileSize(imageBuffer, options.maxFileSizeMB);
      if (!sizeCheck.approved) return sizeCheck;

      // File type validation
      const typeCheck = this.validateImageType(fileName);
      if (!typeCheck.approved) return typeCheck;

      // AI-powered image analysis
      if (this.OPENAI_API_KEY && typeof imageBuffer !== 'string') {
        return await this.aiModerateImage(imageBuffer, options);
      }

      // Fallback to basic approval for file uploads
      return {
        approved: true,
        confidence: 0.7,
        reasons: ['Basic validation passed'],
        category: 'safe',
        suggestedAction: 'approve'
      };
    } catch (error) {
      console.error('Image moderation error:', error);
      return {
        approved: false,
        confidence: 0.5,
        reasons: ['Image analysis failed'],
        category: 'safe',
        suggestedAction: 'review'
      };
    }
  }

  /**
   * Moderate video content
   */
  async moderateVideo(
    videoBuffer: Buffer, 
    fileName: string,
    options: MediaModerationOptions = {
      checkNudity: true,
      checkViolence: true,
      checkIllegalItems: true,
      checkSpam: true,
      maxFileSizeMB: 50
    }
  ): Promise<ModerationResult> {
    try {
      // File size check
      const sizeCheck = this.checkFileSize(videoBuffer, options.maxFileSizeMB);
      if (!sizeCheck.approved) return sizeCheck;

      // File type validation
      const typeCheck = this.validateVideoType(fileName);
      if (!typeCheck.approved) return typeCheck;

      // For now, basic approval - can be enhanced with video AI later
      return {
        approved: true,
        confidence: 0.6,
        reasons: ['Basic video validation passed'],
        category: 'safe',
        suggestedAction: 'approve'
      };
    } catch (error) {
      console.error('Video moderation error:', error);
      return {
        approved: false,
        confidence: 0.5,
        reasons: ['Video analysis failed'],
        category: 'safe',
        suggestedAction: 'review'
      };
    }
  }

  /**
   * Quick pattern-based text checking
   */
  private quickTextCheck(text: string): ModerationResult {
    const lowerText = text.toLowerCase();
    const issues: string[] = [];

    // Check for obvious profanity/inappropriate content
    const profanityPatterns = [
      /f[*u]ck/gi, /sh[*i]t/gi, /b[*i]tch/gi, /d[*a]mn/gi,
      /ass(hole)?/gi, /crap/gi, /hell/gi
    ];
    
    const inappropriatePatterns = [
      /sex/gi, /porn/gi, /nude/gi, /naked/gi,
      /drug/gi, /weed/gi, /cocaine/gi, /meth/gi,
      /gun/gi, /weapon/gi, /kill/gi, /murder/gi
    ];

    // Check for personal information
    const personalInfoPatterns = [
      /\d{3}-\d{2}-\d{4}/g, // SSN
      /\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}/g, // Credit card
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g // Email (in inappropriate context)
    ];

    // Check for spam patterns
    const spamPatterns = [
      /click here/gi, /free money/gi, /get rich quick/gi,
      /act now/gi, /limited time/gi, /guarantee/gi
    ];

    let severity = 0;

    // Profanity check
    profanityPatterns.forEach(pattern => {
      if (pattern.test(lowerText)) {
        issues.push('Contains inappropriate language');
        severity += 0.3;
      }
    });

    // Inappropriate content check
    inappropriatePatterns.forEach(pattern => {
      if (pattern.test(lowerText)) {
        issues.push('Contains potentially inappropriate content');
        severity += 0.4;
      }
    });

    // Personal info check
    personalInfoPatterns.forEach(pattern => {
      if (pattern.test(text)) {
        issues.push('Contains personal information');
        severity += 0.6;
      }
    });

    // Spam check
    spamPatterns.forEach(pattern => {
      if (pattern.test(lowerText)) {
        issues.push('Contains spam-like content');
        severity += 0.2;
      }
    });

    const approved = severity < 0.5;
    const confidence = Math.min(0.9, Math.max(0.1, 1 - severity));

    return {
      approved,
      confidence,
      reasons: issues.length > 0 ? issues : ['Content appears appropriate'],
      category: severity > 0.7 ? 'illegal' : severity > 0.5 ? 'inappropriate' : severity > 0.3 ? 'spam' : 'safe',
      suggestedAction: severity > 0.7 ? 'reject' : severity > 0.5 ? 'flag' : severity > 0.3 ? 'review' : 'approve'
    };
  }

  /**
   * AI-powered text moderation using OpenAI
   */
  private async aiModerateText(text: string, options: TextModerationOptions): Promise<ModerationResult> {
    try {
      const response = await fetch('https://api.openai.com/v1/moderations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: text,
          model: 'text-moderation-latest'
        })
      });

      const data = await response.json();
      const result = data.results[0];

      const issues: string[] = [];
      let category: ModerationResult['category'] = 'safe';
      
      if (result.flagged) {
        if (result.categories.sexual) {
          issues.push('Sexual content detected');
          category = 'inappropriate';
        }
        if (result.categories.hate) {
          issues.push('Hate speech detected');
          category = 'inappropriate';
        }
        if (result.categories.violence) {
          issues.push('Violent content detected');
          category = 'inappropriate';
        }
        if (result.categories['self-harm']) {
          issues.push('Self-harm content detected');
          category = 'harmful';
        }
        if (result.categories.illegal) {
          issues.push('Illegal content detected');
          category = 'illegal';
        }
      }

      return {
        approved: !result.flagged,
        confidence: 0.95,
        reasons: issues.length > 0 ? issues : ['Content approved by AI moderation'],
        category,
        suggestedAction: result.flagged ? 'reject' : 'approve'
      };
    } catch (error) {
      console.error('AI text moderation error:', error);
      return this.quickTextCheck(text);
    }
  }

  /**
   * AI-powered image moderation
   */
  private async aiModerateImage(imageBuffer: Buffer, options: MediaModerationOptions): Promise<ModerationResult> {
    try {
      // Convert buffer to base64
      const base64Image = imageBuffer.toString('base64');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'system',
              content: 'You are a content moderator. Analyze this image and determine if it contains inappropriate content like nudity, violence, illegal items, or spam. Respond with a JSON object containing: approved (boolean), reasons (array of strings), category (safe/inappropriate/illegal/spam).'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Please moderate this image for community safety.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 300
        })
      });

      const data = await response.json();
      const aiResponse = JSON.parse(data.choices[0].message.content);

      return {
        approved: aiResponse.approved,
        confidence: 0.9,
        reasons: aiResponse.reasons || ['AI analysis completed'],
        category: aiResponse.category || 'safe',
        suggestedAction: aiResponse.approved ? 'approve' : 'reject'
      };
    } catch (error) {
      console.error('AI image moderation error:', error);
      return {
        approved: true,
        confidence: 0.5,
        reasons: ['AI moderation unavailable, manual review recommended'],
        category: 'safe',
        suggestedAction: 'review'
      };
    }
  }

  /**
   * Validate file size
   */
  private checkFileSize(buffer: Buffer | string, maxSizeMB: number): ModerationResult {
    const size = typeof buffer === 'string' ? buffer.length : buffer.length;
    const maxBytes = maxSizeMB * 1024 * 1024;
    
    if (size > maxBytes) {
      return {
        approved: false,
        confidence: 1.0,
        reasons: [`File size (${(size / 1024 / 1024).toFixed(1)}MB) exceeds limit (${maxSizeMB}MB)`],
        category: 'spam',
        suggestedAction: 'reject'
      };
    }
    
    return {
      approved: true,
      confidence: 1.0,
      reasons: ['File size acceptable'],
      category: 'safe',
      suggestedAction: 'approve'
    };
  }

  /**
   * Validate image file type
   */
  private validateImageType(fileName: string): ModerationResult {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    
    if (!allowedTypes.includes(extension)) {
      return {
        approved: false,
        confidence: 1.0,
        reasons: [`File type ${extension} not allowed. Allowed: ${allowedTypes.join(', ')}`],
        category: 'inappropriate',
        suggestedAction: 'reject'
      };
    }
    
    return {
      approved: true,
      confidence: 1.0,
      reasons: ['Image file type valid'],
      category: 'safe',
      suggestedAction: 'approve'
    };
  }

  /**
   * Validate video file type
   */
  private validateVideoType(fileName: string): ModerationResult {
    const allowedTypes = ['.mp4', '.webm', '.mov', '.avi'];
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    
    if (!allowedTypes.includes(extension)) {
      return {
        approved: false,
        confidence: 1.0,
        reasons: [`Video type ${extension} not allowed. Allowed: ${allowedTypes.join(', ')}`],
        category: 'inappropriate',
        suggestedAction: 'reject'
      };
    }
    
    return {
      approved: true,
      confidence: 1.0,
      reasons: ['Video file type valid'],
      category: 'safe',
      suggestedAction: 'approve'
    };
  }
}

export const contentModerator = new ContentModerator();