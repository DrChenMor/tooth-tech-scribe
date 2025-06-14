
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { Profile } from '@/types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setData = async (session: Session | null) => {
      if (session?.user) {
        setUser(session.user);
        setSession(session);

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(profileData);

        const { data: adminData } = await supabase.rpc('is_admin');
        setIsAdmin(adminData);

      } else {
        setUser(null);
        setSession(null);
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setData(session);
    });
    
    // Initial load
    supabase.auth.getSession().then(({ data: { session }}) => {
      setData(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    profile,
    isAdmin,
    loading,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
