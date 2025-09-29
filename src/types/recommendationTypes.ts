export interface BookRecommendation {
  book_id: number;
  title: string;
  author: string;
  genres: string[];
  average_rating: number;
  rating_count: number;
  publication_year?: number;
  relevance_score: number;
  recommendation_reason: string;
}

export interface RecommendationResponse {
  recommendations: BookRecommendation[];
  is_fallback: boolean;
  fallback_reason?: string;
  recommendation_type: string;
}

export interface RecommendationRequest {
  limit?: number;
  recommendation_type: RecommendationType;
  genre?: string;
  _timestamp?: number; // For cache busting
}

export type RecommendationType = 'top_rated' | 'similar' | 'ai';
