/**
 * Image Generation Service
 * Uses Pollinations AI (FREE) or OpenAI DALL-E for generating images
 */

// Free API - no key required!
const POLLINATIONS_URL = 'https://image.pollinations.ai/prompt';

// Paid API - requires OpenAI key
const OPENAI_API_URL = 'https://api.openai.com/v1/images/generations';

export interface GeneratedImage {
  url: string;
  revisedPrompt?: string;
}

export interface ImageGenerationOptions {
  model?: 'dall-e-2' | 'dall-e-3' | 'pollinations';
  size?: '256x256' | '512x512' | '1024x1024' | '1024x1792' | '1792x1024';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  n?: number;
}

/**
 * Check if a message is requesting image generation
 */
export const isImageGenerationRequest = (message: string): boolean => {
  const lowerMessage = message.toLowerCase();
  
  // Common patterns for image generation requests (flexible matching)
  const patterns = [
    // Direct commands - can appear anywhere
    /(generate|create|make|draw|design|produce|render)\s+(an?\s+)?(image|picture|photo|illustration|art|artwork|drawing|visual)/i,
    // "image/picture of" patterns
    /(image|picture|photo|illustration)\s+of/i,
    // "draw/paint me" patterns
    /(draw|paint|sketch)\s+(me\s+)?(an?\s+)?/i,
    // Imagination patterns
    /imagine\s+(an?\s+)?/i,
    /visualize\s+(an?\s+)?/i,
    // Request patterns - "can you", "please", "I want"
    /(can you|could you|please|i want|i need|i'd like)\s+(to\s+)?(generate|create|make|draw|show|produce)\s+(an?\s+)?(image|picture|photo|visual)/i,
    // "show me" patterns
    /show\s+me\s+(an?\s+)?(image|picture|photo|visual|what)/i,
    // Simple "create/generate" + description (when image context is implied)
    /^(generate|create|draw|paint|make)\s+[a-z]/i,
  ];

  return patterns.some(pattern => pattern.test(lowerMessage));
};

/**
 * Extract the image prompt from a generation request
 */
export const extractImagePrompt = (message: string): string => {
  // Remove common prefixes and request patterns
  let prompt = message
    // Remove polite prefixes
    .replace(/^(can you|could you|please|i want|i need|i'd like)\s+(to\s+)?/i, '')
    // Remove action + image type patterns
    .replace(/^(generate|create|make|draw|design|produce|render|paint|sketch|show)\s+(me\s+)?(an?\s+)?(image|picture|photo|illustration|art|artwork|drawing|visual)\s+(of\s+)?/i, '')
    // Remove simple action patterns
    .replace(/^(image|picture|photo)\s+of\s+/i, '')
    .replace(/^(draw|paint|sketch)\s+(me\s+)?(an?\s+)?/i, '')
    .replace(/^(create|generate|make)\s+(me\s+)?(an?\s+)?/i, '')
    .replace(/^imagine\s+(an?\s+)?/i, '')
    .replace(/^visualize\s+(an?\s+)?/i, '')
    // Remove "show me" patterns
    .replace(/^show\s+me\s+(an?\s+)?(image|picture|photo|visual)?\s*(of\s+)?/i, '')
    .replace(/^show\s+me\s+what\s+/i, '')
    // Clean up
    .replace(/\s+looks?\s+like$/i, '') // "...looks like" at end
    .trim();

  // If nothing left, use the original message
  return prompt || message;
};

/**
 * Generate an image using Pollinations AI (FREE!)
 * Note: Pollinations generates images on-demand when the URL is accessed
 */
export const generateImageWithPollinations = async (
  prompt: string,
  width: number = 1024,
  height: number = 1024
): Promise<GeneratedImage | null> => {
  try {
    console.log('Generating image with Pollinations:', prompt.slice(0, 50) + '...');
    
    // Pollinations uses URL encoding for the prompt
    const encodedPrompt = encodeURIComponent(prompt);
    // Add a unique seed for cache-busting and consistent results
    const seed = Date.now();
    const imageUrl = `${POLLINATIONS_URL}/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${seed}`;
    
    // Pre-fetch the image to trigger generation
    // This ensures the image is ready when displayed
    console.log('Pre-fetching image to trigger generation...');
    const response = await fetch(imageUrl, { 
      method: 'GET',
      headers: {
        'Accept': 'image/*',
      },
    });
    
    if (response.ok && response.headers.get('content-type')?.includes('image')) {
      console.log('✓ Image generated successfully (Pollinations)');
      return {
        url: imageUrl,
        revisedPrompt: prompt,
      };
    }
    
    // If content-type isn't image, the generation might have failed
    const contentType = response.headers.get('content-type');
    console.log('Response content-type:', contentType);
    
    if (response.ok) {
      // Still return the URL, the image might load on retry
      console.log('⚠ Image may still be generating, returning URL anyway');
      return {
        url: imageUrl,
        revisedPrompt: prompt,
      };
    }
    
    throw new Error(`Failed to generate image: ${response.status}`);
  } catch (error) {
    console.error('Pollinations error:', error);
    throw error;
  }
};

/**
 * Generate an image using DALL-E (requires paid OpenAI API)
 */
export const generateImageWithDallE = async (
  prompt: string,
  apiKey: string,
  options: ImageGenerationOptions = {}
): Promise<GeneratedImage | null> => {
  if (!apiKey) {
    throw new Error('OpenAI API key required for DALL-E');
  }

  const {
    size = '1024x1024',
    quality = 'standard',
    style = 'vivid',
  } = options;

  try {
    console.log('Generating image with DALL-E:', prompt.slice(0, 50) + '...');

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size,
        quality,
        style,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('DALL-E API error:', error);
      
      if (response.status === 402) {
        throw new Error('OpenAI billing required. Using free Pollinations instead...');
      }
      throw new Error(`DALL-E error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.data && data.data[0]) {
      console.log('✓ Image generated successfully (DALL-E)');
      return {
        url: data.data[0].url,
        revisedPrompt: data.data[0].revised_prompt,
      };
    }

    return null;
  } catch (error) {
    console.error('DALL-E error:', error);
    throw error;
  }
};

/**
 * Generate an image - tries Pollinations (free) first
 */
export const generateImage = async (
  prompt: string,
  apiKey?: string,
  options: ImageGenerationOptions = {}
): Promise<GeneratedImage | null> => {
  // Use Pollinations (FREE) by default
  try {
    return await generateImageWithPollinations(prompt);
  } catch (pollinationsError) {
    console.log('Pollinations failed, trying DALL-E...');
    
    // Fall back to DALL-E if available
    if (apiKey) {
      return await generateImageWithDallE(prompt, apiKey, options);
    }
    
    throw pollinationsError;
  }
};

/**
 * Generate image and return as attachment-compatible format
 */
export const generateImageAsAttachment = async (
  prompt: string,
  apiKey: string,
  options?: ImageGenerationOptions
): Promise<{ url: string; revisedPrompt?: string } | null> => {
  const result = await generateImage(prompt, apiKey, options);
  
  if (!result) return null;

  return {
    url: result.url,
    revisedPrompt: result.revisedPrompt,
  };
};

export default {
  isImageGenerationRequest,
  extractImagePrompt,
  generateImage,
  generateImageWithPollinations,
  generateImageWithDallE,
  generateImageAsAttachment,
};

