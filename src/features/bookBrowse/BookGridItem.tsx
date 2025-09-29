import React from 'react';
import { Book } from '../../types/Book';
import IconButton from '@mui/material/IconButton';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';


interface BookGridItemProps {
  book: Book;
  isFavorite?: boolean;
  onToggleFavorite?: (bookId: number, next: boolean) => void;
}

const BookGridItem: React.FC<BookGridItemProps> = ({ book, isFavorite, onToggleFavorite }) => (
  <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
    <CardHeader
      title={book.title}
      subheader={book.author}
      sx={{ pb: 0 }}
      action={
        onToggleFavorite ? (
          <IconButton aria-label={isFavorite ? 'Unmark Favorite' : 'Mark Favorite'} onClick={e => { e.stopPropagation(); onToggleFavorite(book.id, !isFavorite); }}>
            {isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
          </IconButton>
        ) : null
      }
    />
    <CardContent>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {book.genres.map((genre, idx) => (
          <Chip key={idx} label={genre} size="small" sx={{ mr: 0.5 }} />
        ))}
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        <strong>Rating:</strong>{' '}
        {book.total_reviews === 0 || book.average_rating === 0 || book.average_rating == null
          ? 'Not rated yet'
          : `${book.average_rating} (${book.total_reviews} reviews)`}
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        <strong>Published:</strong> {book.publication_date}
      </Typography>
    </CardContent>
  </Card>
);

export default BookGridItem;
