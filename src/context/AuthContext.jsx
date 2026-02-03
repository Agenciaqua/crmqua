
import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { db } from '../services/database';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('qua_user_session');
            if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Session parse error:", error);
            localStorage.removeItem('qua_user_session');
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const userFound = await db.authenticate(email.trim().toLowerCase(), password.trim());
            if (userFound) {
                setUser(userFound);
                localStorage.setItem('qua_user_session', JSON.stringify(userFound));
                return { success: true };
            }
            return { success: false, error: 'Email ou senha incorretos.' };
        } catch (e) {
            return { success: false, error: e.message || "Erro desconhecido no login." };
        }
    };

    const register = async (name, email, password) => {
        const normalizedEmail = email.trim().toLowerCase();

        // Check if exists using server filter
        const existingUser = await db.getByEmail(normalizedEmail);
        if (existingUser) {
            return false; // Already exists
        }

        const newUser = {
            name: name.trim(),
            email: normalizedEmail,
            password: password.trim(), // In a real app, hash this!
            role: null // Force onboarding
        };
        try {
            const createdUser = await db.add('users', newUser);

            if (createdUser && createdUser.id) {
                setUser(createdUser);
                localStorage.setItem('qua_user_session', JSON.stringify(createdUser));
                return { success: true };
            }
            return { success: false, error: "Falha ao criar usuário (sem ID retornado)." };
        } catch (e) {
            return { success: false, error: e.message };
        }
    };

    const loginWithGoogle = async (userInfo) => {
        try {
            const normalizedEmail = userInfo.email.trim().toLowerCase();

            // Check if user exists by email using server filter
            let userFound = await db.getByEmail(normalizedEmail);

            if (!userFound) {
                // Register new user automatically
                const newUser = {
                    name: userInfo.name,
                    email: normalizedEmail,
                    role: null, // Force onboarding
                    avatar: userInfo.picture
                };
                // Add directly to DB
                const createdUser = await db.add('users', newUser);
                if (createdUser && createdUser.id) {
                    userFound = createdUser;
                }
            }

            if (userFound) {
                setUser(userFound);
                localStorage.setItem('qua_user_session', JSON.stringify(userFound));
                return { success: true };
            }
            return { success: false, error: "Não foi possível autenticar com o Google." };
        } catch (error) {
            console.error("Google Login Error:", error);
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('qua_user_session');
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
