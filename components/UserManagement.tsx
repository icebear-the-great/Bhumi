import React, { useState } from 'react';
import { User } from '../types';
import { ICONS } from '../constants';

interface UserManagementProps {
  currentUser: User;
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUserStatus: (id: string, status: 'Active' | 'Inactive') => void;
  onResetPassword: (id: string) => void;
  roles: string[];
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser, users, onAddUser, onUpdateUserStatus, onResetPassword, roles }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: roles[0] || 'Contributor', password: '' });
  
  // State for confirmation modal
  const [resetConfirmationUser, setResetConfirmationUser] = useState<User | null>(null);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddUser({
      id: Math.random().toString(36).substr(2, 9),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: 'Active',
      password: newUser.password || 'welcome123'
    });
    setNewUser({ name: '', email: '', role: roles[0] || 'Contributor', password: '' });
    setShowAddModal(false);
  };

  const handleResetClick = (user: User) => {
      setResetConfirmationUser(user);
  };

  const confirmResetPassword = () => {
      if (resetConfirmationUser) {
          onResetPassword(resetConfirmationUser.id);
          setResetConfirmationUser(null);
      }
  };

  const isAdmin = currentUser.role === 'Marketing Lead';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-lg font-bold text-bhumi-900">Team Members</h2>
            <p className="text-sand-500 text-sm">Manage access and roles for the BhūmiHub platform.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-bhumi-600 text-white px-4 py-2 rounded-lg hover:bg-bhumi-700 shadow-sm transition-all"
        >
          {ICONS.Add} Add Member
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-sand-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-sand-600">
            <thead className="bg-sand-50 text-sand-500 font-medium border-b border-sand-200">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-sand-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-sand-200 text-sand-600 flex items-center justify-center font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-bhumi-900">{user.name}</div>
                        <div className="text-xs text-sand-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-sand-100 rounded text-sand-700 text-xs font-medium">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.status === 'Active' 
                        ? 'bg-bhumi-50 text-bhumi-700 border border-bhumi-100' 
                        : 'bg-stone-100 text-stone-600 border border-stone-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        user.status === 'Active' ? 'bg-bhumi-500' : 'bg-stone-400'
                      }`}></span>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                        {isAdmin && (
                            <button 
                                onClick={() => handleResetClick(user)}
                                className="text-sand-400 hover:text-bhumi-600 px-3 py-1 rounded hover:bg-sand-100 transition-all text-xs flex items-center gap-1"
                                title="Reset to default password"
                            >
                                {ICONS.Lock} Reset
                            </button>
                        )}
                        <button 
                            onClick={() => onUpdateUserStatus(user.id, user.status === 'Active' ? 'Inactive' : 'Active')}
                            className={`px-3 py-1 rounded hover:bg-sand-100 transition-all text-xs border ${
                                user.status === 'Active' 
                                ? 'text-sand-400 hover:text-red-600 border-transparent hover:border-red-100' 
                                : 'text-bhumi-600 border-bhumi-200 bg-bhumi-50'
                            }`}
                        >
                            {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {resetConfirmationUser && (
        <div className="fixed inset-0 bg-bhumi-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-sand-200 overflow-hidden animate-fade-in-up">
             <div className="p-6 text-center">
                <div className="w-12 h-12 bg-terra-100 text-terra-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    {ICONS.Alert}
                </div>
                <h3 className="font-bold text-lg text-bhumi-900 mb-2">Reset Password?</h3>
                <p className="text-sand-600 text-sm mb-6">
                    Are you sure you want to reset the password for <span className="font-semibold text-bhumi-900">{resetConfirmationUser.name}</span>? 
                    <br/><br/>It will be reset to <code className="bg-sand-100 px-1 py-0.5 rounded text-xs">welcome123</code>.
                </p>
                <div className="flex gap-3 justify-center">
                    <button 
                        onClick={() => setResetConfirmationUser(null)}
                        className="px-4 py-2 text-sand-600 hover:bg-sand-100 rounded-lg text-sm font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmResetPassword}
                        className="px-4 py-2 bg-bhumi-600 text-white rounded-lg hover:bg-bhumi-700 text-sm font-medium shadow-sm transition-colors"
                    >
                        Yes, Reset Password
                    </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-bhumi-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-sand-200 overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-sand-200 flex justify-between items-center bg-sand-50">
              <h3 className="font-bold text-bhumi-900">Add New Team Member</h3>
              <button onClick={() => setShowAddModal(false)} className="text-sand-400 hover:text-stone-600">
                {ICONS.Close}
              </button>
            </div>
            <div className="p-6">
                <form onSubmit={handleAddSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-sand-700 mb-1">Full Name</label>
                        <input 
                            required
                            type="text"
                            value={newUser.name}
                            onChange={e => setNewUser({...newUser, name: e.target.value})}
                            className="w-full border border-sand-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-bhumi-500 outline-none"
                            placeholder="Jane Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-sand-700 mb-1">Email Address</label>
                        <input 
                            required
                            type="email"
                            value={newUser.email}
                            onChange={e => setNewUser({...newUser, email: e.target.value})}
                            className="w-full border border-sand-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-bhumi-500 outline-none"
                            placeholder="jane@bhumi.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-sand-700 mb-1">Password</label>
                        <input 
                            required
                            type="password"
                            value={newUser.password}
                            onChange={e => setNewUser({...newUser, password: e.target.value})}
                            className="w-full border border-sand-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-bhumi-500 outline-none"
                            placeholder="Create a password"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-sand-700 mb-1">Role</label>
                        <select 
                            value={newUser.role}
                            onChange={e => setNewUser({...newUser, role: e.target.value})}
                            className="w-full border border-sand-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-bhumi-500 outline-none bg-white"
                        >
                            {roles.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>
                    <div className="pt-2 flex justify-end gap-2">
                        <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sand-600 hover:bg-sand-100 rounded-lg text-sm">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-bhumi-600 text-white rounded-lg hover:bg-bhumi-700 text-sm font-medium">Add Member</button>
                    </div>
                </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;