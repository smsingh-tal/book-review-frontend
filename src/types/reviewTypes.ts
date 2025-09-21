export interface Review {
  id: number;
  content: string;
  rating: number;
  user_id: number;
  book_id: number;
  created_at: string;
  updated_at: string | null;
  helpful_votes: number;
  unhelpful_votes: number;
  user: {
    id: number;
    email: string;
  };
  can_edit: boolean;
}

export interface CreateReviewRequest {
  book_id: number;
  content: string; // UI uses 'content', API expects 'text'
  rating: number;
}

export interface UpdateReviewRequest {
  content?: string;
  rating?: number;
}

export interface ReviewsResponse {
  items: Review[];
  total: number;
  page: number;
  items_per_page: number;
  total_pages: number;
}
