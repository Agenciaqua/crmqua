
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';

export default function Login() {
    const { login, register, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleGoogleLogin = useGoogleLogin({
        scope: 'https://www.googleapis.com/auth/drive.file', // Request permission to upload files
        onSuccess: async (tokenResponse) => {
            try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userData = await res.json();
                // Pass access token to context so we can use it for Drive API later
                if (await loginWithGoogle(userData, tokenResponse.access_token)) {
                    navigate('/dashboard');
                }
            } catch (err) {
                console.error(err);
                setError('Falha ao buscar dados do Google.');
            }
        },
        onError: () => setError('Login com Google Falhou.'),
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (isSigningUp) {
            if (!name || !email || !password) {
                setError('Preencha todos os campos.');
                return;
            }
            if (await register(name, email, password)) {
                // Register logs in automatically
                navigate('/onboarding');
            } else {
                setError('Email já cadastrado.');
            }
        } else {
            if (await login(email, password)) {
                // Check if user has role, if not -> onboarding
                // But login function in AuthContext doesn't return user obj directly to check here
                // We will handle redirect logic in App.jsx or AuthContext mostly
                // For now assuming existing users go to dashboard
                // We will fix redirect logic next step
                navigate('/dashboard');
            } else {
                setError('Email ou senha inválidos.');
            }
        }
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Decor */}
            <div style={{
                position: 'absolute',
                top: '-50%', left: '-50%',
                width: '200%', height: '200%',
                background: 'radial-gradient(circle at center, rgba(255, 77, 0, 0.1) 0%, transparent 50%)',
                zIndex: -1,
                animation: 'rotate 60s linear infinite'
            }} />

            <div className="glass-panel" style={{
                padding: '60px 50px',
                borderRadius: '30px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                maxWidth: '450px',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <img src="/logo.png" alt="QUA" style={{
                    width: '180px',
                    marginBottom: '40px',
                    filter: 'drop-shadow(0 0 20px rgba(255, 77, 0, 0.4))'
                }} />

                <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: '300',
                    marginBottom: '20px',
                    color: '#FFF',
                    letterSpacing: '1px'
                }}>Acesso ao Sistema</h2>

                <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '30px', textAlign: 'center' }}>
                    Faça login com sua conta Google para acessar o CRM e os Arquivos.
                </p>

                {error && <div style={{
                    color: '#ff4d4d',
                    fontSize: '0.9rem',
                    textAlign: 'center',
                    background: 'rgba(255, 77, 77, 0.1)',
                    padding: '10px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    width: '100%'
                }}>{error}</div>}

                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <button
                        type="button"
                        onClick={() => handleGoogleLogin()}
                        className="glass-panel-interactive"
                        style={{
                            width: '100%',
                            padding: '16px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            color: 'white',
                            fontSize: '1.1rem',
                            transition: 'all 0.2s ease',
                            textDecoration: 'none',
                            fontWeight: '500'
                        }}
                        onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
                        onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.08)'}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Entrar com Google
                    </button>
                </div>

                <div style={{ marginTop: '40px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', width: '100%' }}>
                    <p style={{ marginTop: '10px', fontSize: '1rem', color: '#00FFFF', fontWeight: 'bold', border: '1px solid #00FFFF', padding: '5px', borderRadius: '5px' }}>v0.3.3 (Smart Fallback)</p>
                </div>
            </div>
        </div>
    );
}
