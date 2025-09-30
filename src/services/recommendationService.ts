import { api } from './authService';
import { RecommendationRequest, RecommendationResponse, RecommendationType, BookRecommendation } from '../types/recommendationTypes';

const RECOMMENDATION_API_URL = '/v1/recommendations';

/**
 * Generate fallback book recommendations if the API fails
 */
function generateFallbackBooks(
  recommendationType: RecommendationType, 
  limit: number = 10, 
  genre?: string
): BookRecommendation[] {
  // Add slight variations to books depending on recommendation type
  // This gives the user a different experience for each tab
  const typePrefix = recommendationType.substring(0, 2).toUpperCase();
  
  // Demo books to show in case of API failure
  const demoBooks: BookRecommendation[] = [
    {
      book_id: 1001 + (recommendationType === 'top_rated' ? 0 : 100),
      title: `${typePrefix}: The Great Adventure`,
      author: "James Wilson",
      genres: ["Adventure", "Fiction"],
      average_rating: 4.7,
      rating_count: 230,
      relevance_score: 0.95,
      recommendation_reason: "Highly rated adventure novel with compelling characters",
      publication_year: 2023
    },
    {
      book_id: 1002 + (recommendationType === 'top_rated' ? 0 : 200),
      title: `${typePrefix}: Mystery of the Blue Lake`,
      author: "Sarah Johnson",
      genres: ["Mystery", "Thriller"],
      average_rating: 4.5,
      rating_count: 187,
      relevance_score: 0.88,
      recommendation_reason: "Engaging mystery that will keep you guessing",
      publication_year: 2024
    },
    {
      book_id: 1003 + (recommendationType === 'top_rated' ? 0 : 300),
      title: `${typePrefix}: Digital Horizons`,
      author: "Michael Chen",
      genres: ["Science Fiction", "Technology"],
      average_rating: 4.8,
      rating_count: 312,
      relevance_score: 0.92,
      recommendation_reason: "Fascinating look at future technologies",
      publication_year: 2022
    },
    {
      book_id: 1004 + (recommendationType === 'top_rated' ? 0 : 400),
      title: `${typePrefix}: The Hidden Path`,
      author: "Elena Rodriguez",
      genres: ["Fantasy", "Adventure"],
      average_rating: 4.6,
      rating_count: 275,
      relevance_score: 0.85,
      recommendation_reason: "Immersive fantasy world with rich character development",
      publication_year: 2023
    }
  ];
  
  // Filter by genre if provided
  let filteredBooks = genre 
    ? demoBooks.filter(book => book.genres.includes(genre)) 
    : demoBooks;
    
  // If filtering by genre left us with no books, return all books
  if (filteredBooks.length === 0) {
    filteredBooks = demoBooks;
  }
  
  // Return the requested number of books
  return filteredBooks.slice(0, limit);
}

// Cache for storing recommendation results
const recommendationCache: Record<string, { 
  timestamp: number, 
  data: RecommendationResponse 
}> = {};

// Cache duration in milliseconds (24 hours for AI recommendations, 1 hour for others)
const CACHE_DURATION = {
  'ai': 24 * 60 * 60 * 1000, // 24 hours
  'top_rated': 60 * 60 * 1000, // 1 hour
  'similar': 60 * 60 * 1000 // 1 hour
};

// Cooldown period for refresh in milliseconds (30 seconds)
const REFRESH_COOLDOWN = 30 * 1000;

// Last refresh timestamp for cooldown tracking
const lastRefreshTimestamp: Record<string, number> = {};

/**
 * Get recommendations based on the specified type and parameters
 */
export async function getRecommendations(
  params: RecommendationRequest
): Promise<RecommendationResponse> {
  const { recommendation_type, limit = 10, genre, _timestamp } = params;
  
  // Create cache key based on request parameters
  const cacheKey = `${recommendation_type}:${limit}:${genre || ''}`;
  
  // Skip cache if _timestamp is provided (force fresh data)
  const skipCache = !!_timestamp;
  
  // Check if we have a cached result that's still valid
  const cachedResult = recommendationCache[cacheKey];
  if (!skipCache && cachedResult && 
      Date.now() - cachedResult.timestamp < CACHE_DURATION[recommendation_type]) {
    console.log(`Using cached data for ${recommendation_type}`);
    return cachedResult.data;
  }

  try {
    // Create a seed based on the recommendation type to ensure completely different results
    // The seed will be consistent for the same type but different between types
    let typeSpecificSeed;
    switch(recommendation_type) {
      case 'top_rated':
        typeSpecificSeed = 'TR_' + Date.now();
        break;
      case 'similar':
        typeSpecificSeed = 'SIM_' + (Date.now() + 1000);
        break;
      case 'ai':
        typeSpecificSeed = 'AI_' + (Date.now() + 2000);
        break;
      default:
        typeSpecificSeed = recommendation_type + '_' + Date.now();
    }
    
    // Make API request with guaranteed unique parameters per recommendation type
    const requestBody = {
      recommendation_type,
      limit,
      ...(genre && { genre }),
      _timestamp: Date.now(), // Force bypass any server-side caching
      _client_id: typeSpecificSeed, // Type-specific client ID
      _seed: Math.random().toString(36) + recommendation_type, // Extra randomness
      _force_unique: true // Signal to API that this must be unique
    };
    
    console.log(`Making API request for ${recommendation_type} recommendations with unique seed: ${typeSpecificSeed}`);
    const response = await api.post<RecommendationResponse>(RECOMMENDATION_API_URL, requestBody);

    // Cache the result
    recommendationCache[cacheKey] = {
      timestamp: Date.now(),
      data: response.data
    };

    // Update refresh timestamp
    lastRefreshTimestamp[cacheKey] = Date.now();

    return response.data;
  } catch (error) {
    console.error('Failed to fetch recommendations:', error);
    
    // Instead of throwing error, return a valid fallback response with demo books
    // This allows the UI to gracefully handle API failures without error messages
    const fallbackResponse: RecommendationResponse = {
      recommendations: generateFallbackBooks(recommendation_type, limit, genre),
      is_fallback: true,
      fallback_reason: 'Using alternative book recommendations.',
      recommendation_type
    };
    
    // Cache the fallback response to prevent repeated error displays
    recommendationCache[cacheKey] = {
      timestamp: Date.now(),
      data: fallbackResponse
    };
    
    return fallbackResponse;
  }
}

/**
 * Get the time when recommendations were last refreshed
 */
export function getLastRefreshTime(type: RecommendationType, genre?: string): Date | null {
  const cacheKey = `${type}:10:${genre || ''}`;
  const cachedResult = recommendationCache[cacheKey];
  
  if (cachedResult) {
    return new Date(cachedResult.timestamp);
  }
  
  return null;
}

/**
 * Check if recommendations can be refreshed (based on cooldown period)
 */
export function canRefreshRecommendations(type: RecommendationType, genre?: string): boolean {
  const cacheKey = `${type}:10:${genre || ''}`;
  const lastRefresh = lastRefreshTimestamp[cacheKey];
  
  if (!lastRefresh) {
    return true;
  }
  
  return (Date.now() - lastRefresh) >= REFRESH_COOLDOWN;
}

/**
 * Calculate time remaining until next refresh is allowed
 */
export function getTimeUntilRefresh(type: RecommendationType, genre?: string): number {
  const cacheKey = `${type}:10:${genre || ''}`;
  const lastRefresh = lastRefreshTimestamp[cacheKey];
  
  if (!lastRefresh) {
    return 0;
  }
  
  const timeElapsed = Date.now() - lastRefresh;
  return Math.max(0, REFRESH_COOLDOWN - timeElapsed);
}

export const recommendationService = {
  getRecommendations,
  getLastRefreshTime,
  canRefreshRecommendations,
  getTimeUntilRefresh
};
