/**
 * Target Audience Analysis Response Parser
 * Handles JSON extraction, validation, and normalization for Gemini API responses
 */

interface ScoredItem {
  text: string;
  score: number;
}

interface CustomerSegment {
  profil: string;
  icselArzular: ScoredItem[];
  dissalArzular: ScoredItem[];
  icselEngeller: ScoredItem[];
  dissalEngeller: ScoredItem[];
  ihtiyaclar: ScoredItem[];
}

interface UnnecessaryCustomer {
  profil: string;
}

interface IrresistibleOffers {
  mukemmelMusteriTeklif: string;
  mecburiMusteriTeklif: string;
  gereksizMusteriTeklif: string;
}

export interface StrategicAnalysis {
  mukemmelMusteri: CustomerSegment;
  mecburiMusteri: CustomerSegment;
  gereksizMusteri: UnnecessaryCustomer;
  reddedilemezTeklifler: IrresistibleOffers;
}

/**
 * Extract JSON from markdown code blocks and clean response
 * Handles responses wrapped in ```json...```, ```...```, or plain JSON
 * Also removes any leading/trailing text outside JSON object
 */
function extractJSONFromMarkdown(text: string): string {
  let cleaned = text.trim();
  
  // Remove markdown code blocks (```json...``` or ```...```)
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '');
  cleaned = cleaned.replace(/\n?```\s*$/i, '');
  cleaned = cleaned.trim();
  
  // Find the first { and last } to extract only the JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  return cleaned.trim();
}

/**
 * Normalize importance score to valid range (1-10)
 * Clamps out-of-range values and defaults invalid values to 5
 */
function normalizeScore(score: any): number {
  // Handle non-numeric values
  if (typeof score !== 'number' || isNaN(score)) {
    return 5; // Default to middle value
  }
  
  // Clamp to valid range
  if (score < 1) return 1;
  if (score > 10) return 10;
  
  // Ensure integer
  return Math.round(score);
}

/**
 * Validate and normalize scored items array
 */
function validateScoredItems(
  items: any[],
  fieldName: string,
  minCount: number = 3
): ScoredItem[] {
  if (!Array.isArray(items)) {
    throw new Error(`${fieldName} must be an array`);
  }
  
  if (items.length < minCount) {
    throw new Error(`${fieldName} must contain at least ${minCount} items`);
  }
  
  return items.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`${fieldName}[${index}] must be an object`);
    }
    
    if (typeof item.text !== 'string' || item.text.trim() === '') {
      throw new Error(`${fieldName}[${index}].text must be a non-empty string`);
    }
    
    return {
      text: item.text.trim(),
      score: normalizeScore(item.score),
    };
  });
}

/**
 * Validate customer segment structure
 */
function validateCustomerSegment(
  segment: any,
  segmentName: string
): CustomerSegment {
  if (!segment || typeof segment !== 'object') {
    throw new Error(`${segmentName} must be an object`);
  }
  
  if (typeof segment.profil !== 'string' || segment.profil.trim() === '') {
    throw new Error(`${segmentName}.profil must be a non-empty string`);
  }
  
  return {
    profil: segment.profil.trim(),
    icselArzular: validateScoredItems(segment.icselArzular, `${segmentName}.icselArzular`),
    dissalArzular: validateScoredItems(segment.dissalArzular, `${segmentName}.dissalArzular`),
    icselEngeller: validateScoredItems(segment.icselEngeller, `${segmentName}.icselEngeller`),
    dissalEngeller: validateScoredItems(segment.dissalEngeller, `${segmentName}.dissalEngeller`),
    ihtiyaclar: validateScoredItems(segment.ihtiyaclar, `${segmentName}.ihtiyaclar`),
  };
}

/**
 * Validate unnecessary customer structure
 */
function validateUnnecessaryCustomer(customer: any): UnnecessaryCustomer {
  if (!customer || typeof customer !== 'object') {
    throw new Error('gereksizMusteri must be an object');
  }
  
  if (typeof customer.profil !== 'string' || customer.profil.trim() === '') {
    throw new Error('gereksizMusteri.profil must be a non-empty string');
  }
  
  return {
    profil: customer.profil.trim(),
  };
}

/**
 * Validate irresistible offers structure
 */
function validateIrresistibleOffers(offers: any): IrresistibleOffers {
  if (!offers || typeof offers !== 'object') {
    throw new Error('reddedilemezTeklifler must be an object');
  }
  
  const requiredFields = [
    'mukemmelMusteriTeklif',
    'mecburiMusteriTeklif',
    'gereksizMusteriTeklif',
  ];
  
  for (const field of requiredFields) {
    if (typeof offers[field] !== 'string' || offers[field].trim() === '') {
      throw new Error(`reddedilemezTeklifler.${field} must be a non-empty string`);
    }
  }
  
  return {
    mukemmelMusteriTeklif: offers.mukemmelMusteriTeklif.trim(),
    mecburiMusteriTeklif: offers.mecburiMusteriTeklif.trim(),
    gereksizMusteriTeklif: offers.gereksizMusteriTeklif.trim(),
  };
}

/**
 * Parse and validate Gemini API response for target audience analysis
 * 
 * @param response - Raw response text from Gemini API
 * @returns Validated and normalized strategic analysis
 * @throws Error if response is invalid or missing required fields
 */
export function parseTargetAudienceResponse(response: string): StrategicAnalysis {
  // Extract JSON from markdown if present
  const jsonText = extractJSONFromMarkdown(response);
  
  // Parse JSON
  let parsed: any;
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    throw new Error('Invalid JSON response from Gemini API');
  }
  
  // Validate top-level structure
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Response must be a JSON object');
  }
  
  // Validate and normalize each section
  const mukemmelMusteri = validateCustomerSegment(parsed.mukemmelMusteri, 'mukemmelMusteri');
  const mecburiMusteri = validateCustomerSegment(parsed.mecburiMusteri, 'mecburiMusteri');
  const gereksizMusteri = validateUnnecessaryCustomer(parsed.gereksizMusteri);
  const reddedilemezTeklifler = validateIrresistibleOffers(parsed.reddedilemezTeklifler);
  
  return {
    mukemmelMusteri,
    mecburiMusteri,
    gereksizMusteri,
    reddedilemezTeklifler,
  };
}

export type {
  ScoredItem,
  CustomerSegment,
  UnnecessaryCustomer,
  IrresistibleOffers,
};
