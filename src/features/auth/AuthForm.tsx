import React, { useState } from 'react';
import { TextField, Button, Typography, Box, Alert } from '@mui/material';
import { authService } from '../../services/authService';

const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

export default function AuthForm({ onAuth }: { onAuth: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePassword = (pwd: string) => passwordRegex.test(pwd);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!validatePassword(password)) {
        setError('Password must be 8+ chars, 1 number, 1 special char');
        setLoading(false);
        return;
      }
      if (isLogin) {
        await authService.login(email, password);
        // Store email in localStorage for review author identification
        localStorage.setItem('user_email', email);
        onAuth();
      } else {
        if (!name.trim()) {
          setError('Name is required');
          setLoading(false);
          return;
        }
        await authService.register(name, email, password);
        setError('Registration successful! Please login.');
        onAuth();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err?.response?.status === 400 && !isLogin && typeof err?.response?.data?.detail === 'string' && err.response.data.detail.toLowerCase().includes('email already exists')) {
        setError('Email address is already registered. Please use a different email or login.');
      } else if (err?.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (!isLogin) {
        setError('Registration failed. Please try again.');
      } else {
        setError('Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
      <Box maxWidth={400} width="100%" p={3} boxShadow={3} borderRadius={2} bgcolor="#fff">
        <Typography variant="h5" mb={2} align="center">{isLogin ? 'Login' : 'Register'}</Typography>
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <TextField
              label="Name"
              type="text"
              fullWidth
              margin="normal"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoComplete="name"
              inputProps={{ 'data-testid': 'register-name' }}
            />
          )}
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            helperText="Min 8 chars, 1 number, 1 special char"
            autoComplete={isLogin ? "current-password" : "new-password"}
          />
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {isLogin ? 'Login' : 'Register'}
          </Button>
        </form>
        <Button
          onClick={() => setIsLogin(l => !l)}
          sx={{ mt: 2 }}
          fullWidth
        >
          {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
        </Button>
      </Box>
    </Box>
  );
}
