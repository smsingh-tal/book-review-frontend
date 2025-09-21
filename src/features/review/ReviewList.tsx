
import React, { useEffect, useState } from 'react';
import { getBookReviews } from './reviewService';
import type { Review } from '../../types/reviewTypes';
import type { Book } from '../../types/Book';
import { Button, Chip, Typography, Pagination, Box, CircularProgress, IconButton, Tooltip, Paper } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { ProfileService } from '../../services/profileService';

interface ReviewListProps {
  bookId: number;
  book?: Book | null;
  onReviewSubmitted?: () => void;
}

const ReviewList: React.FC<ReviewListProps> = ({ bookId, book, onReviewSubmitted }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  // Check if this book is in favorites on mount
  useEffect(() => {
    const fetchFavorite = async () => {
      const access_token = localStorage.getItem('access_token') || '';
      const profileService = new ProfileService(access_token);
      try {
        const favorites = await profileService.getFavorites(100, 0);
        setIsFavorite(favorites.some(f => f.book_id === bookId));
      } catch {
        setIsFavorite(false);
      }
    };
    fetchFavorite();
  }, [bookId]);
  const handleToggleFavorite = async () => {
    setFavoriteLoading(true);
    const access_token = localStorage.getItem('access_token') || '';
    const profileService = new ProfileService(access_token);
    try {
      if (!isFavorite) {
        await profileService.addToFavorites(bookId);
        setIsFavorite(true);
      } else {
        await profileService.removeFromFavorites(bookId);
        setIsFavorite(false);
      }
    } catch {
      // Optionally show error
    } finally {
      setFavoriteLoading(false);
    }
  };

  // State to track if the user has already reviewed this book
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Split into two separate useEffects for better control
  // This effect loads reviews and checks for user review
  useEffect(() => {
    setLoading(true);
    getBookReviews(bookId, page)
      .then((data) => {
        setReviews(data.items);
        setTotalPages(data.total_pages || 1);
        
        // Check if the current user has already reviewed this book
        const currentUserEmail = localStorage.getItem('user_email');
        console.log("Current user email:", currentUserEmail);
        
        if (currentUserEmail) {
          const existingReview = data.items.find(review => review.user.email === currentUserEmail);
          console.log("Found existing review:", existingReview);
          
          if (existingReview) {
            setUserReview(existingReview);
            
            // If we're in edit mode, ensure the form is populated
            if (isEditing) {
              setReviewContent(existingReview.content);
              setReviewRating(existingReview.rating);
            }
          } else {
            setUserReview(null);
          }
        } else {
          console.log("No user email found in localStorage");
          setUserReview(null);
        }
      })
      .finally(() => setLoading(false));
  }, [bookId, page, isEditing]);
  
  // Separate effect to handle form population when edit mode changes
  useEffect(() => {
    if (isEditing && userReview) {
      // Ensure we populate with the latest user review data
      setReviewContent(userReview.content);
      setReviewRating(userReview.rating);
    }
  }, [isEditing, userReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewContent.length < 5 || reviewRating < 1 || reviewRating > 5) return;
    setSubmitting(true);
    setSuccessMsg('');
    
    try {
      if (userReview) {
        // Update existing review
        const { updateReview } = await import('./reviewService');
        await updateReview(userReview.id, { 
          content: reviewContent,
          rating: reviewRating 
        });
        setSuccessMsg('Review updated successfully!');
      } else {
        // Create new review
        const { createReview } = await import('./reviewService');
        await createReview({ 
          book_id: bookId, 
          content: reviewContent, 
          rating: reviewRating 
        });
        setSuccessMsg('Review submitted successfully!');
      }
      
      // Reset form after successful submission
      setReviewContent('');
      setReviewRating(0);
      setIsEditing(false);
      
      // Notify parent component about the change
      if (typeof onReviewSubmitted === 'function') {
        onReviewSubmitted();
      }
      
      // Refresh reviews to display the latest data
      getBookReviews(bookId, 1).then((data) => {
        setReviews(data.items);
        setTotalPages(data.total_pages || 1);
        setPage(1);
        
        // Update userReview state with the fresh data
        const currentUserEmail = localStorage.getItem('user_email');
        const freshUserReview = data.items.find(review => review.user.email === currentUserEmail);
        setUserReview(freshUserReview || null);
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Add debugging to ensure we have a book
  if (loading) return <CircularProgress />;
  
  // Make sure we have a book before rendering the review page
  if (!book) {
    return (
      <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">Book information could not be loaded.</Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>Please try refreshing the page.</Typography>
      </Paper>
    );
  }

  return (
    <>
      {book && (
        <Paper elevation={2} sx={{ mb: 3, p: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2, bgcolor: 'background.default' }}>
          <Box>
            <Typography variant="h5" sx={{ mb: 1 }}>{book.title}</Typography>
            <Typography variant="subtitle1" sx={{ mb: 0.5 }}>by {book.author}</Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>Published: {book.publication_date}</Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>Genres: {book.genres.join(', ')}</Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>Average Rating: {book.total_reviews === 0 || book.average_rating === 0 || book.average_rating == null ? 'Not rated yet' : `${book.average_rating} (${book.total_reviews} reviews)`}</Typography>
          </Box>
          <Tooltip title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
            <span>
              <IconButton onClick={handleToggleFavorite} color={isFavorite ? 'error' : 'default'} disabled={favoriteLoading} aria-label={isFavorite ? 'Unmark Favorite' : 'Mark Favorite'} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}>
                {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>
            </span>
          </Tooltip>
        </Paper>
      )}
      <Paper elevation={2} sx={{ mb: 3, p: 2 }}>
        <form onSubmit={handleSubmit}>
          {successMsg && <Typography color="success.main" sx={{ mb: 2 }}>{successMsg}</Typography>}
          
          {/* Change title based on whether user is updating or creating a new review */}
          <Typography variant="h6" sx={{ mb: 2 }}>
            {userReview ? 'Update Review' : 'Write a Review'}
          </Typography>
          
          {/* Show user's existing review information if they have already reviewed */}
          {userReview && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 1 }}>
                You already wrote a review for this book:
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Your rating:</strong> {userReview.rating}/5
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Your review:</strong> {userReview.content}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Posted on: {new Date(userReview.created_at).toLocaleDateString()}
                {userReview.updated_at && ` (Updated: ${new Date(userReview.updated_at).toLocaleDateString()})`}
              </Typography>
              {!isEditing && (
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => {
                    // Directly set the values here for immediate effect
                    if (userReview) {
                      setReviewContent(userReview.content);
                      setReviewRating(userReview.rating);
                    }
                    setIsEditing(true);
                  }}
                  sx={{ mt: 1 }}
                >
                  Edit this review
                </Button>
              )}
            </Box>
          )}
          
          {/* Only show review form if user is creating a new review or editing an existing one */}
          {(!userReview || isEditing) && (
            <>
              <Box sx={{ mb: 2 }}>
                <textarea
                  value={reviewContent}
                  onChange={e => setReviewContent(e.target.value)}
                  placeholder="Your review (min 5 chars)"
                  minLength={5}
                  style={{ width: '100%', minHeight: 80, padding: 12, borderRadius: 4, border: '1px solid #ccc', fontFamily: 'inherit', fontSize: '1rem' }}
                  required
                />
              </Box>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Typography component="label" sx={{ mr: 2 }}>Rating: </Typography>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={reviewRating}
                  onChange={e => setReviewRating(Number(e.target.value))}
                  required
                  style={{ width: 60, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  disabled={submitting || reviewContent.length < 5 || reviewRating < 1 || reviewRating > 5}
                >
                  {submitting ? 'Submitting...' : isEditing ? 'Update Review' : 'Submit Review'}
                </Button>
                
                {isEditing && (
                  <Button 
                    variant="outlined"
                    color="secondary"
                    onClick={() => {
                      // Reset form fields and exit edit mode
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </Box>
            </>
          )}
        </form>
      </Paper>
      <Paper elevation={2} sx={{ p: 2 }}>
        {reviews.length === 0 ? (
          <Typography color="text.secondary">No reviews yet.</Typography>
        ) : (
          <>
            <Typography variant="h6" sx={{ mb: 3 }}>Reviews</Typography>
            {reviews.map((review: Review) => (
              <Paper key={review.id} variant="outlined" sx={{ mb: 2, p: 2, borderRadius: 2 }}>
                <Typography variant="body1" sx={{ mb: 2 }}>{review.content}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label={`Rating: ${review.rating}`} color="primary" size="small" />
                  <Typography variant="caption" sx={{ ml: { xs: 0, sm: 2 }, mt: { xs: 1, sm: 0 }, width: { xs: '100%', sm: 'auto' } }}>
                    by <b>{review.user.email}</b> on {new Date(review.created_at).toLocaleString()}
                  </Typography>
                  <Box sx={{ ml: { xs: 0, sm: 'auto' }, mt: { xs: 1, sm: 0 }, display: 'flex', gap: 1 }}>
                    <Chip label={`Helpful: ${review.helpful_votes}`} size="small" />
                    <Chip label={`Unhelpful: ${review.unhelpful_votes}`} size="small" />
                  </Box>
                </Box>
              </Paper>
            ))}
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={(_, p: number) => setPage(p)} 
              sx={{ mt: 3, display: 'flex', justifyContent: 'center' }} 
            />
          </>
        )}
      </Paper>
  </>
  );
};

export default ReviewList;
