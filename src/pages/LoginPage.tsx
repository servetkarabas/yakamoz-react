import { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, MenuItem, Paper, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authorsApi } from '../api/authors';
import type { Author } from '../api/types';
import { useAuth } from '../components/auth';

export default function LoginPage() {
  const [users, setUsers] = useState<Author[]>([]);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    authorsApi
      .list(100, 0)
      .then((values) => setUsers(values.filter((user) => user.status === 'active')))
      .catch(() => setError('Unable to load users. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const signIn = () => {
    const user = users.find((value) => value.id === userId);
    if (!user) return;
    login({ id: user.id, nickname: user.nickname, role: user.role });
    navigate('/', { replace: true });
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
      <Paper sx={{ width: '100%', maxWidth: 440, p: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Sign in
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Select an active user. This demo does not require a password.
        </Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TextField
              select
              fullWidth
              label="User"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              helperText={error || 'Your role controls which management pages are available.'}
              error={Boolean(error)}
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.nickname} — {user.role}
                </MenuItem>
              ))}
            </TextField>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
              <Button onClick={() => navigate('/')}>Cancel</Button>
              <Button variant="contained" onClick={signIn} disabled={!userId || Boolean(error)}>
                Continue
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
