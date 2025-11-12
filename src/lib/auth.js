import { supabase } from './supabase.js';

/**
 * Auth context and helper functions
 */

// Check if user is authenticated
export const isAuthenticated = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('[Auth] Session check error:', error);
    return false;
  }
  return !!session;
};

// Get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('[Auth] Get user error:', error);
    return null;
  }
  return user;
};

// Listen to auth state changes
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    console.log('[Auth] State change:', event, session?.user?.id);
    callback(event, session);
  });
};

// Protected route helper
export const requireAuth = async () => {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    console.warn('[Auth] Authentication required');
    window.location.href = '/';
    return false;
  }
  return true;
};
