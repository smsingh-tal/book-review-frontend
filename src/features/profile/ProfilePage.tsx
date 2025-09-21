
import React, { useEffect, useState } from 'react';
import { Box, Typography, Avatar, Tabs, Tab, Paper, CircularProgress, Alert, List, ListItem, ListItemText, Rating, Button } from '@mui/material';
import { Book } from '../../types/Book';
import { useState as useReactState } from 'react';
import { fetchBooks } from '../../services/bookService';
import { ProfileService, Profile } from '../../services/profileService';


const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [favoriteBooks, setFavoriteBooks] = useReactState<Book[]>([]);
  const [favoriteLoading, setFavoriteLoading] = useReactState(false);
  const [reviewedBooks, setReviewedBooks] = useReactState<Book[]>([]);
  const [reviewedLoading, setReviewedLoading] = useReactState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<{ name: string }>({ name: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // TODO: Replace with real token from auth context
  const access_token = localStorage.getItem('access_token') || '';
  const profileService = new ProfileService(access_token);

  useEffect(() => {
    setLoading(true);
    profileService.getProfile()
      .then(async (data) => {
        setProfile(data);
        setForm({
          name: data.name,
        });
        // Fetch favorite book details
        if (data.favorites.length > 0) {
          setFavoriteLoading(true);
          try {
            const ids = data.favorites.map(f => f.book_id);
            const allBooks = await fetchBooks({ limit: 100 });
            setFavoriteBooks(allBooks.filter(b => ids.includes(b.id)));
          } catch {
            setFavoriteBooks([]);
          } finally {
            setFavoriteLoading(false);
          }
        } else {
          setFavoriteBooks([]);
        }
        // Fetch reviewed book details
        if (data.reviews.length > 0) {
          setReviewedLoading(true);
          try {
            const ids = data.reviews.map(r => r.book_id);
            const allBooks = await fetchBooks({ limit: 100 });
            setReviewedBooks(allBooks.filter(b => ids.includes(b.id)));
          } catch {
            setReviewedBooks([]);
          } finally {
            setReviewedLoading(false);
          }
        } else {
          setReviewedBooks([]);
        }
      })
      .catch((err) => {
        setError(err?.response?.data?.detail || 'Failed to load profile');
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>;
  }
  if (error) {
    return <Box maxWidth={600} mx="auto" mt={8}><Alert severity="error">{error}</Alert></Box>;
  }
  if (!profile) {
    return null;
  }

  const handleEdit = () => {
    setEditMode(true);
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleCancel = () => {
    setEditMode(false);
    setForm({
      name: profile?.name || '',
    });
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      if (!form.name || form.name.trim() === '') {
        setSaveError('Please enter your name.');
        setSaving(false);
        return;
      }
      const updated = await profileService.updateProfile({
        name: form.name,
      });
      setProfile(updated);
      setEditMode(false);
      setSaveSuccess(true);
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'detail' in err.response.data &&
        typeof (err.response.data as { detail?: string }).detail === 'string'
      ) {
        setSaveError((err.response.data as { detail: string }).detail || 'Failed to update profile');
      } else {
        setSaveError('Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, mb: 3 }}>
        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} mb={3}>
          <Avatar src={profile.profile_image_url} sx={{ width: 80, height: 80, mr: { xs: 0, sm: 3 }, mb: { xs: 2, sm: 0 } }} />
          <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} width="100%">
            {editMode ? (
              <form onSubmit={e => { e.preventDefault(); handleSave(); }} style={{ width: '100%' }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Name</Typography>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    aria-label="Name"
                    data-testid="profile-name-input"
                    style={{ fontSize: 16, padding: 8, width: '100%', maxWidth: 350, borderRadius: 4, border: '1px solid #ccc' }}
                    disabled={saving}
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5, color: 'text.secondary' }}>Email</Typography>
                  <Typography variant="body1">{profile.email}</Typography>
                  <Typography variant="caption" color="text.secondary">Email cannot be changed</Typography>
                </Box>
                <Box mt={1}>
                  <Button 
                    type="submit" 
                    disabled={saving} 
                    variant="contained" 
                    sx={{ mr: 2 }}
                  >
                    Save
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleCancel} 
                    disabled={saving}
                    variant="outlined"
                  >
                    Cancel
                  </Button>
                </Box>
              </form>
            ) : (
              <>
                <Box flexGrow={1}>
                  <Typography variant="h5">{profile.name}</Typography>
                  <Typography color="text.secondary">{profile.email}</Typography>
                </Box>
                <Box ml={{ xs: 0, sm: 2 }} mt={{ xs: 2, sm: 0 }}>
                  <Button 
                    onClick={handleEdit} 
                    variant="outlined"
                  >
                    Edit Profile
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </Box>
        {saveError && <Alert severity="error" sx={{ mb: 2 }}>{saveError}</Alert>}
        {saveSuccess && <Alert severity="success" sx={{ mb: 2 }}>Profile updated successfully.</Alert>}
        <Tabs 
          value={tab} 
          onChange={(_, v) => setTab(v)} 
          aria-label="Profile Tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Favorites" />
          <Tab label="Review History" />
        </Tabs>
        <Box mt={3}>
          {tab === 0 ? (
            favoriteLoading ? (
              <CircularProgress size={24} />
            ) : profile.favorites.length === 0 ? (
              <Typography color="text.secondary">No favorite books yet.</Typography>
            ) : (
              <List>
                {favoriteBooks.map(book => (
                  <ListItem key={book.id}>
                    <ListItemText
                      primary={book.title}
                      secondary={book.author}
                    />
                  </ListItem>
                ))}
              </List>
            )
          ) : (
            reviewedLoading ? (
              <CircularProgress size={24} />
            ) : profile.reviews.length === 0 ? (
              <Typography color="text.secondary">No reviews yet.</Typography>
            ) : (
              <List>
                {profile.reviews.map((review) => {
                  const book = reviewedBooks.find(b => b.id === review.book_id);
                  return (
                    <ListItem key={review.id} alignItems="flex-start" sx={{ flexDirection: 'column', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{book ? book.title : 'Book #' + review.book_id}</Typography>
                      <Box display="flex" alignItems="center" mb={0.5}>
                        <Rating value={review.rating} readOnly size="small" max={5} />
                        <Typography variant="body2" sx={{ ml: 1 }}>Rated {review.rating}/5</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{review.content}</Typography>
                      <Typography variant="caption" color="text.secondary">Reviewed on {new Date(review.created_at).toLocaleDateString()}</Typography>
                    </ListItem>
                  );
                })}
              </List>
            )
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default ProfilePage;
