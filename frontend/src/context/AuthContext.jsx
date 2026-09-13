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

    // cross tab-sync
    useEffect(() => {

        // 1. Cross-port logout signal detector
        const urlParams = new URLSearchParams(window.location.search);
        if(urlParams.get("action") === "logout"){
            logout();

            // clean the url without Refreshing
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        // 2. Cross-tab storage change handler
        const handleStorageChange = () =>{
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

    // login action
    const login = (newToken, newUser) => {
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
    };

    // logout action
    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
    };

    const isLoggedIn = Boolean(token && user);

    // Session handoff URL
    const dashboardUrl = isLoggedIn ? `http://localhost:3000/?token=${token}&username=${encodeURIComponent(user.username || "")}&userId=${user.id || user._id || ""}&role=${encodeURIComponent(user.role || "")}` : "http://localhost:3000/";


    return(
        <AuthContext.Provider value={{token, user, login, logout, isLoggedIn, dashboardUrl}}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom Hook to use the context 
export function useAuth() {
    const context = useContext(AuthContext);
    if(!context){
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}