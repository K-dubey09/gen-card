import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      window.location.href = '/dashboard';
    }
  }, [user]);

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/stats', {
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        setStats(data.stats);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/users', {
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch sessions
  const fetchSessions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/sessions', {
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        setSessions(data.sessions);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch documents
  const fetchDocuments = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/documents', {
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        setDocuments(data.documents);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/analytics?days=30', {
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        setAnalytics(data);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'dashboard') {
          await fetchStats();
        } else if (activeTab === 'users') {
          await fetchUsers();
        } else if (activeTab === 'sessions') {
          await fetchSessions();
        } else if (activeTab === 'documents') {
          await fetchDocuments();
        } else if (activeTab === 'analytics') {
          await fetchAnalytics();
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab]);

  // Update user role
  const updateUserRole = async (userId, newRole) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        alert('User role updated successfully');
        fetchUsers();
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Toggle user active status
  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        alert('User status updated successfully');
        fetchUsers();
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Add credits to user
  const addCredits = async (userId) => {
    const amount = prompt('Enter credits amount to add:');
    if (!amount || isNaN(amount) || amount <= 0) {
      alert('Invalid amount');
      return;
    }

    const reason = prompt('Enter reason (optional):') || 'Admin credit grant';

    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount: parseInt(amount), reason })
      });

      if (response.ok) {
        alert('Credits added successfully');
        fetchUsers();
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete user
  const deleteUser = async (userId, username) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This will delete all their data.`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        alert('User deleted successfully');
        fetchUsers();
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading admin panel...</div>;
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>🛡️ Admin Panel</h1>
        <p>Welcome, {user?.username}</p>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-tabs">
        <button
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button
          className={activeTab === 'sessions' ? 'active' : ''}
          onClick={() => setActiveTab('sessions')}
        >
          📚 Sessions
        </button>
        <button
          className={activeTab === 'documents' ? 'active' : ''}
          onClick={() => setActiveTab('documents')}
        >
          📄 Documents
        </button>
        <button
          className={activeTab === 'analytics' ? 'active' : ''}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analytics
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'dashboard' && stats && (
          <div className="dashboard-stats">
            <h2>System Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>{stats.users.total}</h3>
                <p>Total Users</p>
                <small>{stats.users.active} active</small>
              </div>
              <div className="stat-card">
                <h3>{stats.sessions}</h3>
                <p>Total Sessions</p>
              </div>
              <div className="stat-card">
                <h3>{stats.documents}</h3>
                <p>Total Documents</p>
              </div>
              <div className="stat-card">
                <h3>{stats.credits.total}</h3>
                <p>Credits Distributed</p>
                <small>Avg: {stats.credits.average}</small>
              </div>
            </div>

            <div className="role-distribution">
              <h3>Role Distribution</h3>
              {stats.roles.map(role => (
                <div key={role._id} className="role-item">
                  <span>{role._id}:</span>
                  <strong>{role.count}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-management">
            <div className="users-header">
              <h2>User Management</h2>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <table className="users-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Credits</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter(u =>
                    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.email.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(u => (
                    <tr key={u._id}>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>
                        <select
                          value={u.role}
                          onChange={(e) => updateUserRole(u._id, e.target.value)}
                          className="role-select"
                        >
                          <option value="user">User</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>
                        {u.credits}
                        <button onClick={() => addCredits(u._id)} className="btn-small">+</button>
                      </td>
                      <td>
                        <span className={`status ${u.isActive ? 'active' : 'inactive'}`}>
                          {u.isActive ? '✓ Active' : '✗ Inactive'}
                        </span>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="actions">
                        <button
                          onClick={() => toggleUserStatus(u._id, u.isActive)}
                          className="btn-action"
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => deleteUser(u._id, u.username)}
                          className="btn-danger"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="sessions-management">
            <h2>All Sessions</h2>
            <table className="sessions-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>User</th>
                  <th>Topic</th>
                  <th>Cards</th>
                  <th>Views</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s._id}>
                    <td>{s.title}</td>
                    <td>{s.userId?.username || 'Unknown'}</td>
                    <td>{s.topic}</td>
                    <td>{s.cards?.length || 0}</td>
                    <td>{s.viewCount || 0}</td>
                    <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="documents-management">
            <h2>All Documents</h2>
            <table className="documents-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>User</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(d => (
                  <tr key={d._id}>
                    <td>{d.originalName}</td>
                    <td>{d.userId?.username || 'Unknown'}</td>
                    <td>{d.fileType}</td>
                    <td>{(d.fileSize / 1024).toFixed(2)} KB</td>
                    <td>{new Date(d.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'analytics' && analytics && (
          <div className="analytics-view">
            <h2>System Analytics (Last 30 Days)</h2>
            
            <div className="analytics-section">
              <h3>New Users</h3>
              <div className="chart-placeholder">
                {analytics.newUsers.map(item => (
                  <div key={item._id} className="chart-bar">
                    <span>{item._id}</span>
                    <div className="bar" style={{ width: `${item.count * 20}px` }}></div>
                    <span>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="analytics-section">
              <h3>Most Active Users</h3>
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.activeUsers.map(u => (
                    <tr key={u._id}>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>{u.sessionCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
