// ...existing code...
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
// Mock IntersectionObserver for jsdom
beforeAll(() => {
  window.IntersectionObserver = class {
    root = null;
    rootMargin = '';
    thresholds = [];
    constructor() {}
    observe() {}
    disconnect() {}
    unobserve() {}
    takeRecords() { return []; }
  };
});
import BookList from '../BookList';
import * as bookService from '../../../services/bookService';

jest.mock('../../../services/bookService');

const mockBooks = [
  {
    id: 1,
    title: 'Test Book',
    author: 'Test Author',
    genres: ['Fiction'],
    publication_date: '2020-01-01',
    average_rating: 4.5,
    total_reviews: 10,
  },
];

(bookService.fetchBooks as jest.Mock).mockResolvedValue(mockBooks);

describe('BookList', () => {
  it('renders books from API', async () => {
    render(<BookList />);
    await waitFor(() => expect(screen.getByText('Test Book')).toBeInTheDocument());
    expect(screen.getByText('Test Author')).toBeInTheDocument();
  });

  it('shows loading state', async () => {
    (bookService.fetchBooks as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<BookList />);
    // There may be multiple progressbars, so check at least one exists
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0);
  });

  it('shows error state', async () => {
    (bookService.fetchBooks as jest.Mock).mockRejectedValue(new Error('API Error'));
    render(<BookList />);
    // There may be multiple error divs, so check at least one exists
    await waitFor(() => {
      expect(screen.getAllByText(/Failed to load books/).length).toBeGreaterThan(0);
    });
  });
});
