import axios from 'axios';
import type { Review, CreateReviewRequest, UpdateReviewRequest, ReviewsResponse } from '../../types/reviewTypes';

const api = axios.create({
  baseURL: 'http://localhost:8000/v1',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getBookReviews = async (bookId: number, page = 1) => {
  const response = await api.get<ReviewsResponse>('/reviews', {
    params: { book_id: bookId, page, sort_by: 'date', sort_order: 'desc' }
  });
  return response.data;
};

export const createReview = async (review: CreateReviewRequest) => {
  // Map 'content' to 'text' for API
  const { content, ...rest } = review;
  const payload = { ...rest, text: content };
  const response = await api.post<Review>('/reviews', payload);
  return response.data;
};

export const updateReview = async (reviewId: number, review: UpdateReviewRequest) => {
  const response = await api.put<Review>(`/reviews/${reviewId}`, review);
  return response.data;
};

export const deleteReview = async (reviewId: number) => {
  const response = await api.delete<{ message: string }>(`/reviews/${reviewId}`);
  return response.data;
};

export const voteOnReview = async (reviewId: number, isHelpful: boolean) => {
  const response = await api.post(`/reviews/${reviewId}/vote`, { is_helpful: isHelpful });
  return response.data;
};
