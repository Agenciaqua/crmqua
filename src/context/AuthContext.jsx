
import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { db } from '../services/database';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('qua_user_session');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const userFound = await db.authenticate(email, password);
        if (userFound) {
            setUser(userFound);
            localStorage.setItem('qua_user_session', JSON.stringify(userFound));
            return true;
        }
        return false;
    };

    const register = async (name, email, password) => {
        // Check if exists
        const allUsers = await db.getAll('users');
        if (allUsers.find(u => u.email === email)) {
            return false; // Already exists
        }

        const newUser = {
            name,
            email,
            password, // In a real app, hash this!
            role: null, // Force onboarding
            createdAt: new Date().toLocaleDateString('pt-BR')
        };
        await db.add('users', newUser);

        // Login immediately
        const updatedUsers = await db.getAll('users');
        const user = updatedUsers.find(u => u.email === email);
        setUser(user);
        localStorage.setItem('qua_user_session', JSON.stringify(user));
        return true;
    };

    const loginWithGoogle = async (userInfo, accessToken) => {
        try {
            // Save the token for Drive API usage
            if (accessToken) {
                localStorage.setItem('qua_google_token', accessToken);
            }

            // Check if user exists by email
            const allUsers = await db.getAll('users');
            let userFound = allUsers.find(u => u.email === userInfo.email);

            if (!userFound) {
                // Register new user automatically
                const newUser = {
                    name: userInfo.name,
                    email: userInfo.email,
                    role: null, // Force onboarding
                    avatar: userInfo.picture,
                    createdAt: new Date().toLocaleDateString('pt-BR')
                };
                // Add directly to DB
                // Add directly to DB and get the result immediately
                userFound = await db.add('users', newUser);
            }

            if (userFound) {
                console.log("Login successful, user:", userFound);
                setUser(userFound);
                localStorage.setItem('qua_user_session', JSON.stringify(userFound));
                return true;
            }
            console.warn("User not found after creation attempt.");
            alert("Erro: Usuário não encontrado após criação. Tente novamente.");
            return false;
        } catch (error) {
            console.error("Google Login Error:", error);
            alert("Erro no Login Google (AuthContext): " + error.message);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('qua_user_session');
        localStorage.removeItem('qua_google_token');
    };

    const updateProfile = async (updates) => {
        if (user) {
            const updatedUser = await db.update('users', user.id, updates);
            if (updatedUser) {
                setUser(updatedUser);
                localStorage.setItem('qua_user_session', JSON.stringify(updatedUser));
            }
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateProfile, loading, loginWithGoogle, register }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
