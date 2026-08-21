import { useState } from 'react';
import { Layout } from '../components/Layout';

interface Vulnerability {
  id: string;
  cve_id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cvss_score: number;
  epss_score: number | null;
  description: string;
  affected_asset: string;
  status: 'open' | 'confirmed' | 'remediated' | 'accepted';
  detected_at: string;
  remediation_date: string | null;
  references: string[];
}

interface ScaPolicy {
  id: string;
  name: string;
  description: string;
  platform: string;
  total_checks: number;
  passed: number;
  failed: number;
  score: number;
  last_scan: string;
}

const mockVulnerabilities: Vulnerability[] = [
  {
    id: '1',
    cve_id: 'CVE-2024-3094',
    severity: 'critical',
    cvss_score: 10.0,
    epss_score: 0.98765,
    description: 'XZ Utils backdoor allowing unauthorized remote access through SSH authentication bypass.',
    affected_asset: 'server-web-01 (10.0.1.10)',
    status: 'open',
    detected_at: '2024-04-01T10:00:00Z',
    remediation_date: null,
    references: ['https://nvd.nist.gov/vuln/detail/CVE-2024-3094'],
  },
  {
    id: '2',
    cve_id: 'CVE-2024-21762',
    severity: 'critical',
    cvss_score: 9.8,
    epss_score: 0.95432,
    description: 'Fortinet FortiOS out-of-bound write vulnerability leading to remote code execution.',
    affected_asset: 'firewall-fgt-01 (10.0.0.1)',
    status: 'confirmed',
    detected_at: '2024-03-15T14:30:00Z',
    remediation_date: null,
    references: ['https://nvd.nist.gov/vuln/detail/CVE-2024-21762'],
  },
  {
    id: '3',
    cve_id: 'CVE-2024-1709',
    severity: 'high',
    cvss_score: 8.6,
    epss_score: 0.82341,
    description: 'ConnectWise ScreenConnect authentication bypass allowing unauthorized access.',
    affected_asset: 'workstation-admin-03 (10.0.2.30)',
    status: 'open',
    detected_at: '2024-03-20T09:15:00Z',
    remediation_date: null,
    references: ['https://nvd.nist.gov/vuln/detail/CVE-2024-1709'],
  },
  {
    id: '4',
    cve_id: 'CVE-2023-44487',
    severity: 'high',
    cvss_score: 7.5,
    epss_score: 0.76543,
    description: 'HTTP/2 Rapid Reset Attack Denial of Service vulnerability.',
    affected_asset: 'nginx-proxy-01 (10.0.0.5)',
    status: 'remediated',
    detected_at: '2024-02-10T16:00:00Z',
    remediation_date: '2024-02-15T12:00:00Z',
    references: ['https://nvd.nist.gov/vuln/detail/CVE-2023-44487'],
  },
  {
    id: '5',
    cve_id: 'CVE-2024-23897',
    severity: 'medium',
    cvss_score: 5.9,
    epss_score: 0.45678,
    description: 'Jenkins arbitrary file read vulnerability through CLI.',
    affected_asset: 'jenkins-ci-01 (10.0.3.15)',
    status: 'open',
    detected_at: '2024-04-05T11:45:00Z',
    remediation_date: null,
    references: ['https://nvd.nist.gov/vuln/detail/CVE-2024-23897'],
  },
  {
    id: '6',
    cve_id: 'CVE-2024-20353',
    severity: 'high',
    cvss_score: 8.2,
    epss_score: 0.71234,
    description: 'Cisco ASA and FTD denial of service vulnerability.',
    affected_asset: 'asa-edge-02 (10.0.0.2)',
    status: 'confirmed',
    detected_at: '2024-03-28T13:20:00Z',
    remediation_date: null,
    references: ['https://nvd.nist.gov/vuln/detail/CVE-2024-20353'],
  },
];

const mockScaPolicies: ScaPolicy[] = [
  {
    id: '1',
    name: 'CIS Benchmark - Ubuntu 22.04',
    description: 'Center for Internet Security benchmark for Ubuntu Linux hardening',
    platform: 'linux',
    total_checks: 214,
    passed: 198,
    failed: 16,
    score: 92.5,
    last_scan: '2024-04-20T08:00:00Z',
  },
  {
    id: '2',
    name: 'CIS Benchmark - Windows Server 2022',
    description: 'Center for Internet Security benchmark for Windows Server hardening',
    platform: 'windows',
    total_checks: 312,
    passed: 287,
    failed: 25,
    score: 92.0,
    last_scan: '2024-04-20T09:00:00Z',
  },
  {
    id: '3',
    name: 'NIST 800-53 Controls',
    description: 'NIST Special Publication 800-53 security controls assessment',
    platform: 'cross-platform',
    total_checks: 156,
    passed: 142,
    failed: 14,
    score: 91.0,
    last_scan: '2024-04-19T14:00:00Z',
  },
  {
    id: '4',
    name: 'PCI DSS v4.0',
    description: 'Payment Card Industry Data Security Standard compliance',
    platform: 'cross-platform',
    total_checks: 289,
    passed: 276,
    failed: 13,
    score: 95.5,
    last_scan: '2024-04-18T10:00:00Z',
  },
];

export default function ScaVulnerabilitiesPage() {
  const [activeTab, setActiveTab] = useState<'vulnerabilities' | 'sca'>('vulnerabilities');
  const [vulns] = useState<Vulnerability[]>(mockVulnerabilities);
  const [scaPolicies] = useState<ScaPolicy[]>(mockScaPolicies);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVulns = vulns.filter(v => {
    const matchesSearch = v.cve_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         v.affected_asset.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || v.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#ef4444' };
      case 'high': return { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b' };
      case 'medium': return { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', text: '#3b82f6' };
      case 'low': return { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', text: '#10b981' };
      default: return { bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.3)', text: '#6b7280' };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return { bg: 'rgba(239,68,68,0.1)', text: '#ef4444' };
      case 'confirmed': return { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' };
      case 'remediated': return { bg: 'rgba(16,185,129,0.1)', text: '#10b981' };
      case 'accepted': return { bg: 'rgba(107,114,128,0.1)', text: '#6b7280' };
      default: return { bg: 'rgba(107,114,128,0.1)', text: '#6b7280' };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981';
    if (score >= 75) return '#f59e0b';
    return '#ef4444';
  };

  const criticalCount = vulns.filter(v => v.severity === 'critical').length;
  const highCount = vulns.filter(v => v.severity === 'high').length;
  const openCount = vulns.filter(v => v.status === 'open').length;
  const avgScaScore = scaPolicies.length > 0 ? (scaPolicies.reduce((sum, p) => sum + p.score, 0) / scaPolicies.length).toFixed(1) : '0';

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header */}
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🛡️ SCA &amp; Vulnerabilities
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            Security Configuration Assessment and CVE vulnerability tracking.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {[
            { label: 'Critical Vulns', value: criticalCount, icon: '🔴', color: '#ef4444' },
            { label: 'High Vulns', value: highCount, icon: '🟠', color: '#f59e0b' },
            { label: 'Open Issues', value: openCount, icon: '📋', color: '#3b82f6' },
            { label: 'Avg SCA Score', value: `${avgScaScore}%`, icon: '✅', color: '#10b981' },
          ].map((stat, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{stat.icon}</span>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{stat.label}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--color-border)' }}>
          {([
            { key: 'vulnerabilities', label: 'Vulnerabilities', icon: '🐛' },
            { key: 'sca', label: 'SCA Policies', icon: '📋' },
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

        {/* Vulnerabilities Tab */}
        {activeTab === 'vulnerabilities' && (
          <>
            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search CVE or asset..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.875rem',
                }}
              />
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.875rem',
                }}
              >
                <option value="all">All Severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.875rem',
                }}
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="confirmed">Confirmed</option>
                <option value="remediated">Remediated</option>
                <option value="accepted">Accepted</option>
              </select>
            </div>

            {/* Vulnerability List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredVulns.map(vuln => {
                const sevColor = getSeverityColor(vuln.severity);
                const statusColor = getStatusColor(vuln.status);
                return (
                  <div
                    key={vuln.id}
                    style={{
                      background: 'var(--color-bg-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: sevColor.bg,
                            border: `1px solid ${sevColor.border}`,
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: sevColor.text,
                            textTransform: 'uppercase',
                          }}
                        >
                          {vuln.severity}
                        </span>
                        <code style={{ fontWeight: 600, color: 'var(--color-accent)', fontSize: '0.9rem' }}>{vuln.cve_id}</code>
                      </div>
                      <span
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: statusColor.bg,
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: statusColor.text,
                          textTransform: 'capitalize',
                        }}
                      >
                        {vuln.status}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0 0 0.75rem 0' }}>
                      {vuln.description}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', fontSize: '0.8rem' }}>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', display: 'block' }}>CVSS Score</span>
                        <span style={{ fontWeight: 600, color: vuln.cvss_score >= 9 ? '#ef4444' : vuln.cvss_score >= 7 ? '#f59e0b' : '#10b981' }}>
                          {vuln.cvss_score.toFixed(1)}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', display: 'block' }}>EPSS Score</span>
                        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {vuln.epss_score != null ? `${(vuln.epss_score * 100).toFixed(1)}%` : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', display: 'block' }}>Affected Asset</span>
                        <span style={{ color: 'var(--color-text-primary)', wordBreak: 'break-all' }}>{vuln.affected_asset}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', display: 'block' }}>Detected</span>
                        <span style={{ color: 'var(--color-text-primary)' }}>{new Date(vuln.detected_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* SCA Tab */}
        {activeTab === 'sca' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {scaPolicies.map(policy => (
              <div
                key={policy.id}
                style={{
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{policy.name}</h3>
                      <span
                        style={{
                          padding: '0.15rem 0.5rem',
                          background: 'rgba(99,102,241,0.1)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.7rem',
                          color: '#818cf8',
                        }}
                      >
                        {policy.platform}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{policy.description}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: getScoreColor(policy.score) }}>
                      {policy.score.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Compliance Score</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: '1rem' }}>
                  <div
                    style={{
                      height: '8px',
                      background: 'var(--color-bg-base)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${policy.score}%`,
                        background: getScoreColor(policy.score),
                        borderRadius: '4px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    <span>{policy.passed} passed / {policy.failed} failed</span>
                    <span>{policy.total_checks} total checks</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  <span>Last scan: {new Date(policy.last_scan).toLocaleString()}</span>
                  <button
                    style={{
                      padding: '0.375rem 0.75rem',
                      background: 'transparent',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--color-text-secondary)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
