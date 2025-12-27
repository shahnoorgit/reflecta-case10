/**
 * Error utility functions for parsing and formatting API errors
 */

export interface QuotaErrorInfo {
  isQuotaError: boolean;
  remaining?: number;
  required?: number;
  message: string;
}

/**
 * Parse ElevenLabs API error to extract quota information
 */
export const parseElevenLabsError = (error: any): QuotaErrorInfo => {
  const errorMessage = error?.message || String(error);
  
  // Check if it's a quota error
  if (errorMessage.includes('quota_exceeded') || errorMessage.includes('quota')) {
    try {
      // Try to extract JSON from error message
      const jsonMatch = errorMessage.match(/\{.*\}/);
      if (jsonMatch) {
        const errorData = JSON.parse(jsonMatch[0]);
        const detail = errorData?.detail || {};
        
        if (detail.status === 'quota_exceeded') {
          const remaining = detail.remaining;
          const required = detail.required;
          
          return {
            isQuotaError: true,
            remaining,
            required,
            message: `Voice quota exceeded. You have ${remaining || 0} credits remaining, but ${required || 0} credits are required. Please upgrade your ElevenLabs plan or wait for quota reset.`,
          };
        }
      }
    } catch (parseError) {
      // If parsing fails, return generic quota error
      return {
        isQuotaError: true,
        message: 'Voice quota exceeded. Please upgrade your ElevenLabs plan or wait for quota reset.',
      };
    }
  }
  
  // Not a quota error, return original message
  return {
    isQuotaError: false,
    message: errorMessage,
  };
};

/**
 * Format error message for display
 */
export const formatErrorForDisplay = (error: any): string => {
  const parsed = parseElevenLabsError(error);
  return parsed.message;
};




