// =====================================================================
// KUNDA SPACE: ALGORITHMIC MATCHING & COMPATIBILITY ENGINE
// =====================================================================
import { BUSINESS_CONFIG } from './config.js';
import { calculateAge } from './auth.js';

export interface ProfileData {
  id: string;
  userId: string;
  displayName: string;
  gender: 'woman' | 'man' | 'non_binary' | 'other';
  interestedIn: 'men' | 'women' | 'everyone';
  country: string;
  city: string;
  dob: string;
  relationshipIntention: string;
  languages?: string[];
  interests?: string[];
  lifestyleDrinking?: string;
  lifestyleSmoking?: string;
  childrenStatus?: string;
  height?: number;
  minAgePref?: number;
  maxAgePref?: number;
  preferredCountry?: string;
  preferredCities?: string[];
  datingScope?: string;
}

export interface CompatibilityResult {
  score: number; // 0 - 100
  breakdown: {
    intentionScore: number;
    ageScore: number;
    locationScore: number;
    interestsScore: number;
    languagesScore: number;
    lifestyleScore: number;
  };
  sharedInterests: string[];
  sharedLanguages: string[];
  reasons: string[];
  isHardMatch: boolean;
}

/**
 * Checks hard eligibility (Gender preference mutual match)
 */
export function checkHardEligibility(user: ProfileData, candidate: ProfileData): boolean {
  if (user.userId === candidate.userId) return false;

  // Gender interest check for user
  if (user.interestedIn === 'men' && candidate.gender !== 'man') return false;
  if (user.interestedIn === 'women' && candidate.gender !== 'woman') return false;

  // Gender interest check for candidate
  if (candidate.interestedIn === 'men' && user.gender !== 'man') return false;
  if (candidate.interestedIn === 'women' && user.gender !== 'woman') return false;

  return true;
}

/**
 * Calculates compatibility score between two profiles
 */
export function calculateCompatibility(
  user: ProfileData,
  candidate: ProfileData
): CompatibilityResult {
  const isHardMatch = checkHardEligibility(user, candidate);
  if (!isHardMatch) {
    return {
      score: 0,
      breakdown: {
        intentionScore: 0,
        ageScore: 0,
        locationScore: 0,
        interestsScore: 0,
        languagesScore: 0,
        lifestyleScore: 0,
      },
      sharedInterests: [],
      sharedLanguages: [],
      reasons: [],
      isHardMatch: false,
    };
  }

  const reasons: string[] = [];

  // 1. Relationship Intention (25%)
  let intentionScore = 50; // default baseline
  if (user.relationshipIntention === candidate.relationshipIntention) {
    intentionScore = 100;
    reasons.push(`Both seeking ${user.relationshipIntention.replace('_', ' ')}`);
  } else if (
    (user.relationshipIntention === 'serious_relationship' && candidate.relationshipIntention === 'marriage') ||
    (user.relationshipIntention === 'marriage' && candidate.relationshipIntention === 'serious_relationship')
  ) {
    intentionScore = 85;
    reasons.push('Highly aligned long-term relationship commitment');
  }

  // 2. Age Preference (20%)
  const candidateAge = calculateAge(candidate.dob);
  const minAge = user.minAgePref || 20;
  const maxAge = user.maxAgePref || 50;
  let ageScore = 50;

  if (candidateAge >= minAge && candidateAge <= maxAge) {
    ageScore = 100;
    reasons.push(`Age ${candidateAge} falls inside your preferred range`);
  } else {
    const diff = Math.min(Math.abs(candidateAge - minAge), Math.abs(candidateAge - maxAge));
    ageScore = Math.max(10, 100 - diff * 15);
  }

  // 3. Location (15%)
  let locationScore = 40;
  if (user.country.toLowerCase() === candidate.country.toLowerCase()) {
    if (user.city.toLowerCase() === candidate.city.toLowerCase()) {
      locationScore = 100;
      reasons.push(`Both based in ${user.city}, ${user.country}`);
    } else {
      locationScore = 80;
      reasons.push(`Both located in ${user.country}`);
    }
  } else if (user.datingScope === 'international' || candidate.datingScope === 'international') {
    locationScore = 70;
    reasons.push('Open to international connections');
  }

  // 4. Shared Interests (15%)
  const userInterests = user.interests || [];
  const candidateInterests = candidate.interests || [];
  const sharedInterests = userInterests.filter((i) => candidateInterests.includes(i));
  let interestsScore = 50;
  if (sharedInterests.length >= 3) {
    interestsScore = 100;
    reasons.push(`Shares ${sharedInterests.length} common interests: ${sharedInterests.slice(0, 2).join(', ')}`);
  } else if (sharedInterests.length > 0) {
    interestsScore = 70 + sharedInterests.length * 10;
    reasons.push(`Shares ${sharedInterests.length} interest: ${sharedInterests[0]}`);
  }

  // 5. Language Compatibility (10%)
  const userLanguages = user.languages || ['English'];
  const candidateLanguages = candidate.languages || ['English'];
  const sharedLanguages = userLanguages.filter((l) => candidateLanguages.includes(l));
  let languagesScore = 50;
  if (sharedLanguages.length > 0) {
    languagesScore = 100;
    reasons.push(`Both speak ${sharedLanguages.join(' & ')}`);
  }

  // 6. Lifestyle / Children (10%)
  let lifestyleScore = 70;
  if (user.childrenStatus && candidate.childrenStatus) {
    if (user.childrenStatus === candidate.childrenStatus) {
      lifestyleScore = 100;
      reasons.push('Compatible family and future goals');
    }
  }

  // Weighted sum
  const weights = BUSINESS_CONFIG.MATCHING_WEIGHTS;
  const totalScore = Math.round(
    intentionScore * weights.INTENTION +
    ageScore * weights.AGE +
    locationScore * weights.LOCATION +
    interestsScore * weights.INTERESTS +
    languagesScore * weights.LANGUAGE +
    lifestyleScore * weights.LIFESTYLE +
    80 * weights.OTHER
  );

  // Clamped strictly between 0 and 100
  const finalScore = Math.min(100, Math.max(0, totalScore));

  return {
    score: finalScore,
    breakdown: {
      intentionScore,
      ageScore,
      locationScore,
      interestsScore,
      languagesScore,
      lifestyleScore,
    },
    sharedInterests,
    sharedLanguages,
    reasons,
    isHardMatch: true,
  };
}
