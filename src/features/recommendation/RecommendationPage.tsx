import React, { useState, useEffect } from 'react';
import { Box, Container, Tab, Tabs, Typography, Paper, Alert, CircularProgress } from '@mui/material';
import RecommendationList from './RecommendationList';
import RecommendationFilters from './RecommendationFilters';
import { getRecommendations, canRefreshRecommendations, getLastRefreshTime } from '../../services/recommendationService';
import { BookRecommendation, RecommendationResponse, RecommendationType } from '../../types/recommendationTypes';

// TabPanel component for the tabbed interface
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`recommendation-tabpanel-${index}`}
      aria-labelledby={`recommendation-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3, px: 0 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `recommendation-tab-${index}`,
    'aria-controls': `recommendation-tabpanel-${index}`,
  };
}

const RecommendationPage: React.FC = () => {
  // State management
  const [tabValue, setTabValue] = useState(0);
  
  // Store recommendations separately for each type
  const [recommendationsMap, setRecommendationsMap] = useState<{
    [key in RecommendationType]: BookRecommendation[]
  }>({
    'top_rated': [],
    'similar': [],
    'ai': []
  });
  
  // Track loading state for each tab separately
  const [loadingMap, setLoadingMap] = useState<{
    [key in RecommendationType]: boolean
  }>({
    'top_rated': false,
    'similar': false,
    'ai': false
  });
  
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>(undefined);
  const [recommendationType, setRecommendationType] = useState<RecommendationType>('top_rated');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Tab change handler
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    const types: RecommendationType[] = ['top_rated', 'similar', 'ai'];
    const newType = types[newValue];
    console.log(`Tab changed to ${newType} - ALWAYS loading fresh data`);
    
    // Update tab and recommendation type
    setTabValue(newValue);
    setRecommendationType(newType);
    
    // Reset error state when changing tabs
    setError(null);
    
    // ALWAYS fetch fresh data when changing tabs to guarantee unique results
    console.log(`Forcing data load for ${newType} tab`);
    loadRecommendationsForType(newType);
  };

  // Genre filter change handler
  const handleGenreChange = (genre: string | undefined) => {
    setSelectedGenre(genre);
    
    // When genre changes, reload data for the current tab
    loadRecommendationsForType(recommendationType);
  };

  // Load recommendations for a specific type
  const loadRecommendationsForType = async (type: RecommendationType) => {
    // Set loading state for this specific tab
    console.log(`Setting loading state for ${type} to true`);
    setLoadingMap(prev => {
      const newState = { ...prev, [type]: true };
      console.log('New loading state:', newState);
      return newState;
    });
    setError(null);
    
    console.log(`Loading recommendations for type: ${type}, genre: ${selectedGenre || 'All'}`);
    
    try {
      // Always force a fresh request for each recommendation type
      // The unique combination of timestamp and type ensures different data sets
      const response: RecommendationResponse = await getRecommendations({
        recommendation_type: type,
        limit: 10,
        genre: selectedGenre,
        _timestamp: Date.now() + Math.random() // Guaranteed unique timestamp for each call
      });
      
      console.log(`Received ${type} recommendations:`, response);
      
      // Handle empty recommendations gracefully
      if (!response.recommendations || response.recommendations.length === 0) {
        console.log(`Empty recommendations for ${type}, using demo books`);
        
        // Update with an empty array to trigger the fallback to demo books in RecommendationList
        setRecommendationsMap(prevMap => ({
          ...prevMap,
          [type]: [] // Empty array will trigger the demo books in RecommendationList
        }));
        
        // Update fallback info
        if (type === recommendationType) {
          setIsFallback(true);
          setFallbackReason("No recommendations available. Showing popular books instead.");
        }
        
        return;
      }
      
      // Defensive approach - validate each book object
      const isValidBook = (book: unknown): book is BookRecommendation => {
        return !!book && 
              typeof book === 'object' && 
              'book_id' in book && 
              'title' in book;
      };
      
      // Always set as an array, even if empty
      const validRecommendations = Array.isArray(response.recommendations)
        ? response.recommendations.filter(isValidBook)
        : [];
      
      console.log(`Valid ${type} recommendations count:`, validRecommendations.length);
      
      // Update the recommendations for the specified type only
      setRecommendationsMap(prevMap => ({
        ...prevMap,
        [type]: validRecommendations
      }));
      
      // Update fallback and last refreshed information
      if (type === recommendationType) {
        setIsFallback(response.is_fallback);
        setFallbackReason(response.fallback_reason || null);
      }
      
      setLastRefreshed(getLastRefreshTime(type, selectedGenre));
    } catch (err) {
      console.error(`Error fetching ${type} recommendations:`, err);
      if (type === recommendationType) {
        setError('Failed to fetch recommendations. Please try again later.');
      }
      // Don't clear recommendations on error - RecommendationList will use fallback demo books
    } finally {
      // Clear loading state for this specific tab - add delay to ensure loading indicator is visible
      setTimeout(() => {
        console.log(`Setting loading state for ${type} to false`);
        setLoadingMap(prev => {
          const newState = { ...prev, [type]: false };
          console.log('Updated loading state:', newState);
          return newState;
        });
      }, 500); // Small delay to ensure loading indicator is visible
    }
  };

  // Refresh handler
  const handleRefresh = () => {
    if (canRefreshRecommendations(recommendationType, selectedGenre)) {
      loadRecommendationsForType(recommendationType);
    }
  };

  // Effect to load recommendations for the first tab on initial render
  useEffect(() => {
    loadRecommendationsForType('top_rated');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Book Recommendations
      </Typography>
      
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="recommendation tabs">
            <Tab label="Top Rated" {...a11yProps(0)} />
            <Tab label="Similar Books" {...a11yProps(1)} />
            <Tab label="AI Suggestions" {...a11yProps(2)} />
          </Tabs>
        </Box>

        {/* Filters */}
        <Box sx={{ p: 2 }}>
          <RecommendationFilters 
            onGenreChange={handleGenreChange} 
            selectedGenre={selectedGenre} 
            onRefresh={handleRefresh}
            recommendationType={recommendationType}
            lastRefreshed={lastRefreshed}
          />
        </Box>

        {/* Tab Panels */}
        {['top_rated', 'similar', 'ai'].map((type, index) => {
          const typedType = type as RecommendationType;
          const isCurrentTab = typedType === recommendationType;
          const isLoading = loadingMap[typedType];
          
          console.log(`Rendering ${typedType} tab, isLoading: ${isLoading}, current books: ${recommendationsMap[typedType]?.length || 0}`);
          
          return (
            <TabPanel key={type} value={tabValue} index={index}>
              <Box sx={{ px: 0 }}> {/* Remove horizontal padding here */}
                {error && isCurrentTab && (
                  <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                )}
                {isFallback && isCurrentTab && !isLoading && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {fallbackReason || 'Showing alternative recommendations.'}
                  </Alert>
                )}
                {/* Show loading indicator when loading data */}
                {isLoading === true ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 4, border: '1px solid #eee', p: 4, borderRadius: 2 }}>
                    <CircularProgress size={60} color="primary" />
                    <Typography variant="h6" sx={{ ml: 2, alignSelf: 'center' }}>
                      Loading {typedType.replace('_', ' ')} recommendations...
                    </Typography>
                  </Box>
                ) : (
                  /* Show recommendations when loaded */
                  <RecommendationList 
                    recommendations={recommendationsMap[typedType]}
                    loading={false}
                  />
                )}
              </Box>
            </TabPanel>
          );
        })}
      </Paper>
    </Container>
  );
};

export default RecommendationPage;
