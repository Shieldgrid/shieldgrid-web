import { useState, useEffect } from 'react';
import { fetchNetworkConnectors, createNetworkConnector } from '../lib/api';
import type { NetworkConnector } from '../lib/types';

const DEVICE_TYPES = [
  { value: 'fortinet', label: 'Fortinet FortiGate' },
  { value: 'paloalto', label: 'Palo Alto PAN-OS' },
  { value: 'cisco_asa', label: 'Cisco ASA' },
  { value: 'cisco_ftd', label: 'Cisco FTD' },
  { value: 'generic', label: 'Generic Syslog' },
];

export default function NetworkConnectorsPage() {
  const [connectors, setConnectors] = useState<NetworkConnector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newConnector, setNewConnector] = useState({
    name: '',
    device_type: 'fortinet',
    ip_address: '',
    syslog_port: 514,
  });

  useEffect(() => { loadConnectors(); }, []);

  async function loadConnectors() {
    try {
      setConnectors(await fetchNetworkConnectors());
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  async function handleCreate() {
    try {
      await createNetworkConnector(newConnector);
      setShowCreate(false);
      setNewConnector({ name: '', device_type: 'fortinet', ip_address: '', syslog_port: 514 });
      loadConnectors();
    } catch (e: any) { setError(e.message); }
  }

  if (loading) return <div className="p-8 text-gray-400">Loading network connectors...</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Network Connectors</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          + Add Connector
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-300">{error}<button onClick={() => setError(null)} className="ml-2">✕</button></div>}

      {showCreate && (
        <div className="mb-6 p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <h3 className="text-white font-semibold mb-3">Add Network Connector</h3>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Connector name" value={newConnector.name} onChange={(e) => setNewConnector({ ...newConnector, name: e.target.value })} className="p-2 bg-gray-700 border border-gray-600 rounded text-white" />
            <select value={newConnector.device_type} onChange={(e) => setNewConnector({ ...newConnector, device_type: e.target.value })} className="p-2 bg-gray-700 border border-gray-600 rounded text-white">
              {DEVICE_TYPES.map((dt) => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
            </select>
            <input placeholder="IP Address" value={newConnector.ip_address} onChange={(e) => setNewConnector({ ...newConnector, ip_address: e.target.value })} className="p-2 bg-gray-700 border border-gray-600 rounded text-white" />
            <input type="number" placeholder="Syslog Port" value={newConnector.syslog_port} onChange={(e) => setNewConnector({ ...newConnector, syslog_port: Number(e.target.value) })} className="p-2 bg-gray-700 border border-gray-600 rounded text-white" />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleCreate} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Create</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {connectors.map((c) => (
          <div key={c.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-semibold">{c.name}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${c.enabled ? 'bg-green-900/50 text-green-300' : 'bg-gray-600 text-gray-400'}`}>
                {c.enabled ? 'Active' : 'Disabled'}
              </span>
            </div>
            <div className="text-sm text-gray-400 space-y-1">
              <div>Type: <span className="text-gray-300">{c.device_type}</span></div>
              <div>IP: <span className="text-gray-300">{c.ip_address}</span></div>
              <div>Port: <span className="text-gray-300">{c.syslog_port}/{c.syslog_protocol}</span></div>
              <div>Alerts: <span className="text-gray-300">{c.alert_count}</span></div>
              {c.last_seen_at && <div>Last seen: <span className="text-gray-300">{new Date(c.last_seen_at).toLocaleString()}</span></div>}
            </div>
          </div>
        ))}
        {connectors.length === 0 && <div className="col-span-3 text-center text-gray-500 py-8">No network connectors configured</div>}
      </div>
    </div>
  );
}
