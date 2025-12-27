/**
 * Health Information Extraction Service
 * Extracts health-related information from user messages using keyword matching
 * and AI-assisted extraction
 */

interface ExtractedHealthInfo {
  symptoms: string[];
  conditions: string[];
  medications: string[];
  allergies: string[];
}

// Common symptom keywords
const SYMPTOM_KEYWORDS = [
  'headache', 'fever', 'cough', 'pain', 'nausea', 'dizziness', 'fatigue',
  'sore throat', 'runny nose', 'congestion', 'sneezing', 'aches', 'chills',
  'stomach ache', 'back pain', 'chest pain', 'shortness of breath',
  'difficulty breathing', 'rash', 'itching', 'swelling', 'inflammation',
  'joint pain', 'muscle pain', 'stiffness', 'numbness', 'tingling',
  'blurred vision', 'eye pain', 'ear pain', 'toothache', 'sore',
];

// Common condition keywords
const CONDITION_KEYWORDS = [
  'diabetes', 'hypertension', 'asthma', 'allergies', 'arthritis',
  'depression', 'anxiety', 'migraine', 'eczema', 'psoriasis',
  'heart disease', 'kidney disease', 'liver disease', 'thyroid',
  'hypothyroidism', 'hyperthyroidism', 'cholesterol', 'anemia',
  'osteoporosis', 'osteopenia', 'gout', 'fibromyalgia', 'lupus',
  'autoimmune', 'inflammation', 'chronic', 'condition', 'disorder',
];

// Common medication patterns
const MEDICATION_PATTERNS = [
  /\b(aspirin|ibuprofen|acetaminophen|paracetamol|tylenol|advil|motrin)\b/i,
  /\b(penicillin|amoxicillin|antibiotic|antihistamine|steroid)\b/i,
  /\b(insulin|metformin|blood pressure|cholesterol|statin)\b/i,
  /\b(vitamin|supplement|probiotic|antacid)\b/i,
  /\b\d+\s*mg\s+(of|of the)?\s*[a-z]+\b/i, // "500mg of ..."
];

// Allergy keywords
const ALLERGY_KEYWORDS = [
  'allergic', 'allergy', 'allergic to', 'allergic reaction',
  'peanuts', 'shellfish', 'dairy', 'gluten', 'pollen', 'dust',
];

/**
 * Extract health information from a message using keyword matching
 */
export const extractHealthInfo = (message: string): ExtractedHealthInfo => {
  const lowerMessage = message.toLowerCase();
  const extracted: ExtractedHealthInfo = {
    symptoms: [],
    conditions: [],
    medications: [],
    allergies: [],
  };

  // Extract symptoms
  for (const symptom of SYMPTOM_KEYWORDS) {
    if (lowerMessage.includes(symptom)) {
      // Try to extract the full symptom phrase
      const regex = new RegExp(`(?:i have|i'm experiencing|i feel|having|experience|feeling|suffering from)\\s+(?:a|an|the)?\\s*([^.!?]*${symptom}[^.!?]*)`, 'gi');
      const match = message.match(regex);
      if (match) {
        extracted.symptoms.push(...match.map(m => m.replace(/^(i have|i'm experiencing|i feel|having|experience|feeling|suffering from)\s+(?:a|an|the)?\s*/i, '').trim()));
      } else {
        extracted.symptoms.push(symptom);
      }
    }
  }

  // Extract conditions
  for (const condition of CONDITION_KEYWORDS) {
    if (lowerMessage.includes(condition)) {
      extracted.conditions.push(condition);
    }
  }

  // Extract medications
  for (const pattern of MEDICATION_PATTERNS) {
    const matches = message.match(pattern);
    if (matches) {
      extracted.medications.push(...matches);
    }
  }

  // Look for "taking [medication]" patterns
  const takingMatch = message.match(/\b(?:taking|on|using|prescribed)\s+(?:a|an|the)?\s*([^.!?]+?)(?:\.|,|$)/gi);
  if (takingMatch) {
    takingMatch.forEach(match => {
      const medication = match.replace(/\b(?:taking|on|using|prescribed)\s+(?:a|an|the)?\s*/i, '').replace(/[.,;]$/, '').trim();
      if (medication.length > 2 && medication.length < 50) {
        extracted.medications.push(medication);
      }
    });
  }

  // Extract allergies
  for (const allergy of ALLERGY_KEYWORDS) {
    if (lowerMessage.includes(allergy)) {
      // Try to extract the full allergy phrase
      const regex = new RegExp(`(?:allergic to|allergy to|allergic)\\s+(?:a|an|the)?\\s*([^.!?]+?)(?:\.|,|$)`, 'gi');
      const match = message.match(regex);
      if (match) {
        extracted.allergies.push(...match.map(m => m.replace(/\b(?:allergic to|allergy to|allergic)\s+(?:a|an|the)?\s*/i, '').replace(/[.,;]$/, '').trim()));
      } else {
        extracted.allergies.push(allergy);
      }
    }
  }

  // Remove duplicates and normalize
  extracted.symptoms = [...new Set(extracted.symptoms)].filter(s => s.length > 2);
  extracted.conditions = [...new Set(extracted.conditions)];
  extracted.medications = [...new Set(extracted.medications)].filter(m => m.length > 2);
  extracted.allergies = [...new Set(extracted.allergies)].filter(a => a.length > 2);

  return extracted;
};

/**
 * AI-assisted extraction using the chat API (optional, for better accuracy)
 * This can be called as a background task to improve extraction quality
 */
export const extractHealthInfoWithAI = async (
  message: string,
  openRouterClient: any
): Promise<ExtractedHealthInfo> => {
  if (!openRouterClient) {
    return extractHealthInfo(message); // Fallback to keyword matching
  }

  try {
    const prompt = `Extract health information from this message. Return ONLY a JSON object with this structure:
{
  "symptoms": ["symptom1", "symptom2"],
  "conditions": ["condition1"],
  "medications": ["medication1"],
  "allergies": ["allergy1"]
}

Message: "${message}"

Return only the JSON, no other text.`;

    const response = await openRouterClient.chatCompletion(
      [{ role: 'user', content: prompt }],
      'openai/gpt-4o-mini',
      0.3,
      200
    );

    // Try to parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        symptoms: parsed.symptoms || [],
        conditions: parsed.conditions || [],
        medications: parsed.medications || [],
        allergies: parsed.allergies || [],
      };
    }
  } catch (error) {
    console.error('AI extraction failed, using keyword matching:', error);
  }

  return extractHealthInfo(message);
};

