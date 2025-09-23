import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  id: string;
  name: string;
  email: string;
  loyaltyLevel: number;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  setUserName: (name: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Load auth state from localStorage on component mount
  useEffect(() => {
    const savedAuthState = localStorage.getItem("faredown_auth");
    if (savedAuthState) {
      try {
        const authData = JSON.parse(savedAuthState);
        if (authData.isLoggedIn && authData.user) {
          // Check if session is not too old (optional: expire after 7 days)
          const loginTime = authData.loginTime ? new Date(authData.loginTime) : new Date();
          const now = new Date();
          const daysDiff = (now.getTime() - loginTime.getTime()) / (1000 * 3600 * 24);

          if (daysDiff > 7) {
            console.log("🔴 AuthContext: Session expired, logging out");
            localStorage.removeItem("faredown_auth");
            return;
          }

          console.log("✅ AuthContext: Restoring user session:", authData.user.email);
          setIsLoggedIn(true);
          setUser(authData.user);
        }
      } catch (error) {
        console.error("🔴 AuthContext: Error loading auth state:", error);
        localStorage.removeItem("faredown_auth");
      }
    } else {
      console.log("🔵 AuthContext: No saved auth state found");
    }
  }, []);

  const login = (userData: User) => {
    console.log("🔵 AuthContext: Logging in user:", userData);
    setIsLoggedIn(true);
    setUser(userData);

    // Save to localStorage with timestamp for session tracking
    const authData = {
      isLoggedIn: true,
      user: userData,
      loginTime: new Date().toISOString(),
      provider: 'oauth' // Track if this was an OAuth login
    };
    localStorage.setItem("faredown_auth", JSON.stringify(authData));
    console.log("�� AuthContext: User data saved to localStorage");
  };

  const logout = () => {
    console.log("🔵 AuthContext: Logging out user");
    setIsLoggedIn(false);
    setUser(null);

    // Remove from localStorage and clear any OAuth session cookies
    localStorage.removeItem("faredown_auth");

    // Clear any auth-related cookies
    document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    console.log("✅ AuthContext: User logged out and session cleaned");
  };

  const setUserName = (name: string) => {
    if (user) {
      const updatedUser = { ...user, name };
      setUser(updatedUser);

      // Update localStorage
      const authData = {
        isLoggedIn: true,
        user: updatedUser,
      };
      localStorage.setItem("faredown_auth", JSON.stringify(authData));
    }
  };

  const value: AuthContextType = {
    isLoggedIn,
    user,
    login,
    logout,
    setUserName,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
