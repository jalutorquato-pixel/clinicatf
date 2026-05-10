/**
 * Decodifica o payload de um JWT sem verificar a assinatura.
 * Funciona tanto no Node.js quanto no Edge Runtime.
 */
export function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = atob(base64);
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

/**
 * Verifica se um usuário possui uma permissão específica baseada em seus papéis.
 * @param {Object} user - Objeto do usuário vindo da sessão/JWT
 * @param {string} permissionName - Nome da permissão (ex: 'finance:view')
 */
export function hasPermission(user, permissionName) {
  if (!user || !user.roles) return false;
  
  // Admin tem passe livre
  if (user.roles.some(role => role.name === 'admin')) return true;

  return user.roles.some(role => 
    role.permissions?.some(p => p.name === permissionName)
  );
}

export const PERMISSIONS = {
  ADMIN_ACCESS: 'admin:access',
  USERS_MANAGE: 'users:manage',
  FINANCE_VIEW: 'finance:view',
  CLIENTS_VIEW: 'clients:view',
  CLIENTS_EDIT: 'clients:edit',
};