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
          setIsLoggedIn(true);
          setUser(authData.user);
        }
      } catch (error) {
        console.error("Error loading auth state:", error);
        localStorage.removeItem("faredown_auth");
      }
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
    console.log("✅ AuthContext: User data saved to localStorage");
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);

    // Remove from localStorage
    localStorage.removeItem("faredown_auth");
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
