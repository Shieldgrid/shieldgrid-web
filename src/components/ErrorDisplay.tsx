import React from 'react';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title = 'System Communication Error',
  message,
  onRetry,
}) => {
  return (
    <div
      style={{
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        background: 'color-mix(in srgb, var(--color-critical) 10%, var(--color-bg-[var(--sys-bg-surface)]))',
        border: '1px solid var(--color-critical)',
        color: 'var(--color-text-[var(--sys-text-primary)])',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        alignItems: 'flex-start',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-critical)' }}>
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h4 style={{ color: 'var(--color-critical)', margin: 0 }}>{title}</h4>
      </div>
      <p style={{ color: 'var(--color-text-[var(--sys-text-secondary)])', fontSize: '0.875rem', margin: 0 }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '0.375rem 0.75rem',
            background: 'var(--color-critical)',
            color: '#0B1B33',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600,
            fontSize: '0.75rem',
            cursor: 'pointer',
            marginTop: '0.25rem',
          }}
        >
          Retry Connection
        </button>
      )}
    </div>
  );
};
