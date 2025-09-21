import React, { useState, useRef } from 'react';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';

interface Props {
  onSearch: (search: string) => void;
}

const BookSearch: React.FC<Props> = ({ onSearch }) => {
  const [value, setValue] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onSearch(e.target.value);
    }, 500);
  };

  const handleSearchClick = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    onSearch(value);
  };

  return (
    <TextField
      label="Search by title, author, genre"
      value={value}
      onChange={handleChange}
      fullWidth
      margin="normal"
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton onClick={handleSearchClick} aria-label="search">
              <SearchIcon />
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
};

export default BookSearch;
