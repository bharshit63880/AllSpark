import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSocketListener } from '../hooks/useSocketListener.jsx';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

    const [token, setToken] = useState(null); // null or String

    // This user object will be searched if token is Available 
    const [user, setUser] = useState(null); // null or Object




    useEffect(() => {

        const tokenFromLocalStorage = JSON.parse(localStorage.getItem("token"));
        const userFromLocalStorage = JSON.parse(localStorage.getItem("user"));
        setToken(tokenFromLocalStorage);
        setUser(userFromLocalStorage);

    }, []);



    return (
        <AuthContext.Provider value={{ token, user, setToken, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => useContext(AuthContext);
