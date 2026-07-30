import React from 'react';

interface LoadingSkeletonProps {
  count?: number;
  height?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ count = 3, height = '4rem' }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            height,
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            opacity: 0.6,
            animation: 'pulse 1.5s infinite ease-in-out',
          }}
        />
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};
