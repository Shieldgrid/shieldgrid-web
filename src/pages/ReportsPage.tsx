import { useState } from 'react';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'executive' | 'incident' | 'compliance' | 'technical' | 'custom';
  format: 'pdf' | 'csv' | 'json' | 'html';
  last_generated: string | null;
  schedule: string | null;
}

interface GeneratedReport {
  id: string;
  template_name: string;
  status: 'completed' | 'generating' | 'failed';
  format: string;
  file_size: string;
  generated_at: string;
  generated_by: string;
  download_url: string | null;
}

const mockTemplates: ReportTemplate[] = [
  {
    id: '1',
    name: 'Executive Security Summary',
    description: 'High-level security posture overview for C-suite. Includes key metrics, risk trends, and recommendations.',
    category: 'executive',
    format: 'pdf',
    last_generated: '2024-04-20T08:00:00Z',
    schedule: 'Weekly',
  },
  {
    id: '2',
    name: 'Incident Response Report',
    description: 'Detailed incident timeline, affected assets, actions taken, and lessons learned.',
    category: 'incident',
    format: 'pdf',
    last_generated: '2024-04-19T14:30:00Z',
    schedule: null,
  },
  {
    id: '3',
    name: 'PCI DSS Compliance Report',
    description: 'Payment Card Industry Data Security Standard compliance assessment and gaps.',
    category: 'compliance',
    format: 'pdf',
    last_generated: '2024-04-15T10:00:00Z',
    schedule: 'Monthly',
  },
  {
    id: '4',
    name: 'Vulnerability Assessment',
    description: 'Full vulnerability scan results with CVSS scoring and remediation priorities.',
    category: 'technical',
    format: 'csv',
    last_generated: '2024-04-20T06:00:00Z',
    schedule: 'Daily',
  },
  {
    id: '5',
    name: 'SOC Activity Report',
    description: 'Analyst activity, alert triage metrics, response times, and SLA compliance.',
    category: 'executive',
    format: 'pdf',
    last_generated: '2024-04-20T09:00:00Z',
    schedule: 'Daily',
  },
  {
    id: '6',
    name: 'Threat Intelligence Digest',
    description: 'Top IOCs observed, threat landscape changes, and emerging threat indicators.',
    category: 'technical',
    format: 'html',
    last_generated: '2024-04-19T18:00:00Z',
    schedule: 'Weekly',
  },
  {
    id: '7',
    name: 'NIST 800-53 Compliance',
    description: 'NIST Special Publication 800-53 security controls compliance assessment.',
    category: 'compliance',
    format: 'pdf',
    last_generated: '2024-04-01T10:00:00Z',
    schedule: 'Quarterly',
  },
  {
    id: '8',
    name: 'SOC2 Type II Report',
    description: 'SOC2 Type II audit readiness assessment and evidence collection.',
    category: 'compliance',
    format: 'pdf',
    last_generated: null,
    schedule: null,
  },
];

const mockGeneratedReports: GeneratedReport[] = [
  {
    id: '1',
    template_name: 'Executive Security Summary',
    status: 'completed',
    format: 'pdf',
    file_size: '2.4 MB',
    generated_at: '2024-04-20T08:00:00Z',
    generated_by: 'System (Scheduled)',
    download_url: '#',
  },
  {
    id: '2',
    template_name: 'SOC Activity Report',
    status: 'completed',
    format: 'pdf',
    file_size: '1.8 MB',
    generated_at: '2024-04-20T09:00:00Z',
    generated_by: 'System (Scheduled)',
    download_url: '#',
  },
  {
    id: '3',
    template_name: 'Vulnerability Assessment',
    status: 'completed',
    format: 'csv',
    file_size: '567 KB',
    generated_at: '2024-04-20T06:00:00Z',
    generated_by: 'System (Scheduled)',
    download_url: '#',
  },
  {
    id: '4',
    template_name: 'Incident Response Report',
    status: 'generating',
    format: 'pdf',
    file_size: '...',
    generated_at: '2024-04-20T10:15:00Z',
    generated_by: 'analyst@shieldgrid.io',
    download_url: null,
  },
  {
    id: '5',
    template_name: 'Threat Intelligence Digest',
    status: 'completed',
    format: 'html',
    file_size: '892 KB',
    generated_at: '2024-04-19T18:00:00Z',
    generated_by: 'System (Scheduled)',
    download_url: '#',
  },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'generated' | 'schedule'>('templates');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [generating, setGenerating] = useState<string | null>(null);

  const filteredTemplates = mockTemplates.filter(t => {
    return categoryFilter === 'all' || t.category === categoryFilter;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'executive': return { bg: 'rgba(168,85,247,0.1)', text: '#a855f7' };
      case 'incident': return { bg: 'rgba(239,68,68,0.1)', text: '#ef4444' };
      case 'compliance': return { bg: 'rgba(59,130,246,0.1)', text: '#3b82f6' };
      case 'technical': return { bg: 'rgba(16,185,129,0.1)', text: '#10b981' };
      default: return { bg: 'rgba(107,114,128,0.1)', text: '#6b7280' };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'executive': return '👔';
      case 'incident': return '🚨';
      case 'compliance': return '📋';
      case 'technical': return '⚙️';
      default: return '📄';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return { bg: 'rgba(16,185,129,0.1)', text: '#10b981', icon: '✅' };
      case 'generating': return { bg: 'rgba(59,130,246,0.1)', text: '#3b82f6', icon: '⏳' };
      case 'failed': return { bg: 'rgba(239,68,68,0.1)', text: '#ef4444', icon: '❌' };
      default: return { bg: 'rgba(107,114,128,0.1)', text: '#6b7280', icon: '❓' };
    }
  };

  const handleGenerate = async (templateId: string) => {
    setGenerating(templateId);
    // Simulate generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setGenerating(null);
    alert('Report generation started! Check the Generated tab for status.');
  };

  return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header */}
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📊 Reports
          </h1>
          <p style={{ color: 'var(--color-text-[var(--sys-text-secondary)])', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            Generate, schedule, and download security reports for compliance, executive briefing, and operational use.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--color-border)' }}>
          {([
            { key: 'templates', label: 'Report Templates', icon: '📄' },
            { key: 'generated', label: 'Generated Reports', icon: '📥' },
            { key: 'schedule', label: 'Schedules', icon: '⏰' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '0.625rem 1rem',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.key ? '2px solid var(--color-accent)' : '2px solid transparent',
                color: activeTab === tab.key ? 'var(--color-accent)' : 'var(--color-text-[var(--sys-text-secondary)])',
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

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg-[var(--sys-bg-surface)])',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-[var(--sys-text-primary)])',
                  fontSize: '0.875rem',
                }}
              >
                <option value="all">All Categories</option>
                <option value="executive">Executive</option>
                <option value="incident">Incident</option>
                <option value="compliance">Compliance</option>
                <option value="technical">Technical</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
              {filteredTemplates.map(template => {
                const catColor = getCategoryColor(template.category);
                return (
                  <div
                    key={template.id}
                    style={{
                      background: 'var(--color-bg-[var(--sys-bg-surface)])',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{getCategoryIcon(template.category)}</span>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{template.name}</h3>
                      </div>
                      <span
                        style={{
                          padding: '0.15rem 0.5rem',
                          background: catColor.bg,
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: catColor.text,
                          textTransform: 'capitalize',
                        }}
                      >
                        {template.category}
                      </span>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-[var(--sys-text-secondary)])', lineHeight: '1.5' }}>
                      {template.description}
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--color-text-[var(--sys-text-muted)])' }}>
                      <span>Format: <strong style={{ color: 'var(--color-text-[var(--sys-text-primary)])', textTransform: 'uppercase' }}>{template.format}</strong></span>
                      {template.schedule && <span>Schedule: <strong style={{ color: 'var(--color-text-[var(--sys-text-primary)])' }}>{template.schedule}</strong></span>}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-[var(--sys-text-muted)])' }}>
                        {template.last_generated ? `Last: ${new Date(template.last_generated).toLocaleDateString()}` : 'Never generated'}
                      </span>
                      <button
                        onClick={() => handleGenerate(template.id)}
                        disabled={generating === template.id}
                        style={{
                          padding: '0.375rem 0.75rem',
                          background: generating === template.id ? 'var(--color-text-[var(--sys-text-muted)])' : 'var(--color-accent)',
                          color: '#0B1B33',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: generating === template.id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {generating === template.id ? '⏳ Generating...' : '▶ Generate'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Generated Reports Tab */}
        {activeTab === 'generated' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {mockGeneratedReports.map(report => {
              const statusStyle = getStatusStyle(report.status);
              return (
                <div
                  key={report.id}
                  style={{
                    background: 'var(--color-bg-[var(--sys-bg-surface)])',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>{statusStyle.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{report.template_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-[var(--sys-text-muted)])' }}>
                        {report.file_size} • {report.format.toUpperCase()} • Generated by {report.generated_by}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-[var(--sys-text-muted)])' }}>
                      {new Date(report.generated_at).toLocaleString()}
                    </span>
                    {report.status === 'completed' && report.download_url && (
                      <a
                        href={report.download_url}
                        style={{
                          padding: '0.375rem 0.75rem',
                          background: 'rgba(99,102,241,0.1)',
                          border: '1px solid rgba(99,102,241,0.3)',
                          borderRadius: 'var(--radius-md)',
                          color: '#818cf8',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        📥 Download
                      </a>
                    )}
                    {report.status === 'generating' && (
                      <span style={{ fontSize: '0.8rem', color: '#3b82f6', animation: 'pulse 2s infinite' }}>
                        Generating...
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div
            style={{
              background: 'var(--color-bg-[var(--sys-bg-surface)])',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Report Schedules</h3>
              <button
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--color-accent)',
                  color: '#0B1B33',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                + New Schedule
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {mockTemplates.filter(t => t.schedule).map(template => (
                <div
                  key={template.id}
                  style={{
                    padding: '1rem',
                    background: 'var(--color-bg-[var(--sys-bg-base)])',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span>⏰</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{template.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-[var(--sys-text-muted)])' }}>
                        Every {template.schedule} • Format: {template.format.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: 'rgba(16,185,129,0.1)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#10b981',
                      }}
                    >
                      Active
                    </span>
                    <button
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: 'transparent',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--color-text-[var(--sys-text-secondary)])',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
  );
}
