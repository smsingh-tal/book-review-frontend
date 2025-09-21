// import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthForm from '../AuthForm';
import * as authService from '../../../services/authService';
import '@testing-library/jest-dom';

jest.mock('../../../services/authService');

const mockOnAuth = jest.fn();

describe('AuthForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows password validation error', async () => {
    render(<AuthForm onAuth={mockOnAuth} />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(await screen.findByText(/password must be 8\+ chars/i)).toBeInTheDocument();
    expect(mockOnAuth).not.toHaveBeenCalled();
  });

  it('calls login API and onAuth on success', async () => {
    (authService.authService.login as jest.Mock).mockResolvedValue({ access_token: 'token' });
    render(<AuthForm onAuth={mockOnAuth} />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password1!' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => expect(mockOnAuth).toHaveBeenCalled());
  });

  it('calls register API and onAuth on success', async () => {
    (authService.authService.register as jest.Mock).mockResolvedValue({ message: 'User created successfully' });
    render(<AuthForm onAuth={mockOnAuth} />);
    // Switch to register mode
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password1!' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    await waitFor(() => expect(mockOnAuth).toHaveBeenCalled());
  });

  it('shows API error message', async () => {
    (authService.authService.login as jest.Mock).mockRejectedValue({ response: { data: { detail: 'Invalid credentials' } } });
    render(<AuthForm onAuth={mockOnAuth} />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password1!' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
    expect(mockOnAuth).not.toHaveBeenCalled();
  });
});
