import { useState } from 'react';
import { Plus, Pencil, Trash2, Shield, User as UserIcon, Search, Users as UsersIcon } from 'lucide-react';
import Modal from '@/components/common/Modal';
import EmptyState from '@/components/common/EmptyState';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  status: 'active' | 'inactive';
  lastLogin: string;
  createdAt: string;
}

// Demo users for MVP
const DEMO_USERS: User[] = [
  { id: '1', name: 'Dev User', email: 'dev@omnitrack.io', role: 'admin', status: 'active', lastLogin: new Date().toISOString(), createdAt: '2025-01-15T10:00:00Z' },
  { id: '2', name: 'Sarah Chen', email: 'sarah@omnitrack.io', role: 'operator', status: 'active', lastLogin: '2026-04-07T14:30:00Z', createdAt: '2025-03-01T10:00:00Z' },
  { id: '3', name: 'Mike Johnson', email: 'mike@omnitrack.io', role: 'viewer', status: 'active', lastLogin: '2026-04-06T09:15:00Z', createdAt: '2025-06-15T10:00:00Z' },
  { id: '4', name: 'Lisa Wang', email: 'lisa@omnitrack.io', role: 'operator', status: 'inactive', lastLogin: '2026-03-20T11:00:00Z', createdAt: '2025-08-20T10:00:00Z' },
  { id: '5', name: 'Tom Davis', email: 'tom@omnitrack.io', role: 'viewer', status: 'active', lastLogin: '2026-04-08T08:45:00Z', createdAt: '2025-11-10T10:00:00Z' },
];

const roleConfig = {
  admin: { color: 'bg-purple-100 text-purple-700', label: 'Admin', permissions: 'Full system access' },
  operator: { color: 'bg-blue-100 text-blue-700', label: 'Operator', permissions: 'Asset management, alerts' },
  viewer: { color: 'bg-gray-100 text-gray-600', label: 'Viewer', permissions: 'Read-only access' },
};

export default function Users() {
  const [users, setUsers] = useState<User[]>(DEMO_USERS);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'viewer' as User['role'], status: 'active' as User['status'] });

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingUser(null);
    setForm({ name: '', email: '', role: 'viewer', status: 'active' });
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, role: user.role, status: user.status });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.email) {
      toast.error('Name and email are required');
      return;
    }
    if (editingUser) {
      setUsers((prev) => prev.map((u) => u.id === editingUser.id ? { ...u, ...form } : u));
      toast.success('User updated');
    } else {
      const newUser: User = {
        id: crypto.randomUUID(),
        ...form,
        lastLogin: 'Never',
        createdAt: new Date().toISOString(),
      };
      setUsers((prev) => [...prev, newUser]);
      toast.success('User created');
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setDeleteConfirm(null);
    toast.success('User deleted');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 w-64"
            />
          </div>
          <span className="text-sm text-gray-500">{filtered.length} users</span>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" /> Add User
        </button>
      </div>

      {/* Role permissions info */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Object.entries(roleConfig).map(([key, config]) => (
          <div key={key} className="card card-body flex items-center gap-3">
            <Shield className="h-5 w-5 text-gray-400" />
            <div>
              <span className={clsx('badge', config.color)}>{config.label}</span>
              <p className="mt-1 text-xs text-gray-500">{config.permissions}</p>
            </div>
          </div>
        ))}
      </div>

      {/* User table */}
      {filtered.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No users found" description="Try adjusting your search or add a new user" action={{ label: 'Add User', onClick: openCreate }} />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                          <UserIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={clsx('badge', roleConfig[user.role].color)}>{roleConfig[user.role].label}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className={clsx('h-2 w-2 rounded-full', user.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400')} />
                        <span className="text-xs capitalize">{user.status}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">
                      {user.lastLogin === 'Never' ? 'Never' : new Date(user.lastLogin).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(user)} className="btn-ghost p-1.5 rounded" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        {deleteConfirm === user.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(user.id)} className="btn-danger text-[10px] py-1 px-2">Delete</button>
                            <button onClick={() => setDeleteConfirm(null)} className="btn-ghost text-[10px] py-1 px-2">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(user.id)} className="btn-ghost p-1.5 rounded text-red-500 hover:bg-red-50" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingUser ? 'Edit User' : 'Create User'}>
        <div className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input type="text" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@omnitrack.io" />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as User['role'] })}>
              <option value="admin">Admin</option>
              <option value="operator">Operator</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as User['status'] })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} className="btn-primary">{editingUser ? 'Save Changes' : 'Create User'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
