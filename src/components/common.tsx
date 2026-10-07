import { Chip, MenuItem, TextField } from '@mui/material';

export const LANGUAGES = ['tr', 'en', 'de', 'fr', 'es'] as const;

export function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function StatusChip({ status }: { status: string }) {
  const color =
    status === 'active' || status === 'published'
      ? 'success'
      : status === 'suspended' || status === 'archived'
        ? 'default'
        : 'warning';
  return <Chip label={status} color={color} size="small" />;
}

interface LanguageSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
}

export function LanguageSelect({
  label = 'Language',
  value,
  onChange,
  required,
  allowEmpty,
  emptyLabel = 'All',
}: LanguageSelectProps) {
  return (
    <TextField
      select
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      fullWidth
    >
      {allowEmpty && <MenuItem value="">{emptyLabel}</MenuItem>}
      {LANGUAGES.map((lang) => (
        <MenuItem key={lang} value={lang}>
          {lang}
        </MenuItem>
      ))}
    </TextField>
  );
}
