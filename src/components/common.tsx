import { createContext, useContext, useState, type ReactNode } from 'react';
import { Chip, MenuItem, Select, TextField } from '@mui/material';

export const LANGUAGES = ['tr', 'en', 'de', 'fr', 'es', 'ar', 'fa', 'ur'] as const;

export const LANG_FLAGS: Record<string, string> = {
  tr: '🇹🇷',
  en: '🇬🇧',
  de: '🇩🇪',
  fr: '🇫🇷',
  es: '🇪🇸',
  ar: '🇸🇦',
  fa: '🇮🇷',
  ur: '🇵🇰',
};

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

interface LanguageContextValue {
  language: string;
  setLanguage: (value: string) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: '',
  setLanguage: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState(() => localStorage.getItem('language') ?? '');
  const setLanguage = (value: string) => {
    setLanguageState(value);
    localStorage.setItem('language', value);
  };
  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  return (
    <Select
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      size="small"
      variant="standard"
      renderValue={(v) => (v ? `${LANG_FLAGS[v]} ${v.toUpperCase()}` : '🌐 All')}
      sx={{
        ml: 'auto',
        color: 'inherit',
        '&:before, &:after': { display: 'none' },
        '& .MuiSelect-icon': { color: 'inherit' },
      }}
    >
      <MenuItem value="">🌐 All</MenuItem>
      {LANGUAGES.map((lang) => (
        <MenuItem key={lang} value={lang}>
          {LANG_FLAGS[lang]} {lang.toUpperCase()}
        </MenuItem>
      ))}
    </Select>
  );
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
          {LANG_FLAGS[lang]} {lang}
        </MenuItem>
      ))}
    </TextField>
  );
}
