import React, { useState, useEffect } from 'react';
import { Shield, Users, Plus, Edit, Trash2, Eye, EyeOff, Search, Lock, Unlock, Mail } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'analyst' | 'viewer' | 'api_only';
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  mfa_enabled: boolean;
  permissions: string[];
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    role: 'analyst' as const,
    permissions: [] as string[]
  });

  const permissions: Permission[] = [
    { id: 'read_alerts', name: 'Read Alerts', description: 'View alerts and their details', category: 'Alerts' },
    { id: 'write_alerts', name: 'Manage Alerts', description: 'Create, update, and delete alerts', category: 'Alerts' },
    { id: 'read_cases', name: 'Read Cases', description: 'View cases and their details', category: 'Cases' },
    { id: 'write_cases', name: 'Manage Cases', description: 'Create, update, and delete cases', category: 'Cases' },
    { id: 'execute_actions', name: 'Execute Actions', description: 'Trigger active response actions', category: 'Actions' },
    { id: 'manage_connectors', name: 'Manage Connectors', description: 'Configure and manage integrations', category: 'System' },
    { id: 'view_dashboard', name: 'View Dashboard', description: 'Access dashboard and metrics', category: 'System' },
    { id: 'manage_users', name: 'Manage Users', description: 'Create and manage user accounts', category: 'Administration' },
    { id: 'view_audit', name: 'View Audit Logs', description: 'Access audit trail and logs', category: 'Administration' },
    { id: 'ai_triage', name: 'AI Triage', description: 'Use AI for alert triage and analysis', category: 'AI' },
    { id: 'ai_chat', name: 'AI Chat', description: 'Interact with AI assistant', category: 'AI' },
    { id: 'threat_intel', name: 'Threat Intelligence', description: 'Access threat intelligence feeds', category: 'Intelligence' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Mock data for demonstration
      const mockUsers: User[] = [
        {
          id: '1',
          username: 'admin',
          email: 'admin@shieldgrid.io',
          full_name: 'System Administrator',
          role: 'admin',
          is_active: true,
          last_login: '2024-01-20T10:30:00Z',
          created_at: '2024-01-01T00:00:00Z',
          mfa_enabled: true,
          permissions: permissions.map(p => p.id)
        },
        {
          id: '2',
          username: 'analyst1',
          email: 'analyst1@shieldgrid.io',
          full_name: 'Security Analyst',
          role: 'analyst',
          is_active: true,
          last_login: '2024-01-19T14:20:00Z',
          created_at: '2024-01-10T08:00:00Z',
          mfa_enabled: false,
          permissions: ['read_alerts', 'write_alerts', 'read_cases', 'write_cases', 'execute_actions', 'view_dashboard', 'ai_triage', 'ai_chat', 'threat_intel']
        },
        {
          id: '3',
          username: 'viewer',
          email: 'viewer@shieldgrid.io',
          full_name: 'Read Only User',
          role: 'viewer',
          is_active: true,
          last_login: '2024-01-18T09:15:00Z',
          created_at: '2024-01-15T12:00:00Z',
          mfa_enabled: false,
          permissions: ['read_alerts', 'read_cases', 'view_dashboard']
        },
        {
          id: '4',
          username: 'api_service',
          email: 'api@shieldgrid.io',
          full_name: 'API Service Account',
          role: 'api_only',
          is_active: true,
          last_login: '2024-01-20T12:00:00Z',
          created_at: '2024-01-05T16:00:00Z',
          mfa_enabled: false,
          permissions: ['read_alerts', 'read_cases']
        }
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-400';
      case 'analyst': return 'bg-blue-500/20 text-blue-400';
      case 'viewer': return 'bg-emerald-500/20 text-emerald-400';
      case 'api_only': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-[var(--sys-bg-elevated)] text-gray-300';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[var(--sys-bg-elevated)] text-gray-300';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCreateUser = async () => {
    try {
      // Mock API call
      const user: User = {
        id: Date.now().toString(),
        username: newUser.username,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        is_active: true,
        last_login: null,
        created_at: new Date().toISOString(),
        mfa_enabled: false,
        permissions: newUser.permissions
      };
      setUsers([...users, user]);
      setShowAddModal(false);
      setNewUser({ username: '', email: '', full_name: '', password: '', role: 'analyst', permissions: [] });
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      // Mock API call
      setUsers(users.map(user => user.id === userId ? { ...user, ...updates } : user));
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        // Mock API call
        setUsers(users.filter(user => user.id !== userId));
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  const toggleUserStatus = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      handleUpdateUser(userId, { is_active: !user.is_active });
    }
  };

  const getPermissionCategories = () => {
    const categories: Record<string, Permission[]> = {};
    permissions.forEach(perm => {
      if (!categories[perm.category]) {
        categories[perm.category] = [];
      }
      categories[perm.category].push(perm);
    });
    return categories;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--sys-text-primary)] flex items-center">
          <Users className="mr-2 text-blue-500" />
          User Management
        </h1>
        <p className="text-[var(--sys-text-muted)] mt-1">Manage user accounts, roles, and permissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[var(--sys-bg-surface)] p-4 rounded-lg border border-[var(--sys-border)]">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-[var(--sys-text-muted)]">Total Users</p>
              <p className="text-lg font-semibold text-[var(--sys-text-primary)]">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--sys-bg-surface)] p-4 rounded-lg border border-[var(--sys-border)]">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-[var(--sys-text-muted)]">Admins</p>
              <p className="text-lg font-semibold text-[var(--sys-text-primary)]">{users.filter(u => u.role === 'admin').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--sys-bg-surface)] p-4 rounded-lg border border-[var(--sys-border)]">
          <div className="flex items-center">
            <Lock className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-[var(--sys-text-muted)]">MFA Enabled</p>
              <p className="text-lg font-semibold text-[var(--sys-text-primary)]">{users.filter(u => u.mfa_enabled).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--sys-bg-surface)] p-4 rounded-lg border border-[var(--sys-border)]">
          <div className="flex items-center">
            <Mail className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-[var(--sys-text-muted)]">Active</p>
              <p className="text-lg font-semibold text-[var(--sys-text-primary)]">{users.filter(u => u.is_active).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--sys-text-muted)] h-4 w-4" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border border-[var(--sys-border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            className="px-4 py-2 border border-[var(--sys-border)] rounded-lg focus:ring-2 focus:ring-blue-500"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="analyst">Analyst</option>
            <option value="viewer">Viewer</option>
            <option value="api_only">API Only</option>
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-500 text-[var(--sys-text-primary)] rounded-lg hover:bg-blue-600 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[var(--sys-bg-surface)] rounded-lg border border-[var(--sys-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--sys-border)]">
            <thead className="bg-[var(--sys-bg-base)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--sys-text-muted)] uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--sys-text-muted)] uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--sys-text-muted)] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--sys-text-muted)] uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--sys-text-muted)] uppercase tracking-wider">
                  MFA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--sys-text-muted)] uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[var(--sys-text-muted)] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-[var(--sys-bg-surface)] divide-y divide-[var(--sys-border)]">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[var(--sys-bg-base)]">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-[var(--sys-border)] flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-300">
                            {user.full_name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-[var(--sys-text-primary)]">{user.full_name}</div>
                        <div className="text-sm text-[var(--sys-text-muted)]">{user.email}</div>
                        <div className="text-xs text-[var(--sys-text-muted)]">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.is_active)}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--sys-text-muted)]">
                    {user.last_login ? formatDate(user.last_login) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.mfa_enabled ? (
                      <Lock className="h-4 w-4 text-green-500" />
                    ) : (
                      <Unlock className="h-4 w-4 text-[var(--sys-text-muted)]" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--sys-text-muted)]">
                    {user.permissions.length} permissions
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        {user.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--sys-bg-surface)] rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Username</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-[var(--sys-border)] rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-[var(--sys-border)] rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Full Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-[var(--sys-border)] rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Password</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-[var(--sys-border)] rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Role</label>
                <select
                  className="w-full px-3 py-2 border border-[var(--sys-border)] rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                >
                  <option value="admin">Admin</option>
                  <option value="analyst">Analyst</option>
                  <option value="viewer">Viewer</option>
                  <option value="api_only">API Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Permissions</label>
                <div className="max-h-40 overflow-y-auto border border-[var(--sys-border)] rounded-lg p-2">
                  {Object.entries(getPermissionCategories()).map(([category, perms]) => (
                    <div key={category} className="mb-2">
                      <div className="text-xs font-semibold text-[var(--sys-text-muted)] uppercase mb-1">{category}</div>
                      {perms.map(perm => (
                        <label key={perm.id} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={newUser.permissions.includes(perm.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewUser({ ...newUser, permissions: [...newUser.permissions, perm.id] });
                              } else {
                                setNewUser({ ...newUser, permissions: newUser.permissions.filter(p => p !== perm.id) });
                              }
                            }}
                            className="rounded border-[var(--sys-border)]"
                          />
                          <span>{perm.name}</span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-[var(--sys-text-muted)] hover:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 bg-blue-500 text-[var(--sys-text-primary)] rounded-lg hover:bg-blue-600"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--sys-bg-surface)] rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Username</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-[var(--sys-border)] rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={selectedUser.username}
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-[var(--sys-border)] rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Full Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-[var(--sys-border)] rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={selectedUser.full_name}
                  onChange={(e) => setSelectedUser({ ...selectedUser, full_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Role</label>
                <select
                  className="w-full px-3 py-2 border border-[var(--sys-border)] rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={selectedUser.role}
                  onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value as any })}
                >
                  <option value="admin">Admin</option>
                  <option value="analyst">Analyst</option>
                  <option value="viewer">Viewer</option>
                  <option value="api_only">API Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Status</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedUser.is_active}
                    onChange={(e) => setSelectedUser({ ...selectedUser, is_active: e.target.checked })}
                    className="rounded border-[var(--sys-border)]"
                  />
                  <span className="text-sm text-gray-300">Active</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">MFA Enabled</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedUser.mfa_enabled}
                    onChange={(e) => setSelectedUser({ ...selectedUser, mfa_enabled: e.target.checked })}
                    className="rounded border-[var(--sys-border)]"
                  />
                  <span className="text-sm text-gray-300">Enable Multi-Factor Authentication</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-[var(--sys-text-muted)] hover:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateUser(selectedUser.id, selectedUser)}
                className="px-4 py-2 bg-blue-500 text-[var(--sys-text-primary)] rounded-lg hover:bg-blue-600"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;