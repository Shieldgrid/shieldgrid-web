import { useState, useEffect } from 'react';
import { fetchSchedules, createSchedule, fetchActionTemplates } from '../lib/api';
import type { Schedule, ActionTemplate } from '../lib/types';
import { Plus, X, RefreshCw } from 'lucide-react';

export default function SchedulerPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [templates, setTemplates] = useState<ActionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    connector_id: 'wazuh',
    action_type: '',
    trigger_type: 'interval',
    interval_seconds: 3600,
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [schedulesData, templatesData] = await Promise.all([
        fetchSchedules(),
        fetchActionTemplates(),
      ]);
      setSchedules(schedulesData);
      setTemplates(templatesData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    try {
      const trigger = newSchedule.trigger_type === 'interval'
        ? { type: 'interval', seconds: newSchedule.interval_seconds }
        : { type: 'cron', expression: '* * * * *' };

      await createSchedule({
        name: newSchedule.name,
        connector_id: newSchedule.connector_id,
        action_type: newSchedule.action_type,
        trigger,
      });
      setShowCreate(false);
      setNewSchedule({ name: '', connector_id: 'wazuh', action_type: '', trigger_type: 'interval', interval_seconds: 3600 });
      loadData();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--sys-text-primary)', margin: 0 }}>Scheduler</h1>
          <p style={{ fontSize: '0.7rem', color: 'var(--sys-text-muted)', fontFamily: 'var(--font-mono)', margin: '0.25rem 0 0' }}>
            AUTOMATION TASKS // PERIODIC SCANS & INGESTION
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <button onClick={loadData} className="btn" style={{ fontFamily: 'var(--font-mono)' }}>
            <RefreshCw size={12} /> REFRESH
          </button>
          <button onClick={() => setShowCreate(!showCreate)} className="btn btn-primary" style={{ fontFamily: 'var(--font-mono)' }}>
            <Plus size={12} /> NEW
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(211,47,47,0.1)', border: '1px solid var(--color-critical)', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-critical)', fontFamily: 'var(--font-mono)' }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'var(--color-critical)', cursor: 'pointer' }}>
            <X size={12} />
          </button>
        </div>
      )}

      {/* Create Form */}
      {showCreate && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">CREATE SCHEDULE</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label style={{ fontSize: '0.6rem', color: 'var(--sys-text-muted)', fontFamily: 'var(--font-mono)' }}>NAME</label>
              <input
                placeholder="schedule name"
                value={newSchedule.name}
                onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                className="input"
                style={{ width: '100%', marginTop: '0.125rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.6rem', color: 'var(--sys-text-muted)', fontFamily: 'var(--font-mono)' }}>CONNECTOR</label>
              <select
                value={newSchedule.connector_id}
                onChange={(e) => setNewSchedule({ ...newSchedule, connector_id: e.target.value })}
                className="input"
                style={{ width: '100%', marginTop: '0.125rem' }}
              >
                <option value="wazuh">WAZUH</option>
                <option value="velociraptor">VELOCIRAPTOR</option>
                <option value="shuffle">SHUFFLE</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.6rem', color: 'var(--sys-text-muted)', fontFamily: 'var(--font-mono)' }}>ACTION</label>
              <select
                value={newSchedule.action_type}
                onChange={(e) => setNewSchedule({ ...newSchedule, action_type: e.target.value })}
                className="input"
                style={{ width: '100%', marginTop: '0.125rem' }}
              >
                <option value="">SELECT...</option>
                {templates.map((t) => <option key={t.id} value={t.name}>{t.display_name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.6rem', color: 'var(--sys-text-muted)', fontFamily: 'var(--font-mono)' }}>TRIGGER</label>
              <select
                value={newSchedule.trigger_type}
                onChange={(e) => setNewSchedule({ ...newSchedule, trigger_type: e.target.value })}
                className="input"
                style={{ width: '100%', marginTop: '0.125rem' }}
              >
                <option value="interval">INTERVAL</option>
                <option value="cron">CRON</option>
              </select>
            </div>
            {newSchedule.trigger_type === 'interval' && (
              <div>
                <label style={{ fontSize: '0.6rem', color: 'var(--sys-text-muted)', fontFamily: 'var(--font-mono)' }}>INTERVAL (SEC)</label>
                <input
                  type="number"
                  value={newSchedule.interval_seconds}
                  onChange={(e) => setNewSchedule({ ...newSchedule, interval_seconds: Number(e.target.value) })}
                  className="input"
                  style={{ width: '100%', marginTop: '0.125rem' }}
                />
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.5rem' }}>
            <button onClick={handleCreate} className="btn btn-primary" style={{ fontFamily: 'var(--font-mono)' }}>CREATE</button>
            <button onClick={() => setShowCreate(false)} className="btn" style={{ fontFamily: 'var(--font-mono)' }}>CANCEL</button>
          </div>
        </div>
      )}

      {/* Schedules Table */}
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--sys-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>LOADING...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>NAME</th>
                <th>CONNECTOR</th>
                <th>ACTION</th>
                <th>TRIGGER</th>
                <th>STATUS</th>
                <th>NEXT RUN</th>
                <th>LAST RUN</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600, color: 'var(--sys-text-primary)' }}>{s.name}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--sys-text-secondary)' }}>{s.connector_id}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--sys-text-secondary)' }}>{s.action_type}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--sys-text-muted)' }}>
                    {s.trigger && s.trigger.type === 'interval' ? `every ${(s.trigger as any).seconds}s` : (s.trigger as any)?.expression || '---'}
                  </td>
                  <td>
                    <span className={`badge ${s.enabled ? 'badge-success' : 'badge-low'}`}>
                      {s.enabled ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--sys-text-muted)' }}>
                    {s.next_run_at ? new Date(s.next_run_at).toLocaleString('en-US', { hour12: false }) : '---'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--sys-text-muted)' }}>
                    {s.last_run_at ? new Date(s.last_run_at).toLocaleString('en-US', { hour12: false }) : '---'}
                  </td>
                </tr>
              ))}
              {schedules.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--sys-text-muted)', padding: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                    NO SCHEDULES CONFIGURED
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
