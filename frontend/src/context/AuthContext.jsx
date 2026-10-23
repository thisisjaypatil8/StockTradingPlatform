import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({children}){
    const [token, setToken] = useState(() => localStorage.getItem("token") || null);
    const [user, setUser] = useState(() =>{
        try {
            const rawUser = localStorage.getItem("user");
            return rawUser ? JSON.parse(rawUser) : null;
        } catch{
            return null;
        }
    });

    /**
     * Synchronize session across browser tabs and handle cross-origin logout actions.
     */
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("action") === "logout") {
            logout();
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        const handleStorageChange = () => {
            const currentToken = localStorage.getItem("token");
            setToken(currentToken);
            try {
                const rawUser = localStorage.getItem("user");
                setUser(rawUser ? JSON.parse(rawUser) : null);
            } catch {
                setUser(null);
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    const login = (newToken, newUser) => {
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
    };

    const isLoggedIn = Boolean(token && user);
    const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || "http://localhost:3000";

    // Build landing URL for terminal navigation
    const dashboardUrl = isLoggedIn
        ? `${DASHBOARD_URL}/?token=${token}&username=${encodeURIComponent(user.username || "")}&userId=${user.id || user._id || ""}&role=${encodeURIComponent(user.role || "")}`
        : `${DASHBOARD_URL}/`;

    return (
        <AuthContext.Provider value={{ token, user, login, logout, isLoggedIn, dashboardUrl }}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Access authenticated user context across the landing portal.
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}