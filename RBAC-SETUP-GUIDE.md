# 🛡️ RBAC & Admin Panel Setup Guide

## Overview

This application now includes:
- **Role-Based Access Control (RBAC)** with 3 roles: `user`, `editor`, `admin`
- **Admin Panel** for system management
- **MongoDB Collections** with proper indexes
- **Permission System** for fine-grained access control

---

## 🚀 Quick Setup

### 1. Initialize MongoDB Database

```bash
cd backend
node init-db.js
```

This will:
- Create all MongoDB collections
- Set up indexes for optimal performance
- Create default admin user

### 2. Default Admin Credentials

```
Email: admin@cardmaker.com
Password: admin123
```

**⚠️ IMPORTANT: Change this password immediately in production!**

---

## 👥 User Roles & Permissions

### User Role (Default)
- ✅ Create and manage own cards
- ✅ Generate roadmaps
- ✅ Save sessions
- ✅ Upload documents
- ✅ View own data
- ❌ No admin access

### Editor Role (Future)
- ✅ All user permissions
- ✅ View all users (read-only)
- ✅ Update cards and roadmaps
- ❌ Cannot manage users
- ❌ No system settings access

### Admin Role
- ✅ Full system access
- ✅ User management (create, update, delete)
- ✅ View all sessions and documents
- ✅ System analytics
- ✅ Credit management
- ✅ Role assignment

---

## 🔒 RBAC Middleware Usage

### In Backend Routes

```javascript
const { isAdmin, isAdminOrEditor, hasPermission, hasRole } = require('../middleware/rbac');

// Admin only route
router.get('/admin/users', isAuthenticated, isAdmin, async (req, res) => {
  // Admin logic
});

// Admin or Editor route
router.put('/cards/:id', isAuthenticated, isAdminOrEditor, async (req, res) => {
  // Edit logic
});

// Permission-based route
router.post('/sessions', isAuthenticated, hasPermission('session:create'), async (req, res) => {
  // Create session logic
});

// Custom role check
router.get('/special', isAuthenticated, hasRole(['admin', 'editor']), async (req, res) => {
  // Special logic
});
```

### Available Permissions

**User Permissions:**
- `cards:read`, `cards:create`
- `session:read`, `session:create`, `session:update`, `session:delete`
- `document:read`, `document:create`, `document:update`, `document:delete`
- `profile:read`, `profile:update`

**Editor Permissions:** (All user permissions +)
- `cards:update`
- `roadmap:update`
- `users:read`

**Admin Permissions:** (All editor permissions +)
- `cards:delete`, `roadmap:delete`
- `users:create`, `users:update`, `users:delete`, `users:manage`
- `analytics:read`
- `system:manage`

---

## 🎛️ Admin Panel Features

### Access Admin Panel
- Navigate to: `http://localhost:5173/admin`
- Only visible to users with `admin` role
- Auto-redirects non-admins to dashboard

### Dashboard Tab
- **System Statistics**: Total users, sessions, documents, credits
- **Role Distribution**: User count by role
- **Recent Activity**: Latest users and sessions

### Users Tab
- **View All Users**: Paginated user list with search
- **Role Management**: Change user roles (user/editor/admin)
- **Account Status**: Activate/deactivate accounts
- **Credit Management**: Add/subtract credits
- **User Deletion**: Remove users and their data

### Sessions Tab
- **View All Sessions**: See all card generation sessions
- **Session Details**: View cards, topics, usage stats
- **Session Management**: Monitor user activity

### Documents Tab
- **View All Documents**: See all uploaded files
- **File Information**: Size, type, upload date
- **User Tracking**: See who uploaded what

### Analytics Tab
- **User Growth**: New users over time
- **Session Activity**: Daily session creation trends
- **Active Users**: Top users by session count
- **Usage Patterns**: 30-day analytics

---

## 📊 MongoDB Collections

### Users Collection
```javascript
{
  username: String (unique, indexed),
  email: String (unique, indexed),
  password: String (hashed),
  credits: Number (default: 10),
  role: String (enum: ['user', 'editor', 'admin']),
  isActive: Boolean (default: true),
  lastLogin: Date,
  avatar: String,
  preferences: Object,
  createdAt: Date,
  updatedAt: Date
}
```

### Sessions Collection
```javascript
{
  userId: ObjectId (ref: User, indexed),
  title: String (text index),
  topic: String (text index),
  cards: Array,
  roadmap: Mixed,
  sourceType: String,
  tags: Array (text index),
  isFavorite: Boolean,
  viewCount: Number,
  createdAt: Date (indexed),
  updatedAt: Date
}
```

### Documents Collection
```javascript
{
  userId: ObjectId (ref: User, indexed),
  fileName: String,
  originalName: String (text index),
  fileType: String,
  fileSize: Number,
  filePath: String,
  description: String (text index),
  tags: Array (text index),
  category: String,
  isProcessed: Boolean,
  sessionCount: Number,
  createdAt: Date (indexed),
  updatedAt: Date
}
```

### Transactions Collection
```javascript
{
  userId: ObjectId (ref: User, indexed),
  type: String (enum: ['credit_purchase', 'credit_usage', 'refund']),
  amount: Number,
  credits: Number,
  paymentId: String,
  status: String (enum: ['pending', 'completed', 'failed']),
  metadata: Mixed,
  createdAt: Date (indexed),
  updatedAt: Date
}
```

---

## 🔧 API Endpoints

### Admin Routes (`/api/admin`)

**Dashboard**
- `GET /stats` - System statistics (admin only)

**User Management**
- `GET /users` - List all users with filtering (admin only)
- `GET /users/:id` - Get user details (admin only)
- `PUT /users/:id` - Update user role/credits/status (admin only)
- `DELETE /users/:id` - Delete user and data (admin only)
- `POST /users/:id/credits` - Add credits to user (admin only)

**Session Management**
- `GET /sessions` - List all sessions (admin only)
- `DELETE /sessions/:id` - Delete any session (admin only)

**Document Management**
- `GET /documents` - List all documents (admin only)

**Analytics**
- `GET /analytics?days=30` - System analytics (admin only)

---

## 🛠️ Development Tasks

### Adding New Role (e.g., "moderator")

1. **Update User Model** (`backend/models/mongodb/User.js`):
```javascript
role: {
  type: String,
  enum: ['user', 'editor', 'moderator', 'admin'],
  default: 'user'
}
```

2. **Update RBAC Middleware** (`backend/middleware/rbac.js`):
```javascript
const permissions = {
  // ...existing permissions
  moderator: [
    'cards:read',
    'cards:create',
    'users:read',
    'sessions:moderate',
    // Add specific permissions
  ]
};
```

3. **Update Admin Panel** (`frontend/src/pages/AdminPanel.jsx`):
```javascript
<option value="moderator">Moderator</option>
```

### Protecting New Routes

```javascript
// Example: Create protected route
router.post('/api/special-feature', 
  isAuthenticated, 
  hasPermission('feature:access'), 
  async (req, res) => {
    // Your logic
  }
);
```

---

## 🔐 Security Best Practices

1. **Change Default Admin Password**
   - Login with admin credentials
   - Go to profile settings
   - Change password immediately

2. **Environment Variables**
   ```env
   SESSION_SECRET=your-strong-secret-key
   MONGODB_URI=mongodb://localhost:27017/Card-Maker
   ```

3. **Password Requirements**
   - Minimum 6 characters (increase in production)
   - Consider adding complexity requirements

4. **Rate Limiting** (Recommended)
   ```bash
   npm install express-rate-limit
   ```

5. **HTTPS in Production**
   - Always use HTTPS
   - Set secure cookies

---

## 📝 Testing RBAC

### Test Admin Access
```bash
# Login as admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cardmaker.com","password":"admin123"}'

# Access admin endpoint
curl http://localhost:5000/api/admin/stats \
  --cookie "connect.sid=YOUR_SESSION_COOKIE"
```

### Test Regular User
```bash
# Try admin endpoint with regular user (should fail)
curl http://localhost:5000/api/admin/stats \
  --cookie "connect.sid=USER_SESSION_COOKIE"
# Expected: 403 Forbidden
```

---

## 🐛 Troubleshooting

### Issue: Admin user not created
```bash
# Manually create admin
node backend/init-db.js
```

### Issue: Permissions not working
- Check user role in MongoDB Compass
- Verify middleware order in routes
- Check session authentication

### Issue: Cannot access admin panel
- Verify user role is 'admin'
- Check browser console for errors
- Verify API calls in Network tab

---

## 📚 Resources

- **MongoDB Compass**: Visual database explorer
- **RBAC Documentation**: See `backend/middleware/rbac.js`
- **Admin API**: See `backend/routes/admin.js`
- **Frontend Admin**: See `frontend/src/pages/AdminPanel.jsx`

---

**Made with ❤️ for secure and scalable applications**
