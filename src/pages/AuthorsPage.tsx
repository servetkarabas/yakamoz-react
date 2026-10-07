import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import { authorsApi } from '../api/authors';
import type { Author } from '../api/types';
import { LanguageSelect, StatusChip, formatDate } from '../components/common';
import { useFeedback } from '../components/feedback';

interface AuthorForm {
  nickname: string;
  email: string;
  bio: string;
  preferred_language: string;
}

const emptyForm: AuthorForm = { nickname: '', email: '', bio: '', preferred_language: 'tr' };

export default function AuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Author | null>(null);
  const [deleting, setDeleting] = useState<Author | null>(null);
  const [form, setForm] = useState<AuthorForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { showError, showSuccess, snackbar } = useFeedback();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAuthors(await authorsApi.list(rowsPerPage, page * rowsPerPage));
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, showError]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (author: Author) => {
    setEditing(author);
    setForm({
      nickname: author.nickname,
      email: author.email,
      bio: author.bio,
      preferred_language: author.preferred_language,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        await authorsApi.update(editing.id, {
          bio: form.bio,
          preferred_language: form.preferred_language,
        });
        showSuccess('Author updated');
      } else {
        await authorsApi.create(form);
        showSuccess('Author created');
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await authorsApi.remove(deleting.id);
      showSuccess('Author deleted');
      setDeleting(null);
      load();
    } catch (e) {
      showError(e);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          Authors
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={load} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          New Author
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nickname</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Bio</TableCell>
              <TableCell>Language</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {authors.map((author) => (
              <TableRow key={author.id} hover>
                <TableCell>{author.nickname}</TableCell>
                <TableCell>{author.email}</TableCell>
                <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {author.bio}
                </TableCell>
                <TableCell>{author.preferred_language}</TableCell>
                <TableCell>
                  <StatusChip status={author.status} />
                </TableCell>
                <TableCell>{formatDate(author.created_at)}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => openEdit(author)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => setDeleting(author)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {!loading && authors.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No authors found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={-1}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50]}
          nextIconButtonProps={{ disabled: authors.length < rowsPerPage }}
          backIconButtonProps={{ disabled: page === 0 }}
          labelDisplayedRows={({ from, to }) => `${from}-${to}`}
        />
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? `Edit ${editing.nickname}` : 'New Author'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Nickname"
            value={form.nickname}
            onChange={(e) => setForm({ ...form, nickname: e.target.value })}
            required
            disabled={!!editing}
            helperText="Min 2 characters, no spaces"
          />
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            disabled={!!editing}
          />
          <TextField
            label="Bio"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            multiline
            minRows={2}
          />
          <LanguageSelect
            label="Preferred language"
            value={form.preferred_language}
            onChange={(v) => setForm({ ...form, preferred_language: v })}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={
              saving ||
              !form.preferred_language ||
              (!editing && (form.nickname.trim().length < 2 || !form.email.includes('@')))
            }
          >
            {editing ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleting !== null} onClose={() => setDeleting(null)}>
        <DialogTitle>Delete author</DialogTitle>
        <DialogContent>
          Delete author <strong>{deleting?.nickname}</strong>? This cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleting(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {snackbar}
    </Box>
  );
}
