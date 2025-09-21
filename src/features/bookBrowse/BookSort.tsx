import React from 'react';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

interface Props {
  onSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

const BookSort: React.FC<Props> = ({ onSort }) => {
  const [sortBy, setSortBy] = React.useState('title');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');

  const handleSortByChange = (e: SelectChangeEvent) => {
    const value = e.target.value as string;
    setSortBy(value);
    onSort(value, sortOrder);
  };
  const handleSortOrderChange = (e: SelectChangeEvent) => {
    const value = e.target.value as 'asc' | 'desc';
    setSortOrder(value);
    onSort(sortBy, value);
  };

  return (
    <div>
      <Select value={sortBy} onChange={handleSortByChange}>
        <MenuItem value="title">Title</MenuItem>
        <MenuItem value="author">Author</MenuItem>
        <MenuItem value="average_rating">Rating</MenuItem>
      </Select>
      <Select value={sortOrder} onChange={handleSortOrderChange}>
        <MenuItem value="asc">Asc</MenuItem>
        <MenuItem value="desc">Desc</MenuItem>
      </Select>
    </div>
  );
};

export default BookSort;
