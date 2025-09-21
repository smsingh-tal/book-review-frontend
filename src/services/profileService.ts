import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/v1';

export interface Profile {
  id: number;
  email: string;
  name: string;
  profile_image_url?: string;
  created_at: string;
  last_login?: string;
  reviews: ReviewBrief[];
  favorites: Favorite[];
}

export interface ProfileUpdate {
  name?: string;
}

export interface ReviewBrief {
  id: number;
  book_id: number;
  content: string;
  rating: number;
  created_at: string;
  updated_at?: string;
}

export interface Favorite {
  id: number;
  book_id: number;
  created_at: string;
}

export class ProfileService {
  private api;

  constructor(access_token: string) {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
  }

  async getProfile() {
    const response = await this.api.get('/profile/me');
    return response.data as Profile;
  }

  async updateProfile(data: ProfileUpdate) {
    const response = await this.api.put('/profile/me', data);
    return response.data as Profile;
  }

  async getReviews(limit: number = 10, offset: number = 0) {
    const response = await this.api.get('/profile/me/reviews', {
      params: { limit, offset }
    });
    return response.data as ReviewBrief[];
  }

  async getFavorites(limit: number = 10, offset: number = 0) {
    const response = await this.api.get('/profile/me/favorites', {
      params: { limit, offset }
    });
    return response.data as Favorite[];
  }

  async addToFavorites(bookId: number) {
    const response = await this.api.post(`/profile/me/favorites/${bookId}`);
    return response.data as Favorite;
  }

  async removeFromFavorites(bookId: number) {
    await this.api.delete(`/profile/me/favorites/${bookId}`);
  }
}
