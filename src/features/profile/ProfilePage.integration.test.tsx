import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { ProfileService, Profile } from '../../services/profileService';
import ProfilePage from './ProfilePage';

jest.mock('../../services/profileService');

const mockProfile: Profile = {
  id: 1,
  email: 'user@example.com',
  name: 'John Doe',
  profile_image_url: 'http://localhost:8000/storage/profiles/image.jpg',
  created_at: '2025-09-01T10:00:00Z',
  last_login: '2025-09-01T15:00:00Z',
  reviews: [
    {
      id: 1,
      book_id: 123,
      content: 'Great book!',
      rating: 5,
      created_at: '2025-09-01T10:00:00Z',
      updated_at: undefined,
    },
  ],
  favorites: [
    {
      id: 1,
      book_id: 456,
      created_at: '2025-09-01T10:00:00Z',
    },
  ],
};

describe('ProfilePage Integration', () => {
  beforeEach(() => {
    (ProfileService as jest.Mock).mockImplementation(() => ({
      getProfile: jest.fn().mockResolvedValue(mockProfile),
      updateProfile: jest.fn().mockResolvedValue({ ...mockProfile, email: 'new@email.com' }),
    }));
    localStorage.setItem('access_token', 'test-token');
  });

  it('renders profile details and allows editing', async () => {
    render(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('Edit'));
    const emailInput = await screen.findByTestId('profile-email-input');
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'new@email.com');
    await userEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully.')).toBeInTheDocument();
      expect(screen.getByText('new@email.com')).toBeInTheDocument();
    });
  });
});
