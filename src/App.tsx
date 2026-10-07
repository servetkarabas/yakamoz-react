import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AppBar, Container, Tab, Tabs, Toolbar, Typography } from '@mui/material';
import HomePage from './pages/HomePage';
import AuthorsPage from './pages/AuthorsPage';
import TopicsPage from './pages/TopicsPage';

function Shell() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname.startsWith('/admin');
  const adminTab = location.pathname.startsWith('/admin/authors') ? '/admin/authors' : '/admin/topics';

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ mr: 4 }}>
            Yakamoz
          </Typography>
          <Tabs
            value={isAdmin ? '/admin' : '/'}
            onChange={(_, value) => navigate(value)}
            textColor="inherit"
            indicatorColor="secondary"
          >
            <Tab value="/" label="Topics" />
            <Tab value="/admin" label="Admin" />
          </Tabs>
        </Toolbar>
        {isAdmin && (
          <Toolbar variant="dense" sx={{ bgcolor: 'primary.dark', minHeight: 0 }}>
            <Tabs
              value={adminTab}
              onChange={(_, value) => navigate(value)}
              textColor="inherit"
              indicatorColor="secondary"
            >
              <Tab value="/admin/topics" label="Topics" />
              <Tab value="/admin/authors" label="Authors" />
            </Tabs>
          </Toolbar>
        )}
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/topic/:id" element={<HomePage />} />
          <Route path="/admin" element={<Navigate to="/admin/topics" replace />} />
          <Route path="/admin/topics" element={<TopicsPage />} />
          <Route path="/admin/authors" element={<AuthorsPage />} />
        </Routes>
      </Container>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
