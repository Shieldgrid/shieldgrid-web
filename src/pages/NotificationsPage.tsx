import { useState, useEffect } from 'react';
import { fetchNotificationChannels, fetchNotificationRules, sendNotification } from '../lib/api';
import type { NotificationChannel, NotificationRule } from '../lib/types';

export default function NotificationsPage() {
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'channels' | 'rules' | 'send'>('channels');
  const [sendForm, setSendForm] = useState({ channel_id: '', recipient: '', subject: '', message: '' });
  const [sendResult, setSendResult] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [channelsData, rulesData] = await Promise.all([fetchNotificationChannels(), fetchNotificationRules()]);
      setChannels(channelsData);
      setRules(rulesData);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  async function handleSend() {
    try {
      const result = await sendNotification(sendForm);
      setSendResult(`Notification sent! Status: ${result.status}`);
      setSendForm({ channel_id: '', recipient: '', subject: '', message: '' });
    } catch (e: any) { setError(e.message); }
  }

  if (loading) return <div className="p-8 text-gray-400">Loading notifications...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-8">Notifications</h1>

      {error && <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-300">{error}<button onClick={() => setError(null)} className="ml-2">✕</button></div>}
      {sendResult && <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded text-green-300">{sendResult}<button onClick={() => setSendResult(null)} className="ml-2">✕</button></div>}

      <div className="flex gap-4 mb-6">
        {(['channels', 'rules', 'send'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded font-medium ${tab === t ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'channels' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {channels.map((c) => (
            <div key={c.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-semibold">{c.name}</h3>
                <span className={`px-2 py-1 rounded text-xs ${c.enabled ? 'bg-green-900/50 text-green-300' : 'bg-gray-600 text-gray-400'}`}>
                  {c.enabled ? 'Active' : 'Disabled'}
                </span>
              </div>
              <div className="text-sm text-gray-400">
                <div>Type: <span className="text-gray-300">{c.channel_type}</span></div>
                <div>Created: <span className="text-gray-300">{new Date(c.created_at).toLocaleDateString()}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'rules' && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Trigger</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {rules.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 text-white">{r.name}</td>
                  <td className="px-4 py-3 text-gray-300">{r.trigger_type}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${r.enabled ? 'bg-green-900/50 text-green-300' : 'bg-gray-600 text-gray-400'}`}>
                      {r.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'send' && (
        <div className="max-w-xl bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-4">Send Test Notification</h3>
          <div className="space-y-4">
            <select value={sendForm.channel_id} onChange={(e) => setSendForm({ ...sendForm, channel_id: e.target.value })} className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white">
              <option value="">Select channel...</option>
              {channels.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.channel_type})</option>)}
            </select>
            <input placeholder="Recipient (email, webhook URL, etc.)" value={sendForm.recipient} onChange={(e) => setSendForm({ ...sendForm, recipient: e.target.value })} className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white" />
            <input placeholder="Subject (optional)" value={sendForm.subject} onChange={(e) => setSendForm({ ...sendForm, subject: e.target.value })} className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white" />
            <textarea placeholder="Message" value={sendForm.message} onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })} className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white h-24" />
            <button onClick={handleSend} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Send Notification</button>
          </div>
        </div>
      )}
    </div>
  );
}
