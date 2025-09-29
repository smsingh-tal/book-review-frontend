import AuthForm from './features/auth/AuthForm';
import { useState, lazy, Suspense } from 'react';
import { authService } from './services/authService';
import BookList from './features/bookBrowse/BookList';
import { Box, Container, AppBar, Toolbar, Typography, Button } from '@mui/material';
import RecommendationPage from './features/recommendation/RecommendationPage';

const ProfilePage = lazy(() => import('./features/profile/ProfilePage'));

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('books'); // 'books', 'recommendations', or 'profile'

  const handleLogout = async () => {
    await authService.logout();
    localStorage.removeItem('user_email');
    setIsAuthenticated(false);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      background: '#f5f5f5'
    }}>
      {isAuthenticated && (
        <AppBar position="static" sx={{ background: '#232f3e' }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 8 }}>
                  <rect width="32" height="32" rx="8" fill="#ffd700" />
                  <text x="16" y="21" textAnchor="middle" fontSize="16" fill="#232f3e" fontFamily="Arial">B</text>
                </svg>
                Book Review
              </Box>
            </Typography>
            <Button 
              color="inherit" 
              sx={{ 
                mx: 1,
                bgcolor: currentPage === 'books' ? 'primary.main' : 'transparent',
                '&:hover': {
                  bgcolor: currentPage === 'books' ? 'primary.dark' : 'rgba(255,255,255,0.08)'
                }
              }}
              onClick={() => setCurrentPage('books')}
            >
              Browse Books
            </Button>
            <Button 
              color="inherit" 
              sx={{ 
                mx: 1,
                bgcolor: currentPage === 'recommendations' ? 'primary.main' : 'transparent',
                '&:hover': {
                  bgcolor: currentPage === 'recommendations' ? 'primary.dark' : 'rgba(255,255,255,0.08)'
                }
              }}
              onClick={() => setCurrentPage('recommendations')}
            >
              Recommendations
            </Button>
            <Button 
              color="inherit" 
              sx={{ 
                mx: 1,
                bgcolor: currentPage === 'profile' ? 'primary.main' : 'transparent',
                '&:hover': {
                  bgcolor: currentPage === 'profile' ? 'primary.dark' : 'rgba(255,255,255,0.08)'
                }
              }}
              onClick={() => setCurrentPage('profile')}
            >
              Profile
            </Button>
            <Button
              color="error"
              variant="contained"
              onClick={handleLogout}
              sx={{ ml: 2 }}
            >
              Logout
            </Button>
          </Toolbar>
        </AppBar>
      )}
      <Container 
        sx={{ 
          mt: isAuthenticated ? 4 : 0, 
          mb: 4, 
          px: { xs: 2, sm: 3 },
          width: '60%', 
          maxWidth: '60%', 
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {!isAuthenticated ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%' }}>
            <AuthForm onAuth={() => setIsAuthenticated(true)} />
          </Box>
        ) : (
          currentPage === 'books' ? (
            <Box sx={{ width: '100%' }}>
              <BookList />
            </Box>
          ) : currentPage === 'recommendations' ? (
            <Box sx={{ width: '100%' }}>
              <RecommendationPage />
            </Box>
          ) : (
            <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>Loading profile...</Box>}>
              <Box sx={{ width: '100%' }}>
                <ProfilePage />
              </Box>
            </Suspense>
          )
        )}
      </Container>
    </Box>
  );
}

export default App;
