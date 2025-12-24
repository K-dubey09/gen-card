// Role-Based Access Control Middleware

// Define permissions for each role
const permissions = {
  user: [
    'cards:read',
    'cards:create',
    'roadmap:read',
    'roadmap:create',
    'session:read',
    'session:create',
    'session:update',
    'session:delete',
    'document:read',
    'document:create',
    'document:update',
    'document:delete',
    'profile:read',
    'profile:update'
  ],
  editor: [
    'cards:read',
    'cards:create',
    'cards:update',
    'roadmap:read',
    'roadmap:create',
    'roadmap:update',
    'session:read',
    'session:create',
    'session:update',
    'session:delete',
    'document:read',
    'document:create',
    'document:update',
    'document:delete',
    'users:read',
    'profile:read',
    'profile:update'
  ],
  admin: [
    'cards:read',
    'cards:create',
    'cards:update',
    'cards:delete',
    'roadmap:read',
    'roadmap:create',
    'roadmap:update',
    'roadmap:delete',
    'session:read',
    'session:create',
    'session:update',
    'session:delete',
    'document:read',
    'document:create',
    'document:update',
    'document:delete',
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
    'users:manage',
    'profile:read',
    'profile:update',
    'analytics:read',
    'system:manage'
  ]
};

// Check if user has required role
const hasRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const userRole = req.user.role;
    if (roles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({ 
      error: 'Access denied. Insufficient permissions.',
      requiredRole: roles 
    });
  };
};

// Check if user has specific permission
const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const userRole = req.user.role;
    const rolePermissions = permissions[userRole] || [];

    if (rolePermissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({ 
      error: 'Access denied. Insufficient permissions.',
      requiredPermission: permission 
    });
  };
};

// Check if user is admin
const isAdmin = hasRole(['admin']);

// Check if user is admin or editor
const isAdminOrEditor = hasRole(['admin', 'editor']);

// Check resource ownership or admin
const isOwnerOrAdmin = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admins can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.resource?.[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (resourceUserId && resourceUserId.toString() === req.user.id) {
      return next();
    }

    return res.status(403).json({ 
      error: 'Access denied. You can only access your own resources.' 
    });
  };
};

module.exports = {
  hasRole,
  hasPermission,
  isAdmin,
  isAdminOrEditor,
  isOwnerOrAdmin,
  permissions
};
