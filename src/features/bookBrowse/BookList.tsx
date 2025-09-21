import React, { useEffect, useState, useRef, useCallback } from 'react';
import { fetchBooks, BookQueryParams } from '../../services/bookService';
import { Book } from '../../types/Book';
import BookGridItem from './BookGridItem';
import BookTable from './BookTable';
import ReviewList from '../review/ReviewList';
import { Box, Paper, Typography, CircularProgress, Button, ToggleButton, ToggleButtonGroup } from '@mui/material';
import BookSearch from './BookSearch';
import { ProfileService } from '../../services/profileService';

const PAGE_SIZE = 20;

const BookList: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>(() => {
    const favs = localStorage.getItem('favorite_book_ids');
    return favs ? JSON.parse(favs) : [];
  });
  // Removed unused favoriteLoading state
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [query, setQuery] = useState<BookQueryParams>({ offset: 0, limit: PAGE_SIZE });
  const [view, setView] = useState<'card' | 'list'>('card');
  const [sortBy, setSortBy] = useState<string>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const observer = useRef<IntersectionObserver | null>(null);
  const lastBookRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading || view === 'list') return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore) {
          setQuery(q => ({ ...q, offset: (q.offset || 0) + PAGE_SIZE }));
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore, view]
  );

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchBooks(query)
      .then(data => {
        setBooks(prev => query.offset === 0 ? data : [...prev, ...data]);
        setHasMore(data.length === PAGE_SIZE);
      })
      .catch(() => setError('Failed to load books'))
      .finally(() => setLoading(false));
  }, [query]);

  // Load favorites from backend on mount
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const access_token = localStorage.getItem('access_token') || '';
        const profileService = new ProfileService(access_token);
        const favorites = await profileService.getFavorites(100, 0);
        const ids = favorites.map(favorite => favorite.book_id);
        setFavoriteIds(ids);
        // Keep localStorage in sync for components that rely on it
        localStorage.setItem('favorite_book_ids', JSON.stringify(ids));
      } catch (error) {
        console.error("Failed to fetch favorites:", error);
      }
    };
    
    fetchFavorites();
  }, []);

  const handleToggleFavorite = async (bookId: number, next: boolean) => {
    const access_token = localStorage.getItem('access_token') || '';
    const profileService = new ProfileService(access_token);
    try {
      if (next) {
        await profileService.addToFavorites(bookId);
        setFavoriteIds(ids => [...ids, bookId]);
      } else {
        await profileService.removeFromFavorites(bookId);
        setFavoriteIds(ids => ids.filter(id => id !== bookId));
      }
      
      // Update localStorage to keep it in sync
      const updatedIds = next 
        ? [...favoriteIds, bookId] 
        : favoriteIds.filter(id => id !== bookId);
      localStorage.setItem('favorite_book_ids', JSON.stringify(updatedIds));
    } catch (error) {
      console.error("Failed to update favorites:", error);
      // Optionally show error to the user
    }
  };

  const handleSearch = (search: string) => {
    setQuery(q => ({ ...q, search, offset: 0 }));
  };
  // handleFilter removed
  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setSortBy(sortBy);
    setSortOrder(sortOrder);
    setQuery(q => ({ ...q, sortBy, sortOrder, offset: 0 }));
  };
  const handleViewChange = (_event: React.MouseEvent<HTMLElement>, nextView: 'card' | 'list') => {
    if (nextView) setView(nextView);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, minHeight: 600, transition: 'min-height 0.2s' }}>
        {!selectedBookId ? (
          <>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', mb: 3, gap: 2 }}>
              <Box sx={{ flex: 1, maxWidth: { xs: '100%', sm: 500 } }}>
                <BookSearch onSearch={handleSearch} />
              </Box>
              <ToggleButtonGroup
                value={view}
                exclusive
                onChange={handleViewChange}
                sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
              >
                <ToggleButton value="card">Card View</ToggleButton>
                <ToggleButton value="list">List View</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Box sx={{ width: '100%', minHeight: 600, transition: 'min-height 0.2s' }}>
              {view === 'list' ? (
                <Box sx={{ width: '100%', minHeight: 600 }}>
                  <BookTable 
                    books={books} 
                    sortBy={sortBy} 
                    sortOrder={sortOrder} 
                    onSort={handleSort}
                    onRowClick={(bookId: number) => setSelectedBookId(bookId)}
                    favoriteIds={favoriteIds}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 3, width: '100%', minHeight: 600 }}>
                  {books.map((book, idx) => {
                    const handleClick = () => setSelectedBookId(book.id);
                    const isFavorite = favoriteIds.includes(book.id);
                    if (idx === books.length - 1) {
                      return (
                        <div ref={lastBookRef} key={book.id} onClick={handleClick} style={{ cursor: 'pointer' }}>
                          <BookGridItem
                            book={book}
                            isFavorite={isFavorite}
                            onToggleFavorite={handleToggleFavorite}
                          />
                        </div>
                      );
                    }
                    return (
                      <div key={book.id} onClick={handleClick} style={{ cursor: 'pointer' }}>
                        <BookGridItem
                          book={book}
                          isFavorite={isFavorite}
                          onToggleFavorite={handleToggleFavorite}
                        />
                      </div>
                    );
                  })}
                </Box>
              )}
            </Box>
            {loading && <CircularProgress sx={{ mt: 2 }} />}
            {error && <div>{error}</div>}
            {!loading && books.length === 0 && <div style={{ textAlign: 'center', color: '#888', fontSize: 18, marginTop: 32 }}>No result found</div>}
          </>
        ) : (
          <Box>
            <Button variant="outlined" onClick={() => setSelectedBookId(null)} sx={{ mb: 2 }}>Back to Book List</Button>
            <ReviewList 
              bookId={selectedBookId} 
              book={books.find(b => b.id === selectedBookId) || null}
              onReviewSubmitted={async () => {
                // Refetch books to update average rating and review count
                const updatedBooks = await fetchBooks({ offset: 0, limit: PAGE_SIZE });
                setBooks(updatedBooks);
              }}
            />
          </Box>
        )}
        {loading && <CircularProgress sx={{ mt: 2 }} />}
        {error && <Typography color="error">{error}</Typography>}
        {!loading && books.length === 0 && <Typography sx={{ textAlign: 'center', color: 'text.secondary', fontSize: 18, mt: 4 }}>No result found</Typography>}
      </Paper>
    </Box>
  );
};

export default BookList;
