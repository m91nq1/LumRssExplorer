import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface LocalUser {
  id: number;
  username: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
}

interface AuthContextType {
  user: User | null;
  localUser: LocalUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function syncUserWithBackend(supabaseUser: User, accessToken: string): Promise<LocalUser | null> {
  try {
    const response = await fetch('/api/auth/supabase-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        supabaseId: supabaseUser.id,
        email: supabaseUser.email,
        firstName: supabaseUser.user_metadata?.first_name,
        lastName: supabaseUser.user_metadata?.last_name,
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.user;
    }
    return null;
  } catch (error) {
    console.error('Failed to sync user with backend:', error);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [localUser, setLocalUser] = useState<LocalUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialSessionLoaded = useRef(false);
  const syncedSessionId = useRef<string | null>(null);

  useEffect(() => {
    // Load initial session (restore from storage - no login notification)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      initialSessionLoaded.current = true;
      // Restoring sign-in must not wait for the unrelated local profile request.
      setIsLoading(false);
      
      // Fetch local user data without triggering login notification
      if (session?.user) {
        try {
          const response = await fetch(`/api/auth/supabase-user/${session.user.id}`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (response.ok) {
            const userData = await response.json();
            setLocalUser(userData);
          } else if (response.status === 404) {
            setLocalUser(await syncUserWithBackend(session.user, session.access_token));
          }
        } catch (error) {
          console.error('Failed to fetch local user:', error);
        }
      }
      
    }).catch(() => {
      initialSessionLoaded.current = true;
      setIsLoading(false);
      console.warn('Sign-in restoration was unavailable. Public pages remain accessible.');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        // Only sync on actual SIGNED_IN event (not session restore)
        // Also check we're not re-processing the same session
        if (event === 'SIGNED_IN' && session?.user && initialSessionLoaded.current) {
          const sessionId = session.access_token.slice(-20); // Use last 20 chars as session identifier
          if (syncedSessionId.current !== sessionId) {
            syncedSessionId.current = sessionId;
            void syncUserWithBackend(session.user, session.access_token).then(local => {
              if (syncedSessionId.current === sessionId) setLocalUser(local);
            });
          }
        } else if (event === 'SIGNED_OUT') {
          setLocalUser(null);
          syncedSessionId.current = null;
        }
        
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (!error && data.session && data.user) {
      // Explicitly complete signup synchronization even if the auth listener
      // fires before initial session restoration finishes.
      setLocalUser(await syncUserWithBackend(data.user, data.session.access_token));
    }
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error && data.session && data.user) {
      // Backend session-based deduplication also covers the auth listener.
      setLocalUser(await syncUserWithBackend(data.user, data.session.access_token));
    }
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        localUser,
        session,
        isLoading,
        isAuthenticated: !!user,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within an AuthProvider');
  }
  return context;
}
