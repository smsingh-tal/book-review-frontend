// React is used by JSX transpilation
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RecommendationPage from '../RecommendationPage';
import * as recommendationService from '../../../services/recommendationService';

// Mock the service
jest.mock('../../../services/recommendationService');

// Mock React Router
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}));

describe('RecommendationPage', () => {
  const mockRecommendations = {
    recommendations: [
      {
        book_id: 1,
        title: 'Test Book',
        author: 'Test Author',
        genres: ['Fiction', 'Mystery'],
        average_rating: 4.5,
        rating_count: 100,
        relevance_score: 0.95,
        publication_year: 2023,
        recommendation_reason: 'Matches your reading preferences'
      }
    ],
    is_fallback: false,
    fallback_reason: null,
    recommendation_type: 'top_rated'
  };

  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'dummy-token'),
        setItem: jest.fn(),
        removeItem: jest.fn()
      },
      writable: true
    });
    
    // Mock service functions
    (recommendationService.getRecommendations as jest.Mock).mockResolvedValue(mockRecommendations);
    (recommendationService.getLastRefreshTime as jest.Mock).mockReturnValue(new Date());
    (recommendationService.canRefreshRecommendations as jest.Mock).mockReturnValue(true);
  });

  it('should render recommendations when loaded', async () => {
    render(<RecommendationPage />);
    
    // Then it should display recommendations
    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument();
      expect(screen.getByText('by Test Author')).toBeInTheDocument();
      expect(screen.getByText('Matches your reading preferences')).toBeInTheDocument();
    });
  });

  it('should show fallback message when recommendations are fallback', async () => {
    (recommendationService.getRecommendations as jest.Mock).mockResolvedValue({
      ...mockRecommendations,
      is_fallback: true,
      fallback_reason: 'No reading history found'
    });
    
    render(<RecommendationPage />);
    
    await waitFor(() => {
      expect(screen.getByText('No reading history found')).toBeInTheDocument();
    });
  });

  it('should show error message when recommendations fail to load', async () => {
    (recommendationService.getRecommendations as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch')
    );
    
    render(<RecommendationPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch recommendations/i)).toBeInTheDocument();
    });
  });
});
