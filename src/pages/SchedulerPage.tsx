import { useState, useEffect } from 'react';
import { fetchSchedules, createSchedule, fetchActionTemplates } from '../lib/api';
import type { Schedule, ActionTemplate } from '../lib/types';

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

  useEffect(() => {
    loadData();
  }, []);

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

  if (loading) return <div className="p-8 text-gray-400">Loading schedules...</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Scheduler</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + New Schedule
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-300">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-300">✕</button>
        </div>
      )}

      {showCreate && (
        <div className="mb-6 p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <h3 className="text-white font-semibold mb-3">Create Schedule</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="Schedule name"
              value={newSchedule.name}
              onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
              className="p-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
            <select
              value={newSchedule.connector_id}
              onChange={(e) => setNewSchedule({ ...newSchedule, connector_id: e.target.value })}
              className="p-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="wazuh">Wazuh</option>
              <option value="velociraptor">Velociraptor</option>
              <option value="shuffle">Shuffle</option>
            </select>
            <select
              value={newSchedule.action_type}
              onChange={(e) => setNewSchedule({ ...newSchedule, action_type: e.target.value })}
              className="p-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="">Select action...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.name}>{t.display_name}</option>
              ))}
            </select>
            <select
              value={newSchedule.trigger_type}
              onChange={(e) => setNewSchedule({ ...newSchedule, trigger_type: e.target.value })}
              className="p-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="interval">Interval</option>
              <option value="cron">Cron</option>
            </select>
            {newSchedule.trigger_type === 'interval' && (
              <input
                type="number"
                placeholder="Interval (seconds)"
                value={newSchedule.interval_seconds}
                onChange={(e) => setNewSchedule({ ...newSchedule, interval_seconds: Number(e.target.value) })}
                className="p-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleCreate} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Create</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Connector</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Action</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Next Run</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Last Run</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {schedules.map((s) => (
              <tr key={s.id} className="hover:bg-gray-750">
                <td className="px-4 py-3 text-white">{s.name}</td>
                <td className="px-4 py-3 text-gray-300">{s.connector_id}</td>
                <td className="px-4 py-3 text-gray-300">{s.action_type}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${s.enabled ? 'bg-green-900/50 text-green-300' : 'bg-gray-600 text-gray-400'}`}>
                    {s.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-sm">
                  {s.next_run_at ? new Date(s.next_run_at).toLocaleString() : '—'}
                </td>
                <td className="px-4 py-3 text-gray-400 text-sm">
                  {s.last_run_at ? new Date(s.last_run_at).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {schedules.length === 0 && (
          <div className="p-8 text-center text-gray-500">No schedules configured</div>
        )}
      </div>
    </div>
  );
}
