/**
 * AuthContext — Appwrite authentication context.
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Account } from 'appwrite';
import { client } from '@/lib/appwrite';

export type User = {
  id: string;
  name?: string;
  email?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const account = new Account(client);

  useEffect(() => {
    // Check if user is already logged in
    checkSession();
  }, []);

  async function checkSession() {
    try {
      setIsLoading(true);
      // This will throw if no valid session exists
      const session = await account.get();
      // If we get here, we have a valid session
      setUser({
        id: session.$id,
        name: session.name,
        email: session.email,
      });
    } catch (error) {
      // Not logged in or session expired - clear user state
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    try {
      // Create a session that persists until explicitly logged out
      // Appwrite SDK v15 uses createEmailPasswordSession
      await account.createEmailPasswordSession(email, password);
      // Verify the session was created and get user info
      await checkSession();
    } catch (error) {
      // Clear user state on login failure
      setUser(null);
      throw error;
    }
  }

  async function register(email: string, password: string, name?: string) {
    try {
      await account.create('unique()', email, password, name);
      await login(email, password);
    } catch (error) {
      throw error;
    }
  }

  async function logout() {
    try {
      // Delete all sessions to ensure complete logout
      try {
        const sessions = await account.listSessions();
        // Delete all sessions
        for (const session of sessions.sessions) {
          try {
            await account.deleteSession(session.$id);
          } catch (err) {
            // Continue deleting other sessions even if one fails
          }
        }
      } catch (err) {
        // If listing sessions fails, try to delete current session
        try {
          await account.deleteSession('current');
        } catch (deleteErr) {
          // Ignore - session might already be deleted
        }
      }
      // Clear user state
      setUser(null);
    } catch (error) {
      // Even if logout fails, clear user state
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
