import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AppBar, Container, IconButton, Tab, Tabs, Toolbar, Tooltip, Typography } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import { AuthProvider, hasTopicManagementRole, useAuth } from './components/auth';
import { LanguageProvider, LanguageSwitcher } from './components/common';
import HomePage from './pages/HomePage';
import AuthorsPage from './pages/AuthorsPage';
import LoginPage from './pages/LoginPage';
import TopicsPage from './pages/TopicsPage';

function Shell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const canManageTopics = hasTopicManagementRole(user?.role);
  const isAdmin = location.pathname.startsWith('/admin') && canManageTopics;
  const adminTab = location.pathname.startsWith('/admin/authors') && user?.role === 'admin' ? '/admin/authors' : '/admin/topics';

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ mr: 4 }}>
            Yakamoz
          </Typography>
          {canManageTopics && (
            <Tabs
              value={isAdmin ? '/admin' : false}
              onChange={(_, value) => navigate(value)}
              textColor="inherit"
              indicatorColor="secondary"
            >
              <Tab value="/admin" label="Manage" />
            </Tabs>
          )}
          <LanguageSwitcher />
          <Tooltip title={user ? `${user.nickname} (${user.role}) — sign out` : 'Sign in'}>
            <IconButton
              color="inherit"
              aria-label={user ? 'Sign out' : 'Sign in'}
              onClick={() => {
                if (user) {
                  logout();
                  if (isAdmin) navigate('/');
                } else {
                  navigate('/login');
                }
              }}
            >
              {user ? <LogoutIcon /> : <LoginIcon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
        {isAdmin && canManageTopics && (
          <Toolbar variant="dense" sx={{ bgcolor: 'primary.dark', minHeight: 0 }}>
            <Tabs
              value={adminTab}
              onChange={(_, value) => navigate(value)}
              textColor="inherit"
              indicatorColor="secondary"
            >
              <Tab value="/admin/topics" label="Topics" />
              {user?.role === 'admin' && <Tab value="/admin/authors" label="Users" />}
            </Tabs>
          </Toolbar>
        )}
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/topic/:id" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<Navigate to={canManageTopics ? '/admin/topics' : '/'} replace />} />
          <Route path="/admin/topics" element={canManageTopics ? <TopicsPage /> : <Navigate to="/" replace />} />
          <Route path="/admin/authors" element={user?.role === 'admin' ? <AuthorsPage /> : <Navigate to={canManageTopics ? '/admin/topics' : '/'} replace />} />
        </Routes>
      </Container>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <Shell />
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
