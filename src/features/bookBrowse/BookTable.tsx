import React from 'react';
import { Book } from '../../types/Book';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TableSortLabel from '@mui/material/TableSortLabel';
import IconButton from '@mui/material/IconButton';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

interface Props {
  books: Book[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onRowClick?: (bookId: number) => void;
  favoriteIds: number[];
  onToggleFavorite?: (bookId: number, next: boolean) => void;
}

const columns = [
  { id: 'title', label: 'Title' },
  { id: 'author', label: 'Author' },
  { id: 'average_rating', label: 'Rating' },
  { id: 'total_reviews', label: 'Reviews' },
  { id: 'publication_date', label: 'Published' },
  { id: 'favorite', label: 'Favorite' },
];

const BookTable: React.FC<Props> = ({ books, sortBy, sortOrder, onSort, onRowClick, favoriteIds, onToggleFavorite }) => {
  const handleSort = (column: string) => {
    const isAsc = sortBy === column && sortOrder === 'asc';
    onSort(column, isAsc ? 'desc' : 'asc');
  };

  const handleFavoriteClick = (e: React.MouseEvent, bookId: number, isFavorite: boolean) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(bookId, !isFavorite);
    }
  };

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map(col => (
              <TableCell key={col.id}>
                <TableSortLabel
                  active={sortBy === col.id}
                  direction={sortBy === col.id ? sortOrder : 'asc'}
                  onClick={() => handleSort(col.id)}
                >
                  {col.label}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {books.map(book => {
            const isFavorite = favoriteIds.includes(book.id);
            return (
              <TableRow key={book.id} hover style={{ cursor: onRowClick ? 'pointer' : 'default' }} onClick={() => onRowClick?.(book.id)}>
                <TableCell>{book.title}</TableCell>
                <TableCell>{book.author}</TableCell>
                <TableCell>
                  {book.total_reviews === 0 || book.average_rating === 0 || book.average_rating == null
                    ? 'Not rated yet'
                    : `${book.average_rating}`}
                </TableCell>
                <TableCell>
                  {book.total_reviews === 0 ? 'Not rated yet' : book.total_reviews}
                </TableCell>
                <TableCell>{book.publication_date}</TableCell>
                <TableCell>
                  <IconButton 
                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    onClick={(e) => handleFavoriteClick(e, book.id, isFavorite)}
                    size="small"
                  >
                    {isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default BookTable;
