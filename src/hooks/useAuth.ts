"use client";

import { createContext, useContext, useEffect, useState, ReactNode, createElement } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { AuthSession, UserRole, BusinessUnit } from "@/lib/auth-helpers";
import { rbacManager, UserRole as RBACUserRole } from "@/lib/rbac";

interface AuthContextType {
  user: AuthSession['user'] | null;
  loading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthSession['user'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = getSupabase();

  const convertToRBACRole = (authRole: UserRole): RBACUserRole => {
    const roleMapping: Record<UserRole, RBACUserRole> = {
      super_admin: RBACUserRole.SUPER_ADMIN,
      owner: RBACUserRole.ADMIN,
      manager: RBACUserRole.MANAGER,
      cafe_manager: RBACUserRole.MANAGER,
      bar_manager: RBACUserRole.MANAGER,
      hotel_manager: RBACUserRole.MANAGER,
      garden_manager: RBACUserRole.MANAGER,
      waiter: RBACUserRole.WAITER,
      kitchen: RBACUserRole.KITCHEN,
      bartender: RBACUserRole.STAFF,
      reception: RBACUserRole.RECEPTIONIST,
      hotel_reception: RBACUserRole.RECEPTIONIST,
    };
    return roleMapping[authRole] || RBACUserRole.STAFF;
  };

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser) {
          setUser(null);
          setError(authError?.message || 'No authenticated user');
          return;
        }

        // Get additional user metadata from Supabase database
        const { data: userDataRaw, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (userError || !userDataRaw) {
          setUser(null);
          setError(userError?.message || 'User data not found');
          return;
        }

        const userData = userDataRaw as any;
        const mappedUser = {
          id: authUser.id,
          username: userData.username || '',
          role: (userData.role || 'waiter') as UserRole,
          businessUnit: (userData.businessUnit || 'cafe') as BusinessUnit
        };
        setUser(mappedUser);
        // Assign RBAC role for PermissionGuard
        try {
          rbacManager.assignRole(authUser.id, convertToRBACRole(mappedUser.role));
        } catch {}
        setError(null);
      } catch (err) {
        setUser(null);
        setError(err instanceof Error ? err.message : 'Authentication error');
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // If we have a custom auth token, don't let Supabase state changes force logout
        if (event === 'SIGNED_OUT' || !session) {
          // Check if we have a custom auth token
          if (typeof document !== 'undefined') {
            const cookies = document.cookie.split(';');
            const hasCustomToken = cookies.some(cookie => cookie.trim().startsWith('deora-auth-token='));
            
            if (hasCustomToken) {
              // Check if custom auth is still valid
              try {
                const response = await fetch('/api/auth/me');
                if (response.ok) {
                  const { user: customUser } = await response.json();
                  if (customUser) {
                    // Custom auth is still valid, don't logout
                    setUser(customUser);
                    setError(null);
                    setLoading(false);
                    return;
                  }
                }
              } catch (err) {
                console.error('Error checking custom auth during SIGNED_OUT event:', err);
              }
            }
          }
          
          // No custom token or custom auth is invalid, proceed with logout
          setUser(null);
          setError(null);
        } else if (event === 'SIGNED_IN' || session) {
          await getUser();
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    }
  };

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        setUser(null);
        setError(authError?.message || 'No authenticated user');
        return;
      }

      // Get updated user metadata
      const { data: userDataRaw, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userError || !userDataRaw) {
        setUser(null);
        setError(userError?.message || 'User data not found');
        return;
      }

      const userData = userDataRaw as any;
      const mappedUser = {
        id: authUser.id,
        username: userData.username || '',
        role: (userData.role || 'waiter') as UserRole,
        businessUnit: (userData.businessUnit || 'cafe') as BusinessUnit
      };
      setUser(mappedUser);
      // Assign RBAC role for PermissionGuard
      try {
        rbacManager.assignRole(authUser.id, convertToRBACRole(mappedUser.role));
      } catch {}
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setLoading(false);
    }
  };

  return createElement(AuthContext.Provider, { value: { user, loading, error, logout, refresh } }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

