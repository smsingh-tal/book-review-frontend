import React, { useState, useEffect } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Button, Typography, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { canRefreshRecommendations, getTimeUntilRefresh } from '../../services/recommendationService';
import { RecommendationType } from '../../types/recommendationTypes';

interface RecommendationFiltersProps {
  onGenreChange: (genre: string | undefined) => void;
  selectedGenre: string | undefined;
  onRefresh: () => void;
  recommendationType: RecommendationType;
  lastRefreshed: Date | null;
}

// Common genres for books
const genres = [
  "All",
  "Fiction",
  "Fantasy",
  "Science Fiction",
  "Mystery",
  "Thriller",
  "Romance",
  "Horror",
  "Historical Fiction",
  "Biography",
  "Self-Help",
  "Business"
];

const RecommendationFilters: React.FC<RecommendationFiltersProps> = ({
  onGenreChange,
  selectedGenre,
  onRefresh,
  recommendationType,
  lastRefreshed
}) => {
  const [canRefresh, setCanRefresh] = useState(true);
  const [cooldownTime, setCooldownTime] = useState(0);
  
  // Format the last refreshed time
  const formatLastRefreshed = (date: Date | null): string => {
    if (!date) return 'Never';
    
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };
  
    // Handle genre change
  const handleGenreChange = (
    event: React.ChangeEvent<HTMLInputElement> | 
    (Event & { target: { value: string; name: string; } })
  ) => {
    const selectedGenre = event.target.value;
    onGenreChange(selectedGenre);
  };
  
  // Refresh recommendations
  const handleRefresh = () => {
    if (canRefresh) {
      onRefresh();
    }
  };
  
  // Check if refresh is available and update countdown
  useEffect(() => {
    const checkRefreshStatus = () => {
      const canRefresh = canRefreshRecommendations(recommendationType, selectedGenre);
      setCanRefresh(canRefresh);
      
      if (!canRefresh) {
        const timeLeft = getTimeUntilRefresh(recommendationType, selectedGenre);
        setCooldownTime(Math.ceil(timeLeft / 1000));
      } else {
        setCooldownTime(0);
      }
    };
    
    checkRefreshStatus();
    
    // Update every second if in cooldown
    const interval = setInterval(() => {
      checkRefreshStatus();
    }, 1000);
    
    return () => clearInterval(interval);
  }, [recommendationType, selectedGenre]);
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
      <FormControl sx={{ minWidth: 150 }}>
        <InputLabel id="genre-select-label">Genre</InputLabel>
        <Select
          labelId="genre-select-label"
          id="genre-select"
          value={selectedGenre || "All"}
          label="Genre"
          onChange={handleGenreChange}
          size="small"
        >
          {genres.map((genre) => (
            <MenuItem key={genre} value={genre}>
              {genre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Last refreshed: {formatLastRefreshed(lastRefreshed)}
        </Typography>
        
        <Tooltip title={canRefresh ? "Refresh recommendations" : `Wait ${cooldownTime}s to refresh`}>
          <span>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={!canRefresh}
            >
              Refresh{cooldownTime > 0 ? ` (${cooldownTime}s)` : ''}
            </Button>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default RecommendationFilters;
