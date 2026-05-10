import { useState, useEffect } from 'react';
import { getToken } from '../api/client';
import { decodeJwt, hasPermission } from '../lib/rbac';

export function usePermissions() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = getToken();
    if (token) {
      const decoded = decodeJwt(token);
      setUser(decoded);
    }
  }, []);

  const canAccess = (permissionOrPath) => {
    if (!user) return false;
    
    // Admin always has access
    if (user.roles && user.roles.some(r => r.name === 'admin')) return true;

    // For now, if it's a generic path string that isn't a specific permission, allow it
    // In a real app, map paths to specific permissions
    if (permissionOrPath.startsWith('/')) return true;
    
    return hasPermission(user, permissionOrPath);
  };

  return { canAccess, user };
}
