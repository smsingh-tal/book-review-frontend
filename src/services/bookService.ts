import { Book } from '../types/Book';
import { api } from './authService';
const API_URL = '/v1/books';

export interface BookQueryParams {
  search?: string;
  genres?: string[];
  author?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  offset?: number;
  limit?: number;
}

export async function fetchBooks(params: BookQueryParams): Promise<Book[]> {
  // Always send search, sortBy, sortOrder
  const { search = '', sortBy = 'title', sortOrder = 'asc', ...rest } = params;
  const response = await api.get(API_URL, {
    params: { search, sortBy, sortOrder, ...rest }
  });
  return response.data.books;
}
