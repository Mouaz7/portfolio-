'use client';

import { useEffect } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { dictionary } = useI18n();

  useEffect(() => {
    // Log error to error reporting service (Sentry, etc.)
    console.error('Error boundary caught:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-4">
      <div className="text-center max-w-md">
        <h2 className="text-4xl font-bold mb-4 text-cornflowerblue-100">
          {dictionary.common.somethingWentWrong}
        </h2>
        <p className="text-white/70 mb-6">
          {dictionary.common.unexpectedError}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-cornflowerblue-100 hover:bg-cornflowerblue-200 text-white font-medium rounded-full transition-colors"
        >
          {dictionary.common.retry}
        </button>
      </div>
    </div>
  );
}
