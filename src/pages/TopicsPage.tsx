import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
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
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PublishIcon from '@mui/icons-material/Publish';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import TranslateIcon from '@mui/icons-material/Translate';
import { authorsApi } from '../api/authors';
import { topicsApi } from '../api/topics';
import type { Author, Topic, TopicStatus } from '../api/types';
import { LANGUAGES, LanguageSelect, StatusChip, formatDate, useLanguage } from '../components/common';
import { RichTextEditor, htmlToText } from '../components/RichText';
import { useAuth } from '../components/auth';
import { useFeedback } from '../components/feedback';

interface TopicForm {
  title: string;
  description: string;
  language: string;
  title_en: string;
  description_en: string;
}

const emptyForm: TopicForm = { title: '', description: '', language: 'tr', title_en: '', description_en: '' };

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const { language: langFilter } = useLanguage();
  const [statusFilter, setStatusFilter] = useState<TopicStatus | ''>('');
  const [authorFilter, setAuthorFilter] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<TopicForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const closeOnEscape = (close: () => void) => (_: unknown, reason: string) => {
    if (reason !== 'backdropClick') close();
  };
  const [previewingTranslation, setPreviewingTranslation] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; topic: Topic } | null>(null);
  const [translation, setTranslation] = useState<{ topic: Topic; lang: string; title: string; description: string } | null>(null);
  const [translate, setTranslate] = useState<{ topic: Topic; targets: string[]; force: boolean } | null>(null);
  const { user } = useAuth();
  const { showError, showSuccess, snackbar } = useFeedback();

  const authorNames = useMemo(() => {
    const map = new Map<string, string>();
    authors.forEach((a) => map.set(a.id, a.nickname));
    return map;
  }, [authors]);

  const isReviewer = user?.role === 'reviewer';
  const effectiveAuthor = authorFilter ?? (isReviewer ? '' : user?.id ?? '');
  const effectiveStatus: TopicStatus | '' = isReviewer ? 'review' : statusFilter;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTopics(await topicsApi.list(rowsPerPage, page * rowsPerPage, langFilter || undefined, effectiveStatus || undefined, 'newest', undefined, effectiveAuthor || undefined));
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, langFilter, effectiveStatus, effectiveAuthor, showError]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(0);
  }, [langFilter]);

  useEffect(() => {
    authorsApi
      .list(100, 0)
      .then(setAuthors)
      .catch(() => setAuthors([]));
  }, []);

  const needsEnglish = form.language !== 'en';

  const translateForm = async () => {
    if (!form.title.trim()) {
      showError(new Error('Enter a title before translating'));
      return;
    }
    setPreviewingTranslation(true);
    try {
      const result = await topicsApi.translateText({
        title: form.title,
        description: form.description,
        source_language: form.language,
        target_language: 'en',
      });
      setForm((f) => ({ ...f, title_en: result.title, description_en: result.description }));
      showSuccess('English translation generated. Review it before saving.');
    } catch (e) {
      showError(e);
    } finally {
      setPreviewingTranslation(false);
    }
  };

  const create = async () => {
    if (!user) return;
    if (!form.title.trim()) {
      showError(new Error('Title is required'));
      return;
    }
    if (needsEnglish && !form.title_en.trim()) {
      showError(new Error('Complete translation before saving'));
      return;
    }
    setSaving(true);
    try {
      await topicsApi.create({ ...form, author_id: user.id });
      showSuccess('Topic created');
      setDialogOpen(false);
      load();
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  };

  const submitForReview = async (topic: Topic) => {
    try {
      await topicsApi.submitForReview(topic.id);
      showSuccess(`"${topic.title}" submitted for review`);
      load();
    } catch (e) {
      showError(e);
    }
  };

  const publish = async (topic: Topic) => {
    try {
      await topicsApi.publish(topic.id);
      showSuccess(`"${topic.title}" published`);
      load();
    } catch (e) {
      showError(e);
    }
  };

  const saveTranslation = async () => {
    if (!translation) return;
    setSaving(true);
    try {
      await topicsApi.addTranslation(translation.topic.id, translation.lang, {
        title: translation.title,
        description: translation.description,
      });
      showSuccess(`Translation (${translation.lang}) saved`);
      setTranslation(null);
      load();
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  };

  const previewEnglishTranslation = async () => {
    if (!translation) return;
    setPreviewingTranslation(true);
    try {
      const preview = await topicsApi.previewTranslation(translation.topic.id, translation.lang);
      setTranslation({ ...translation, title: preview.title, description: preview.description });
      showSuccess('English translation generated. Review it before saving.');
    } catch (e) {
      showError(e);
    } finally {
      setPreviewingTranslation(false);
    }
  };

  const runTranslate = async () => {
    if (!translate) return;
    setSaving(true);
    try {
      await topicsApi.translate(translate.topic.id, {
        target_languages: translate.targets,
        force: translate.force,
      });
      showSuccess(`Translation requested for ${translate.targets.join(', ')}`);
      setTranslate(null);
      load();
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          Topics
        </Typography>
        {!isReviewer && <TextField
          select
          label="Status"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as TopicStatus | ''); setPage(0); }}
          sx={{ width: 140 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="draft">draft</MenuItem>
          <MenuItem value="review">review</MenuItem>
          <MenuItem value="published">published</MenuItem>
          <MenuItem value="archived">archived</MenuItem>
        </TextField>}
        <TextField
          select
          label="Author"
          value={effectiveAuthor}
          onChange={(e) => { setAuthorFilter(e.target.value); setPage(0); }}
          sx={{ width: 180 }}
        >
          {user && <MenuItem value={user.id}>{user.nickname} (me)</MenuItem>}
          <MenuItem value="">All authors</MenuItem>
          {authors.filter((a) => a.id !== user?.id).map((a) => (
            <MenuItem key={a.id} value={a.id}>
              {a.nickname}
            </MenuItem>
          ))}
        </TextField>
        <Tooltip title="Refresh">
          <IconButton onClick={load} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        {!isReviewer && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setForm(emptyForm); setMaximized(false); setDialogOpen(true); }}>
            New Topic
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Language</TableCell>
              <TableCell>Author</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {topics.map((topic) => (
              <TableRow key={topic.id} hover>
                <TableCell>
                  <Typography variant="body2">{topic.title}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {htmlToText(topic.description)}
                  </Typography>
                </TableCell>
                <TableCell>{topic.slug}</TableCell>
                <TableCell>
                  <StatusChip status={topic.status} />
                </TableCell>
                <TableCell>
                  {topic.served_language}
                  {topic.served_language !== topic.original_language && (
                    <Typography variant="caption" color="text.secondary"> (orig: {topic.original_language})</Typography>
                  )}
                </TableCell>
                <TableCell>{authorNames.get(topic.created_by) ?? topic.created_by.slice(0, 8)}</TableCell>
                <TableCell>{formatDate(topic.created_at)}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={(e) => setMenuAnchor({ el: e.currentTarget, topic })}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!loading && topics.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No topics found
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
          nextIconButtonProps={{ disabled: topics.length < rowsPerPage }}
          backIconButtonProps={{ disabled: page === 0 }}
          labelDisplayedRows={({ from, to }) => `${from}-${to}`}
        />
      </TableContainer>

      <Menu
        anchorEl={menuAnchor?.el}
        open={menuAnchor !== null}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem
          disabled={menuAnchor?.topic.status !== 'draft' || (menuAnchor.topic.created_by !== user?.id && user?.role !== 'admin')}
          onClick={() => {
            if (menuAnchor) submitForReview(menuAnchor.topic);
            setMenuAnchor(null);
          }}
        >
          <ListItemIcon>
            <SendIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Submit for review</ListItemText>
        </MenuItem>
        <MenuItem
          disabled={menuAnchor?.topic.status !== 'review' || (user?.role !== 'reviewer' && user?.role !== 'admin')}
          onClick={() => {
            if (menuAnchor) publish(menuAnchor.topic);
            setMenuAnchor(null);
          }}
        >
          <ListItemIcon>
            <PublishIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Publish</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuAnchor) {
              setMaximized(false);
              setTranslation({ topic: menuAnchor.topic, lang: 'en', title: '', description: '' });
            }
            setMenuAnchor(null);
          }}
        >
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Add translation</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuAnchor) {
              setTranslate({ topic: menuAnchor.topic, targets: [], force: false });
            }
            setMenuAnchor(null);
          }}
        >
          <ListItemIcon>
            <TranslateIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Translate with AI</ListItemText>
        </MenuItem>
      </Menu>

      <Dialog open={dialogOpen} onClose={closeOnEscape(() => setDialogOpen(false))} fullWidth maxWidth={maximized ? false : 'sm'} fullScreen={maximized}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ flexGrow: 1 }}>New Topic</Box>
          <Tooltip title={maximized ? 'Restore' : 'Maximize'}>
            <IconButton onClick={() => setMaximized(!maximized)} aria-label={maximized ? 'Restore' : 'Maximize'}>
              {maximized ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <RichTextEditor
            label="Description"
            value={form.description}
            onChange={(value) => setForm((f) => ({ ...f, description: value }))}
            minHeight={maximized ? 320 : 96}
          />
          <LanguageSelect
            value={form.language}
            onChange={(v) => setForm({ ...form, language: v, title_en: '', description_en: '' })}
            required
          />
          {needsEnglish && (
            <>
              <Button
                variant="outlined"
                startIcon={<TranslateIcon />}
                onClick={translateForm}
                disabled={saving || previewingTranslation || !form.title.trim()}
              >
                {previewingTranslation ? 'Translating…' : 'Translate'}
              </Button>
              <TextField
                label="Title (English)"
                value={form.title_en}
                onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                required
              />
              <RichTextEditor
                label="Description (English)"
                value={form.description_en}
                onChange={(value) => setForm((f) => ({ ...f, description_en: value }))}
                minHeight={maximized ? 320 : 96}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={create}
            disabled={saving || !user || !form.title.trim() || !form.language}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={translation !== null} onClose={closeOnEscape(() => setTranslation(null))} fullWidth maxWidth={maximized ? false : 'sm'} fullScreen={maximized}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ flexGrow: 1 }}>Add translation — {translation?.topic.slug}</Box>
          <Tooltip title={maximized ? 'Restore' : 'Maximize'}>
            <IconButton onClick={() => setMaximized(!maximized)} aria-label={maximized ? 'Restore' : 'Maximize'}>
              {maximized ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <LanguageSelect
            value={translation?.lang ?? 'en'}
            onChange={(v) => translation && setTranslation({ ...translation, lang: v, title: '', description: '' })}
            required
          />
          {translation?.lang === 'en' && translation.topic.original_language !== 'en' && (
            <Button
              variant="outlined"
              startIcon={<TranslateIcon />}
              onClick={previewEnglishTranslation}
              disabled={saving || previewingTranslation}
            >
              {previewingTranslation ? 'Translating…' : 'Translate to English'}
            </Button>
          )}
          <TextField
            label={translation?.lang === 'en' ? 'Title (English)' : 'Title'}
            value={translation?.title ?? ''}
            onChange={(e) => translation && setTranslation({ ...translation, title: e.target.value })}
            required
          />
          <RichTextEditor
            label={translation?.lang === 'en' ? 'Description (English)' : 'Description'}
            value={translation?.description ?? ''}
            onChange={(value) => setTranslation((t) => (t ? { ...t, description: value } : t))}
            minHeight={maximized ? 320 : 96}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTranslation(null)}>Cancel</Button>
          <Button variant="contained" onClick={saveTranslation} disabled={saving || !translation?.title.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={translate !== null} onClose={closeOnEscape(() => setTranslate(null))} fullWidth maxWidth="sm">
        <DialogTitle>Translate with AI — {translate?.topic.slug}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            select
            label="Target languages"
            value={translate?.targets ?? []}
            onChange={(e) => {
              const value = e.target.value;
              if (translate) {
                setTranslate({ ...translate, targets: typeof value === 'string' ? value.split(',') : value });
              }
            }}
            SelectProps={{
              multiple: true,
              renderValue: (selected) => (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {(selected as string[]).map((lang) => (
                    <Chip key={lang} label={lang} size="small" />
                  ))}
                </Box>
              ),
            }}
          >
            {LANGUAGES.filter((l) => l !== translate?.topic.original_language).map((lang) => (
              <MenuItem key={lang} value={lang}>
                <Checkbox checked={(translate?.targets ?? []).includes(lang)} />
                <ListItemText primary={lang} />
              </MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            control={
              <Checkbox
                checked={translate?.force ?? false}
                onChange={(e) => translate && setTranslate({ ...translate, force: e.target.checked })}
              />
            }
            label="Force re-translation of existing languages"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTranslate(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={runTranslate}
            disabled={saving || (translate?.targets.length ?? 0) === 0}
          >
            Translate
          </Button>
        </DialogActions>
      </Dialog>

      {snackbar}
    </Box>
  );
}
