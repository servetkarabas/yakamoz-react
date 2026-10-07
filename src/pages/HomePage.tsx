import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddCommentIcon from '@mui/icons-material/AddComment';
import { topicsApi } from '../api/topics';
import { authorsApi } from '../api/authors';
import { commentsApi } from '../api/comments';
import type { Author, Comment, Topic } from '../api/types';
import { LanguageSelect, StatusChip, formatDate } from '../components/common';
import { useFeedback } from '../components/feedback';

const PAGE_SIZE = 50;

interface CommentForm {
  author_id: string;
  language: string;
  body: string;
}

const emptyComment: CommentForm = { author_id: '', language: 'tr', body: '' };

export default function HomePage() {
  const { id } = useParams<{ id: string }>();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [langFilter, setLangFilter] = useState('');
  const [selected, setSelected] = useState<Topic | null>(null);
  const [loadingTopic, setLoadingTopic] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentForm, setCommentForm] = useState<CommentForm | null>(null);
  const [saving, setSaving] = useState(false);
  const { showError, showSuccess, snackbar } = useFeedback();

  const authorNames = useMemo(() => {
    const map = new Map<string, string>();
    authors.forEach((a) => map.set(a.id, a.nickname));
    return map;
  }, [authors]);

  const loadTopics = useCallback(
    async (lang: string) => {
      setLoadingList(true);
      try {
        const first = await topicsApi.list(PAGE_SIZE, 0, lang || undefined);
        setTopics(first);
        setHasMore(first.length === PAGE_SIZE);
      } catch (e) {
        showError(e);
      } finally {
        setLoadingList(false);
      }
    },
    [showError],
  );

  const loadMore = async () => {
    setLoadingList(true);
    try {
      const next = await topicsApi.list(PAGE_SIZE, topics.length, langFilter || undefined);
      setTopics((prev) => [...prev, ...next]);
      setHasMore(next.length === PAGE_SIZE);
    } catch (e) {
      showError(e);
    } finally {
      setLoadingList(false);
    }
  };

  const loadComments = useCallback(
    async (topicId: string) => {
      try {
        setComments(await commentsApi.list(topicId, 100, 0));
      } catch (e) {
        showError(e);
      }
    },
    [showError],
  );

  useEffect(() => {
    loadTopics(langFilter);
  }, [langFilter, loadTopics]);

  useEffect(() => {
    authorsApi.list(100, 0).then(setAuthors).catch(() => setAuthors([]));
  }, []);

  useEffect(() => {
    if (!id) {
      setSelected(null);
      setComments([]);
      return;
    }
    setLoadingTopic(true);
    topicsApi
      .getById(id, langFilter || undefined)
      .then(setSelected)
      .catch((e) => {
        setSelected(null);
        showError(e);
      })
      .finally(() => setLoadingTopic(false));
    loadComments(id);
  }, [id, langFilter, showError, loadComments]);

  const saveComment = async () => {
    if (!selected || !commentForm) return;
    setSaving(true);
    try {
      await commentsApi.create({ topic_id: selected.id, ...commentForm });
      showSuccess('Comment added');
      setCommentForm(null);
      loadComments(selected.id);
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch' }}>
      <Paper sx={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 140px)' }}>
        <Box sx={{ p: 1.5 }}>
          <LanguageSelect value={langFilter} onChange={setLangFilter} allowEmpty />
        </Box>
        <Divider />
        <List dense sx={{ overflow: 'auto', flexGrow: 1 }}>
          {topics.map((topic) => (
            <ListItemButton
              key={topic.id}
              component={RouterLink}
              to={`/topic/${topic.id}`}
              selected={topic.id === id}
            >
              <ListItemText
                primary={topic.title}
                primaryTypographyProps={{ noWrap: true }}
                secondary={topic.slug}
                secondaryTypographyProps={{ noWrap: true }}
              />
            </ListItemButton>
          ))}
          {!loadingList && topics.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              No topics found
            </Typography>
          )}
        </List>
        {hasMore && (
          <>
            <Divider />
            <Button onClick={loadMore} disabled={loadingList} size="small">
              {loadingList ? 'Loading…' : 'Load more'}
            </Button>
          </>
        )}
      </Paper>

      <Paper sx={{ flexGrow: 1, p: 3, minWidth: 0 }}>
        {loadingTopic ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : selected ? (
          <>
            <Typography variant="h4" component="h1" gutterBottom>
              {selected.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
              <StatusChip status={selected.status} />
              <Chip label={selected.served_language} size="small" variant="outlined" />
              {selected.served_language !== selected.original_language && (
                <Chip label={`original: ${selected.original_language}`} size="small" variant="outlined" />
              )}
              <Typography variant="caption" color="text.secondary">
                {selected.slug} · by {authorNames.get(selected.created_by) ?? selected.created_by.slice(0, 8)} ·{' '}
                {formatDate(selected.created_at)}
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {selected.description}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', mt: 4, mb: 1 }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Comments ({comments.length})
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddCommentIcon />}
                onClick={() => setCommentForm({ ...emptyComment, language: selected.served_language })}
              >
                Add comment
              </Button>
            </Box>
            <Divider />
            <Stack divider={<Divider />} spacing={0}>
              {comments.map((comment) => (
                <Box key={comment.id} sx={{ py: 1.5 }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {comment.body}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {authorNames.get(comment.author_id) ?? comment.author_id.slice(0, 8)} · {comment.language} ·{' '}
                    {formatDate(comment.created_at)}
                  </Typography>
                </Box>
              ))}
              {comments.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No comments yet
                </Typography>
              )}
            </Stack>
          </>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <Typography color="text.secondary">Select a topic</Typography>
          </Box>
        )}
      </Paper>

      <Dialog open={commentForm !== null} onClose={() => setCommentForm(null)} fullWidth maxWidth="sm">
        <DialogTitle>Add comment — {selected?.title}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            select
            label="Author"
            value={commentForm?.author_id ?? ''}
            onChange={(e) => commentForm && setCommentForm({ ...commentForm, author_id: e.target.value })}
            required
            helperText={authors.length === 0 ? 'No authors available — create one in Admin first' : undefined}
          >
            {authors.map((a) => (
              <MenuItem key={a.id} value={a.id}>
                {a.nickname}
              </MenuItem>
            ))}
          </TextField>
          <LanguageSelect
            value={commentForm?.language ?? 'tr'}
            onChange={(v) => commentForm && setCommentForm({ ...commentForm, language: v })}
            required
          />
          <TextField
            label="Comment"
            value={commentForm?.body ?? ''}
            onChange={(e) => commentForm && setCommentForm({ ...commentForm, body: e.target.value })}
            multiline
            minRows={3}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentForm(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={saveComment}
            disabled={saving || !commentForm?.author_id || !commentForm?.body.trim()}
          >
            Post
          </Button>
        </DialogActions>
      </Dialog>

      {snackbar}
    </Box>
  );
}
