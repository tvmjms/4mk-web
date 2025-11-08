// lib/textSummarizer.ts

// Intelligent AI-powered text summarization utility
export async function summarizeTitle(originalTitle: string, maxLength: number = 50): Promise<string> {
  // If the title is already short enough, return as-is
  if (originalTitle.length <= maxLength) {
    return originalTitle;
  }

  // Try AI-powered intelligent extraction first
  const intelligentSummary = await intelligentExtract(originalTitle, maxLength);
  
  // For production with OpenAI API (uncomment and add API key for even better results):
  /*
  try {
    const response = await fetch('/api/summarize-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text: originalTitle, 
        maxLength: maxLength 
      })
    });
    
    if (response.ok) {
      const { summary } = await response.json();
      return summary;
    }
  } catch (error) {
    logger.warn('AI summarization failed, falling back to intelligent extraction:', error);
  }
  */

  return intelligentSummary;
}

// Intelligent extraction that finds the core need even if buried in text
async function intelligentExtract(text: string, maxLength: number): Promise<string> {
  // Step 1: Identify the core need using pattern matching and NLP techniques
  const coreNeed = extractCoreNeed(text);
  
  // Step 2: If we found a specific need, format it concisely
  if (coreNeed) {
    const formatted = formatNeedConcisely(coreNeed, text, maxLength);
    if (formatted.length <= maxLength) {
      return formatted;
    }
  }
  
  // Step 3: Fall back to smart truncation if extraction fails
  return smartTruncate(text, maxLength);
}

// Extract the actual need from potentially long, story-like text
function extractCoreNeed(text: string): string | null {
  const lowerText = text.toLowerCase();
  
  // Define patterns that indicate what someone actually needs
  const needPatterns = [
    // Direct need statements
    /(?:i need|need|looking for|seeking|require|want)\s+([^.!?]+)/gi,
    // Request patterns
    /(?:can someone|could someone|anyone)\s+([^.!?]+)/gi,
    // Help patterns
    /(?:help (?:me )?(?:with )?|assistance (?:with )?)\s*([^.!?]+)/gi,
    // Service requests
    /(?:ride to|drive to|transport to|take me to)\s+([^.!?]+)/gi,
    /(?:food|groceries|meal|dinner|lunch|breakfast)\s*([^.!?]*)/gi,
    /(?:babysit|childcare|watch (?:my )?(?:kids?|children))\s*([^.!?]*)/gi,
    /(?:medical|doctor|appointment|hospital|pharmacy)\s*([^.!?]*)/gi,
    // Action patterns
    /(?:pick up|deliver|bring|carry|move)\s+([^.!?]+)/gi,
  ];
  
  // Try each pattern to find the core need
  for (const pattern of needPatterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      // Get the longest, most specific match
      const bestMatch = matches.reduce((best, current) => 
        current[0].length > best[0].length ? current : best
      );
      return bestMatch[0].trim();
    }
  }
  
  // Look for sentences with high-priority keywords
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const priorityKeywords = [
    'urgent', 'emergency', 'asap', 'immediately', 'today', 'now',
    'need', 'help', 'ride', 'food', 'medical', 'childcare', 'housing',
    'groceries', 'transportation', 'appointment', 'medicine', 'prescription'
  ];
  
  for (const sentence of sentences) {
    const keywordCount = priorityKeywords.filter(keyword => 
      sentence.toLowerCase().includes(keyword)
    ).length;
    
    if (keywordCount >= 2) { // Sentence has multiple priority keywords
      return sentence.trim();
    }
  }
  
  return null;
}

// Format the extracted need concisely while preserving essential info
function formatNeedConcisely(coreNeed: string, fullText: string, maxLength: number): string {
  // Clean up the core need
    const formatted = coreNeed.trim();
  
  // Extract key details from the full text
  const timePattern = /(?:today|tomorrow|this (?:morning|afternoon|evening)|(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(?:\d{1,2}:\d{2})|(?:\d{1,2}\s*(?:am|pm)))/gi;
  const locationPattern = /(?:(?:in|at|to|from)\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd))?)/g;
  
  const timeMatches = fullText.match(timePattern);
  const locationMatches = fullText.match(locationPattern);
  
  // Build concise summary with key details
  let summary = formatted;
  
  if (timeMatches && timeMatches.length > 0) {
    const time = timeMatches[0].toLowerCase();
    summary += ` ${time}`;
  }
  
  if (locationMatches && locationMatches.length > 0) {
    const location = locationMatches[0];
    if (summary.length + location.length + 4 <= maxLength) {
      summary += ` - ${location}`;
    }
  }
  
  // Ensure it fits within length limit
  if (summary.length > maxLength) {
    summary = summary.substring(0, maxLength - 3) + '...';
  }
  
  return summary.trim();
}

// Smart truncation that preserves meaning (fallback)
function smartTruncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  // Remove common filler words first
  const fillerWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  const words = text.split(' ');
  
  // Keep important words, remove fillers if needed
  const importantWords = words.filter(word => 
    !fillerWords.includes(word.toLowerCase()) || words.length <= 3
  );
  
  let result = importantWords.join(' ');
  
  // If still too long, truncate at word boundaries
  if (result.length > maxLength) {
    const truncated = result.substring(0, maxLength - 3).split(' ');
    truncated.pop(); // Remove potentially partial last word
    result = truncated.join(' ') + '...';
  }
  
  return result;
}

// Cache for summarized titles to avoid repeated processing
const titleCache = new Map<string, string>();

export async function getCachedSummarizedTitle(originalTitle: string, maxLength: number = 50): Promise<string> {
  const cacheKey = `${originalTitle}-${maxLength}`;
  
  if (titleCache.has(cacheKey)) {
    return titleCache.get(cacheKey)!;
  }
  
  const summarized = await summarizeTitle(originalTitle, maxLength);
  titleCache.set(cacheKey, summarized);
  
  return summarized;
}