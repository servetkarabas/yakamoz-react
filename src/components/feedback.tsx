import { useCallback, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { apiErrorMessage } from '../api/client';

type Feedback = { message: string; severity: 'success' | 'error' };

export function useFeedback() {
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const showError = useCallback(
    (error: unknown) => setFeedback({ message: apiErrorMessage(error), severity: 'error' }),
    [],
  );
  const showSuccess = useCallback(
    (message: string) => setFeedback({ message, severity: 'success' }),
    [],
  );

  const snackbar = (
    <Snackbar
      open={feedback !== null}
      autoHideDuration={5000}
      onClose={() => setFeedback(null)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert severity={feedback?.severity ?? 'info'} variant="filled" onClose={() => setFeedback(null)}>
        {feedback?.message}
      </Alert>
    </Snackbar>
  );

  return { showError, showSuccess, snackbar };
}
