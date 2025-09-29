import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RecommendationPage from './RecommendationPage';
import { api } from '../../services/authService';

// Mock the API
jest.mock('../../services/authService', () => ({
  api: {
    post: jest.fn()
  }
}));

// Mock React Router
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}));

describe('RecommendationPage Integration Test', () => {
  const mockRecommendations = {
    recommendations: [
      {
        book_id: 1,
        title: 'Test Book 1',
        author: 'Author 1',
        genres: ['Fiction'],
        average_rating: 4.2,
        rating_count: 120,
        relevance_score: 0.9,
        recommendation_reason: 'Highly rated in Fiction'
      },
      {
        book_id: 2,
        title: 'Test Book 2',
        author: 'Author 2',
        genres: ['Mystery'],
        average_rating: 4.0,
        rating_count: 85,
        relevance_score: 0.85,
        recommendation_reason: 'Popular Mystery novel'
      }
    ],
    is_fallback: false,
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
    
    // Mock API response
    (api.post as jest.Mock).mockResolvedValue({ data: mockRecommendations });
  });

  it('should fetch and display top-rated recommendations', async () => {
    render(<RecommendationPage />);
    
    // Verify API call - now with flexible parameter matching
    expect(api.post).toHaveBeenCalledWith(
      '/v1/recommendations', 
      expect.objectContaining({
        recommendation_type: 'top_rated',
        limit: 10
      })
    );
    
    // Wait for recommendations to appear
    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument();
      expect(screen.getByText('by Author 1')).toBeInTheDocument();
      expect(screen.getByText('Test Book 2')).toBeInTheDocument();
    });
  });

  it('should change recommendation type when tabs are clicked', async () => {
    render(<RecommendationPage />);
    
    // Wait for initial recommendations to load
    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument();
    });
    
    // Set up mock response for similar recommendations
    const similarRecommendations = {
      ...mockRecommendations,
      recommendation_type: 'similar',
      recommendations: [
        {
          book_id: 3,
          title: 'Similar Book',
          author: 'Similar Author',
          genres: ['Fiction', 'Adventure'],
          average_rating: 4.1,
          rating_count: 95,
          relevance_score: 0.92,
          recommendation_reason: 'Similar to your favorites'
        }
      ]
    };
    
    (api.post as jest.Mock).mockResolvedValueOnce({ data: similarRecommendations });
    
    // Click the Similar Books tab
    fireEvent.click(screen.getByText('Similar Books'));
    
    // Verify API call with correct type - using flexible parameter matching
    await waitFor(() => {
      // Check that at least one call was made with the similar recommendation type
      expect(api.post).toHaveBeenCalledWith(
        '/v1/recommendations', 
        expect.objectContaining({
          recommendation_type: 'similar',
          limit: 10
        })
      );
    });
    
    // Check that new recommendations are displayed
    await waitFor(() => {
      expect(screen.getByText('Similar Book')).toBeInTheDocument();
      expect(screen.getByText('by Similar Author')).toBeInTheDocument();
      expect(screen.getByText('Similar to your favorites')).toBeInTheDocument();
    });
  });

  it('should apply genre filter when selected', async () => {
    render(<RecommendationPage />);
    
    // Wait for initial recommendations to load
    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument();
    });
    
    // Set up mock response for filtered recommendations
    const filteredRecommendations = {
      ...mockRecommendations,
      recommendations: [
        {
          book_id: 4,
          title: 'Mystery Book',
          author: 'Mystery Author',
          genres: ['Mystery', 'Thriller'],
          average_rating: 4.3,
          rating_count: 110,
          relevance_score: 0.95,
          recommendation_reason: 'Top-rated Mystery book'
        }
      ]
    };
    
    // Reset the mock to clear previous calls
    (api.post as jest.Mock).mockReset();
    
    // Set up mock to capture the actual parameters
    (api.post as jest.Mock).mockImplementation((url, data) => {
      // For requests with genre=Mystery, return the filtered recommendations
      if (url === '/v1/recommendations' && data.genre === 'Mystery') {
        return Promise.resolve({ data: filteredRecommendations });
      }
      // For other requests, return the original mock recommendations
      return Promise.resolve({ data: mockRecommendations });
    });
    
    // Select Mystery genre
    fireEvent.mouseDown(screen.getByLabelText('Genre'));
    // Wait for the menu to be visible
    await waitFor(() => {
      const menuItems = screen.getAllByRole('option');
      const mysteryItem = menuItems.find(item => item.textContent === 'Mystery');
      if (mysteryItem) {
        fireEvent.click(mysteryItem);
      } else {
        throw new Error('Mystery option not found');
      }
    });
    
    // Verify that at least one API call was made with the genre parameter
    await waitFor(() => {
      // Find if any call to the API included the genre parameter
      const calls = (api.post as jest.Mock).mock.calls;
      const hasCallWithGenre = calls.some(call => 
        call[0] === '/v1/recommendations' && 
        call[1].recommendation_type === 'top_rated' &&
        call[1].genre === 'Mystery'
      );
      
      expect(hasCallWithGenre).toBe(true);
    });
    
    // Check that filtered recommendations are displayed
    await waitFor(() => {
      expect(screen.getByText('Mystery Book')).toBeInTheDocument();
      expect(screen.getByText('by Mystery Author')).toBeInTheDocument();
    });
  });
});
