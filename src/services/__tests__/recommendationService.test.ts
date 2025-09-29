import { getRecommendations, getLastRefreshTime, canRefreshRecommendations, getTimeUntilRefresh } from '../recommendationService';
import { api } from '../authService';

// Mock the API module
jest.mock('../authService', () => ({
  api: {
    post: jest.fn()
  }
}));

describe('Recommendation Service', () => {
  // Mock data for testing
  const mockRecommendationResponse = {
    recommendations: [
      {
        book_id: 1,
        title: 'Test Book',
        author: 'Test Author',
        genres: ['Fiction', 'Mystery'],
        average_rating: 4.5,
        rating_count: 100,
        relevance_score: 0.95,
        recommendation_reason: 'Matches your reading preferences'
      }
    ],
    is_fallback: false,
    recommendation_type: 'top_rated'
  };

  beforeEach(() => {
    jest.resetAllMocks();
    // Mock successful API response
    (api.post as jest.Mock).mockResolvedValue({ data: mockRecommendationResponse });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('getRecommendations should call API with correct parameters', async () => {
    await getRecommendations({ recommendation_type: 'top_rated', limit: 5 });
    
    expect(api.post).toHaveBeenCalledWith('/v1/recommendations', {
      recommendation_type: 'top_rated',
      limit: 5
    });
  });

  test('getRecommendations should include genre if provided', async () => {
    await getRecommendations({ 
      recommendation_type: 'similar', 
      limit: 10,
      genre: 'Mystery'
    });
    
    expect(api.post).toHaveBeenCalledWith('/v1/recommendations', {
      recommendation_type: 'similar',
      limit: 10,
      genre: 'Mystery'
    });
  });

  test('getRecommendations should return API response', async () => {
    const result = await getRecommendations({ recommendation_type: 'top_rated' });
    
    expect(result).toEqual(mockRecommendationResponse);
  });

  test('getRecommendations should throw error when API fails', async () => {
    // Clear the test mocks from other tests
    jest.clearAllMocks();
    
    // Mock API error
    (api.post as jest.Mock).mockRejectedValue(new Error('API error'));
    
    // Use a unique recommendation type to avoid caching issues
    await expect(getRecommendations({ 
      recommendation_type: 'top_rated',
      limit: 999 // Use unique limit to avoid cache hit
    }))
    .rejects.toThrow('API error');
  });

  test('getLastRefreshTime should return null for uncached recommendation type', () => {
    const result = getLastRefreshTime('ai');
    
    expect(result).toBeNull();
  });

  test('canRefreshRecommendations should return true for uncached recommendation type', () => {
    const result = canRefreshRecommendations('ai');
    
    expect(result).toBe(true);
  });

  test('getTimeUntilRefresh should return 0 for uncached recommendation type', () => {
    const result = getTimeUntilRefresh('ai');
    
    expect(result).toBe(0);
  });
});
