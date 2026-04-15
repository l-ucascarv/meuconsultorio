import { useState, useEffect, createContext, useContext, ReactNode, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  crp: string | null;
  specialty: string | null;
  slug: string | null;
  theme: string;
  primary_color: string;
  subscription_status: 'active' | 'inactive' | 'pending' | 'cancelled' | 'trial';
  subscription_plan: string | null;
  must_change_password: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  mustChangePassword: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    name: string,
    crp: string,
    specialty: string
  ) => Promise<{ error: Error | null; userId?: string }>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const sessionExpiryTimeoutRef = useRef<number | null>(null);
  const LOGIN_AT_KEY = 'mc_auth_login_at';

  const fetchProfile = async (userId: string, userEmail?: string, userName?: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    // Auto-create profile if it doesn't exist (e.g. Google OAuth first login)
    if (!data && userEmail) {
      const baseSlug = (userName || userEmail.split('@')[0])
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      // Ensure unique slug
      let slug = baseSlug;
      let attempts = 0;
      while (attempts < 10) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();
        if (!existing) break;
        attempts++;
        slug = `${baseSlug}-${Math.floor(Math.random() * 9000) + 1000}`;
      }

      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          email: userEmail,
          name: userName || null,
          slug,
          // Usuário veio por OAuth (Google): pedir para definir senha para permitir login por e-mail/senha.
          must_change_password: true,
          subscription_status: 'trial',
        })
        .select()
        .single();

      if (insertError) {
        // Se houver conflito (ex.: profile criado em paralelo por outra chamada), tenta buscar novamente.
        const err = insertError as { code?: string; message?: string };
        const code = err?.code;
        const msg = err?.message;
        const isUniqueViolation = code === '23505' || (msg ? msg.toLowerCase().includes('duplicate') : false);

        if (isUniqueViolation) {
          const { data: existingAfterConflict, error: refetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (refetchError) {
            console.error('Error refetching profile after conflict:', refetchError);
          }

          if (existingAfterConflict) {
            return existingAfterConflict as Profile;
          }
        }

        console.error('Error auto-creating profile:', insertError);
        return null;
      }

      // Assign subscriber role
      await supabase.from('user_roles').insert({ user_id: userId, role: 'subscriber' }).select();

      return newProfile as Profile;
    }

    return data as Profile | null;
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
      setMustChangePassword(profileData?.must_change_password ?? false);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          if (!sessionStorage.getItem(LOGIN_AT_KEY)) {
            sessionStorage.setItem(LOGIN_AT_KEY, String(Date.now()));
          }
        } else {
          sessionStorage.removeItem(LOGIN_AT_KEY);
        }
        
        // Defer profile fetch with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            const meta = session.user.user_metadata;
            fetchProfile(
              session.user.id,
              session.user.email,
              meta?.full_name || meta?.name || null
            ).then((profileData) => {
              setProfile(profileData);
              setMustChangePassword(profileData?.must_change_password ?? false);
              setLoading(false);
            });
          }, 0);
        } else {
          setProfile(null);
          setMustChangePassword(false);
          setLoading(false);
        }
      }
    );

    // onAuthStateChange já dispara com INITIAL_SESSION, então evitamos duplicar fetch/insert aqui.
    return () => subscription.unsubscribe();
  }, []);

  // Expiração máxima de sessão: 1h (exige login novamente)
  useEffect(() => {
    if (sessionExpiryTimeoutRef.current) {
      window.clearTimeout(sessionExpiryTimeoutRef.current);
      sessionExpiryTimeoutRef.current = null;
    }

    if (!session) return;

    const now = Date.now();
    const maxSessionMs = 60 * 60 * 1000; // 1h

    const storedLoginAt = sessionStorage.getItem(LOGIN_AT_KEY);
    const parsedLoginAt = storedLoginAt ? Number(storedLoginAt) : NaN;
    const loginAtMs = Number.isFinite(parsedLoginAt) ? parsedLoginAt : now;

    if (!Number.isFinite(parsedLoginAt)) {
      sessionStorage.setItem(LOGIN_AT_KEY, String(loginAtMs));
    }

    const hardExpireAtMs = loginAtMs + maxSessionMs;

    const tokenExpireAtMs =
      typeof session.expires_at === 'number' ? session.expires_at * 1000 : hardExpireAtMs;

    const expireAtMs = Math.min(hardExpireAtMs, tokenExpireAtMs);
    const msUntilExpire = expireAtMs - now;

    if (msUntilExpire <= 0) {
      void supabase.auth.signOut();
      return;
    }

    sessionExpiryTimeoutRef.current = window.setTimeout(() => {
      void supabase.auth.signOut();
    }, msUntilExpire);

    return () => {
      if (sessionExpiryTimeoutRef.current) {
        window.clearTimeout(sessionExpiryTimeoutRef.current);
        sessionExpiryTimeoutRef.current = null;
      }
    };
  }, [session]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    crp: string,
    specialty: string
  ) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      // Create profile after signup
      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          user_id: data.user.id,
          email: email,
          name: name,
          crp: crp,
          specialty: specialty || null,
          must_change_password: false,
          subscription_status: 'trial',
        });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }

        // Assign subscriber role
        const { error: roleError } = await supabase.from('user_roles').insert({
          user_id: data.user.id,
          role: 'subscriber',
        });

        if (roleError) {
          console.error('Error assigning role:', roleError);
        }
      }

      return { error: null, userId: data.user?.id };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    sessionStorage.removeItem(LOGIN_AT_KEY);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setMustChangePassword(false);
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) throw error;

      // Update must_change_password flag
      if (user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ must_change_password: false })
          .eq('user_id', user.id);
        
        if (updateError) {
          console.error('Error updating profile:', updateError);
        } else {
          setMustChangePassword(false);
          await refreshProfile();
        }
      }
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      mustChangePassword,
      signIn,
      signUp,
      signOut,
      updatePassword,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
