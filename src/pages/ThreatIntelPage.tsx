import { useState } from 'react';
import { Layout } from '../components/Layout';
import { lookupIoc, enrichIocs, lookupEpss } from '../lib/api';
import type { ThreatIntelResult } from '../lib/types';

export default function ThreatIntelPage() {
  const [searchValue, setSearchValue] = useState('');
  const [searchType, setSearchType] = useState<'ioc' | 'cve'>('ioc');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ThreatIntelResult | null>(null);
  const [bulkInput, setBulkInput] = useState('');
  const [bulkResults, setBulkResults] = useState<ThreatIntelResult[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'lookup' | 'bulk' | 'history'>('lookup');
  const [searchHistory, setSearchHistory] = useState<ThreatIntelResult[]>([]);

  const handleLookup = async () => {
    if (!searchValue.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      let data: ThreatIntelResult;
      if (searchType === 'cve') {
        data = await lookupEpss(searchValue.trim());
      } else {
        data = await lookupIoc(searchValue.trim());
      }
      setResult(data);
      setSearchHistory(prev => [data, ...prev.filter(h => h.ioc_value !== data.ioc_value)].slice(0, 50));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkEnrich = async () => {
    const iocs = bulkInput.split('\n').map(s => s.trim()).filter(Boolean);
    if (iocs.length === 0) return;
    setBulkLoading(true);
    setError(null);
    setBulkResults([]);
    try {
      const response = await enrichIocs(iocs);
      setBulkResults(response.results);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bulk enrichment failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'malicious': return { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#ef4444' };
      case 'suspicious': return { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b' };
      case 'benign': return { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', text: '#10b981' };
      default: return { bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.3)', text: '#6b7280' };
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'malicious': return '🔴';
      case 'suspicious': return '🟡';
      case 'benign': return '🟢';
      default: return '⚪';
    }
  };

  const getIocTypeIcon = (type: string) => {
    switch (type) {
      case 'ip': return '🌐';
      case 'domain': return '🔗';
      case 'hash': return '#️⃣';
      case 'cve': return '🛡️';
      case 'url': return '🔗';
      default: return '❓';
    }
  };

  const renderResultCard = (data: ThreatIntelResult, compact = false) => {
    const verdictStyle = getVerdictColor(data.verdict);
    return (
      <div
        style={{
          background: 'var(--color-bg-surface)',
          border: `1px solid var(--color-border)`,
          borderRadius: 'var(--radius-lg)',
          padding: compact ? '1rem' : '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: compact ? '0.5rem' : '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: compact ? '1.25rem' : '1.5rem' }}>{getIocTypeIcon(data.ioc_type)}</span>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {data.ioc_type} {data.cached && '(cached)'}
              </div>
              <code style={{ fontSize: compact ? '0.9rem' : '1rem', fontWeight: 600, color: 'var(--color-text-primary)', wordBreak: 'break-all' }}>
                {data.ioc_value}
              </code>
            </div>
          </div>
          <div
            style={{
              padding: '0.375rem 0.75rem',
              background: verdictStyle.bg,
              border: `1px solid ${verdictStyle.border}`,
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: verdictStyle.text,
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            {getVerdictIcon(data.verdict)} {data.verdict.toUpperCase()}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
          <div>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Provider</span>
            <div style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{data.provider}</div>
          </div>
          {data.score != null && (
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Score</span>
              <div style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{data.score}</div>
            </div>
          )}
          <div>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Checked At</span>
            <div style={{ color: 'var(--color-text-primary)' }}>{new Date(data.checked_at).toLocaleString()}</div>
          </div>
        </div>

        {Object.keys(data.details).length > 0 && !compact && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
              DETAILS
            </div>
            <pre
              style={{
                background: 'var(--color-bg-base)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.75rem',
                color: 'var(--color-text-secondary)',
                overflowX: 'auto',
                maxHeight: '300px',
                margin: 0,
              }}
            >
              {JSON.stringify(data.details, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header */}
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🔍 Threat Intelligence
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            Look up IOCs, CVEs, and enrich indicators across multiple intelligence providers.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: 0 }}>
          {([
            { key: 'lookup', label: 'IOC Lookup', icon: '🔍' },
            { key: 'bulk', label: 'Bulk Enrichment', icon: '📋' },
            { key: 'history', label: 'Search History', icon: '📜' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '0.625rem 1rem',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.key ? '2px solid var(--color-accent)' : '2px solid transparent',
                color: activeTab === tab.key ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                fontSize: '0.875rem',
                fontWeight: activeTab === tab.key ? 600 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-critical)',
              fontSize: '0.875rem',
            }}
          >
            ❌ {error}
          </div>
        )}

        {/* Lookup Tab */}
        {activeTab === 'lookup' && (
          <div
            style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as 'ioc' | 'cve')}
                style={{
                  padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg-base)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.875rem',
                  minWidth: '120px',
                }}
              >
                <option value="ioc">IOC (IP/Domain/Hash)</option>
                <option value="cve">CVE</option>
              </select>
              <input
                type="text"
                placeholder={searchType === 'cve' ? 'CVE-2024-12345' : 'Enter IP, domain, or hash...'}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                style={{
                  flex: 1,
                  padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg-base)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                }}
              />
              <button
                onClick={handleLookup}
                disabled={loading || !searchValue.trim()}
                style={{
                  padding: '0.625rem 1.5rem',
                  background: loading ? 'var(--color-text-muted)' : 'var(--color-accent)',
                  color: '#0B1B33',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: loading || !searchValue.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? '⏳ Searching...' : '🔍 Lookup'}
              </button>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Supports: IPv4, IPv6, domains, URLs, file hashes (MD5, SHA1, SHA256), and CVE identifiers.
            </div>
          </div>
        )}

        {/* Bulk Tab */}
        {activeTab === 'bulk' && (
          <div
            style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                IOC List (one per line)
              </label>
              <textarea
                placeholder="8.8.8.8&#10;evil.com&#10;d41d8cd98f00b204e9800998ecf8427e&#10;CVE-2024-12345"
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                rows={8}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg-base)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.85rem',
                  fontFamily: 'monospace',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {bulkInput.split('\n').filter(s => s.trim()).length} IOCs detected
              </span>
              <button
                onClick={handleBulkEnrich}
                disabled={bulkLoading || !bulkInput.trim()}
                style={{
                  padding: '0.625rem 1.5rem',
                  background: bulkLoading ? 'var(--color-text-muted)' : 'var(--color-accent)',
                  color: '#0B1B33',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: bulkLoading || !bulkInput.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {bulkLoading ? '⏳ Enriching...' : '🚀 Enrich All'}
              </button>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div
            style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
            }}
          >
            {searchHistory.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
                No lookups performed yet. Use the IOC Lookup tab to search.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {searchHistory.map((h, idx) => (
                  <div key={`${h.ioc_value}-${idx}`}>
                    {renderResultCard(h, true)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Single Lookup Result */}
        {activeTab === 'lookup' && result && (
          <div style={{ marginTop: '0.5rem' }}>
            {renderResultCard(result)}
          </div>
        )}

        {/* Bulk Results */}
        {activeTab === 'bulk' && bulkResults.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
              Enrichment Results ({bulkResults.length})
            </h3>
            {bulkResults.map((r, idx) => (
              <div key={`${r.ioc_value}-${idx}`}>
                {renderResultCard(r, true)}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
