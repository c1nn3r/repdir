'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isVendor: boolean;
  vendorTrackingCode: string | null;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isVendor: false,
  vendorTrackingCode: null,
  isAdmin: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isVendor, setIsVendor] = useState(false);
  const [vendorTrackingCode, setVendorTrackingCode] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const handleAuthChange = async (currentSession: Session | null) => {
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        setLoading(true);
        try {
          const [vendorRes, adminRes] = await Promise.all([
            supabase
              .from('vendors')
              .select('tracking_code')
              .eq('user_id', currentUser.id)
              .maybeSingle(),
            supabase
              .from('admin_users')
              .select('user_id')
              .eq('user_id', currentUser.id)
              .maybeSingle()
          ]);

          if (vendorRes.data) {
            setIsVendor(true);
            setVendorTrackingCode(vendorRes.data.tracking_code);
          } else {
            setIsVendor(false);
            setVendorTrackingCode(null);
          }

          setIsAdmin(!!adminRes.data);
        } catch (err) {
          console.error('Error loading roles:', err);
          setIsVendor(false);
          setVendorTrackingCode(null);
          setIsAdmin(false);
        }
      } else {
        setIsVendor(false);
        setVendorTrackingCode(null);
        setIsAdmin(false);
      }
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthChange(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  return (
    <AuthContext.Provider value={{ user, session, loading, isVendor, vendorTrackingCode, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  return useContext(AuthContext);
}
