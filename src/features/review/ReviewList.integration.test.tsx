import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { ProfileService } from '../../services/profileService';
import ReviewList from './ReviewList';
jest.mock('./reviewService', () => ({
  getBookReviews: jest.fn().mockResolvedValue({ items: [], total_pages: 1 }),
}));

jest.mock('../../services/profileService');

const mockBook = {
  id: 123,
  title: 'Test Book',
  author: 'Test Author',
  genres: ['Fiction'],
  publication_date: '2025-01-01',
  average_rating: 4.5,
  total_reviews: 10,
};

describe('ReviewList Favorite Integration', () => {
  beforeEach(() => {
    (ProfileService as jest.Mock).mockImplementation(() => ({
      getFavorites: jest.fn().mockResolvedValue([]),
      addToFavorites: jest.fn().mockResolvedValue({ id: 1, book_id: 123, created_at: '2025-09-21T10:00:00Z' }),
      removeFromFavorites: jest.fn().mockResolvedValue(undefined),
    }));
    localStorage.setItem('access_token', 'test-token');
  });

  it('can mark and unmark favorite from Write Review screen', async () => {
    render(<ReviewList bookId={123} book={mockBook} />);
    // Wait for favorite state to load
    await waitFor(() => {
      expect(screen.getByLabelText('Mark Favorite')).toBeInTheDocument();
    });
    // Mark as favorite
    userEvent.click(screen.getByLabelText('Mark Favorite'));
    await waitFor(() => {
      expect(screen.getByLabelText('Unmark Favorite')).toBeInTheDocument();
    });
    // Unmark as favorite
    userEvent.click(screen.getByLabelText('Unmark Favorite'));
    await waitFor(() => {
      expect(screen.getByLabelText('Mark Favorite')).toBeInTheDocument();
    });
  });
});
