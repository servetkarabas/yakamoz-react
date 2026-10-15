import { useEffect, useRef } from 'react';
import { Box, FormLabel, IconButton, Stack, Tooltip } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';

const ALLOWED_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'P', 'DIV', 'BR', 'UL', 'OL', 'LI', 'A', 'H2', 'H3', 'BLOCKQUOTE']);
const DROPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'TEMPLATE']);
const SAFE_URL = /^(https?:|mailto:)/i;

function cleanNode(node: Node, target: Node, doc: Document) {
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      target.appendChild(doc.createTextNode(child.textContent ?? ''));
      return;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return;
    const element = child as Element;
    if (DROPPED_TAGS.has(element.tagName)) return;
    if (!ALLOWED_TAGS.has(element.tagName)) {
      cleanNode(element, target, doc);
      return;
    }
    const copy = doc.createElement(element.tagName.toLowerCase());
    if (element.tagName === 'A') {
      const href = element.getAttribute('href')?.trim() ?? '';
      if (SAFE_URL.test(href)) {
        copy.setAttribute('href', href);
        copy.setAttribute('target', '_blank');
        copy.setAttribute('rel', 'noopener noreferrer');
      }
    }
    cleanNode(element, copy, doc);
    target.appendChild(copy);
  });
}

export function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const container = document.createElement('div');
  cleanNode(doc.body, container, document);
  return container.innerHTML;
}

const looksLikeHtml = (value: string) => /<[a-z][\s\S]*>/i.test(value);

export function htmlToText(value: string): string {
  if (!looksLikeHtml(value)) return value;
  const doc = new DOMParser().parseFromString(value.replace(/<\/(p|div|li|h2|h3|blockquote)>|<br\s*\/?>/gi, ' $&'), 'text/html');
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export function isRichTextEmpty(value: string): boolean {
  return htmlToText(value).trim() === '';
}

export function RichTextView({ html }: { html: string }) {
  if (!looksLikeHtml(html)) {
    return <Box sx={{ whiteSpace: 'pre-wrap' }}>{html}</Box>;
  }
  return (
    <Box
      sx={{ '& p, & div': { m: 0 }, '& ul, & ol': { my: 0.5, pl: 3 }, '& blockquote': { m: 0, pl: 2, borderLeft: 3, borderColor: 'divider' }, '& a': { color: 'primary.main' } }}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}

interface RichTextEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minHeight?: number | string;
}

export function RichTextEditor({ label, value, onChange, minHeight = 96 }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef<string | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || value === lastEmitted.current) return;
    element.innerHTML = looksLikeHtml(value) ? sanitizeHtml(value) : value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>');
    lastEmitted.current = value;
  }, [value]);

  const emit = () => {
    const element = ref.current;
    if (!element) return;
    const html = element.innerText.trim() === '' && !element.querySelector('a,li') ? '' : sanitizeHtml(element.innerHTML);
    lastEmitted.current = html;
    onChange(html);
  };

  const run = (command: string, argument?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, argument);
    emit();
  };

  const addLink = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      window.alert('Select the text you want to link first.');
      return;
    }
    const range = selection.getRangeAt(0).cloneRange();
    const url = window.prompt('Link URL (https://…)');
    if (!url) return;
    selection.removeAllRanges();
    selection.addRange(range);
    const href = /^[a-z][a-z0-9+.-]*:/i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    if (!SAFE_URL.test(href)) {
      window.alert('Only http, https and mailto links are allowed.');
      return;
    }
    run('createLink', href);
  };

  const buttons: { title: string; icon: JSX.Element; action: () => void }[] = [
    { title: 'Bold', icon: <FormatBoldIcon fontSize="small" />, action: () => run('bold') },
    { title: 'Italic', icon: <FormatItalicIcon fontSize="small" />, action: () => run('italic') },
    { title: 'Underline', icon: <FormatUnderlinedIcon fontSize="small" />, action: () => run('underline') },
    { title: 'Bulleted list', icon: <FormatListBulletedIcon fontSize="small" />, action: () => run('insertUnorderedList') },
    { title: 'Numbered list', icon: <FormatListNumberedIcon fontSize="small" />, action: () => run('insertOrderedList') },
    { title: 'Add link', icon: <LinkIcon fontSize="small" />, action: addLink },
    { title: 'Remove link', icon: <LinkOffIcon fontSize="small" />, action: () => run('unlink') },
  ];

  return (
    <Box>
      <FormLabel sx={{ fontSize: 12 }}>{label}</FormLabel>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, '&:focus-within': { borderColor: 'primary.main' } }}>
        <Stack direction="row" sx={{ borderBottom: 1, borderColor: 'divider', px: 0.5 }}>
          {buttons.map((button) => (
            <Tooltip key={button.title} title={button.title}>
              <IconButton size="small" aria-label={button.title} onMouseDown={(e) => e.preventDefault()} onClick={button.action}>
                {button.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Stack>
        <Box
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={label}
          onInput={emit}
          onBlur={emit}
          onPaste={(e) => {
            e.preventDefault();
            document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
          }}
          sx={{ p: 1.5, minHeight, outline: 'none', overflow: 'auto', '& ul, & ol': { my: 0.5, pl: 3 }, '& a': { color: 'primary.main' } }}
        />
      </Box>
    </Box>
  );
}
