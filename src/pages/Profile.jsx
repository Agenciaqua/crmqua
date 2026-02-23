import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Mail, Camera, Save, Phone } from 'lucide-react';
import { db } from '../services/database';

export default function Profile() {
    const { user, updateProfile } = useAuth();
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [avatar, setAvatar] = useState('');
    const [phone, setPhone] = useState('');

    // Role Switching State
    const [pin, setPin] = useState('');
    const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setAvatar(user.avatar || '');
            setPhone(user.phone || '');
        }
    }, [user]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const updates = { name, avatar, phone };
            if (password) {
                updates.password = password;
            }
            await updateProfile(updates);
            setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
            setPassword('');
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao atualizar perfil.' });
        }
    };

    const handleRoleSwitch = async () => {
        if (pin === '4949') {
            const newRole = user.role === 'Gestor' ? 'Colaborador' : 'Gestor';
            await updateProfile({ role: newRole });
            setMessage({ type: 'success', text: `Cargo alterado para ${newRole}!` });
            setShowRoleSwitcher(false);
            setPin('');
        } else {
            setMessage({ type: 'error', text: 'PIN incorreto.' });
        }
    };

    return (
        <Layout>
            <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '50px' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '30px' }}>Meu Perfil</h1>

                <div className="glass-panel" style={{ padding: '40px' }}>
                    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                        {/* Avatar Section */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                            <div style={{
                                width: '120px', height: '120px', borderRadius: '50%',
                                overflow: 'hidden', border: '3px solid var(--color-orange)',
                                marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: '#1a1a1a', position: 'relative'
                            }}>
                                {avatar ? (
                                    <img src={avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span style={{ fontSize: '3rem', color: '#fff', fontWeight: 'bold' }}>{name[0]}</span>
                                )}

                                <label htmlFor="avatar-upload" style={{
                                    position: 'absolute', bottom: '0', left: '0', width: '100%',
                                    background: 'rgba(0,0,0,0.6)', padding: '5px 0', cursor: 'pointer',
                                    display: 'flex', justifyContent: 'center'
                                }}>
                                    <Camera size={16} color="white" />
                                </label>
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                            </div>
                            <small style={{ color: '#666' }}>Clique na câmera para alterar</small>
                        </div>

                        {/* Fields */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ color: '#ccc', fontSize: '0.9rem' }}>Nome Completo</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="input-with-icon"
                                    style={{ width: '100%' }}
                                />
                                <User size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ color: '#ccc', fontSize: '0.9rem' }}>Email (Não editável)</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="input-with-icon"
                                    style={{ width: '100%', opacity: 0.6, cursor: 'not-allowed' }}
                                />
                                <Mail size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ color: '#ccc', fontSize: '0.9rem' }}>WhatsApp / Telefone</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Ex: 5511999999999"
                                    className="input-with-icon"
                                    style={{ width: '100%' }}
                                />
                                <Phone size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ color: '#ccc', fontSize: '0.9rem' }}>Nova Senha</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Deixe em branco para manter"
                                    className="input-with-icon"
                                    style={{ width: '100%' }}
                                />
                                <Lock size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }} />
                            </div>
                        </div>

                        {/* Feedback Message */}
                        {message.text && (
                            <div style={{
                                padding: '12px', borderRadius: '8px', textAlign: 'center',
                                background: message.type === 'success' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 77, 77, 0.1)',
                                color: message.type === 'success' ? '#4caf50' : '#ff4d4d',
                                border: message.type === 'success' ? '1px solid #4caf50' : '1px solid #ff4d4d'
                            }}>
                                {message.text}
                            </div>
                        )}

                        <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <Save size={20} /> Salvar Alterações
                        </button>

                    </form>
                </div>

                {/* Role Switcher Section */}
                <div style={{ marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                    <div
                        onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}
                    >
                        <span style={{ fontSize: '0.9rem', color: '#888' }}>Configurações Avançadas</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-orange)' }}>{user?.role}</span>
                    </div>

                    {showRoleSwitcher && (
                        <div className="glass-panel" style={{ marginTop: '10px', padding: '20px', background: 'rgba(0,0,0,0.2)' }}>
                            <p style={{ fontSize: '0.9rem', marginBottom: '10px', color: '#ccc' }}>Trocar Perfil (Protegido por PIN)</p>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="password"
                                    placeholder="PIN"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    style={{ width: '80px', textAlign: 'center', letterSpacing: '2px' }}
                                />
                                <button
                                    onClick={handleRoleSwitch}
                                    className="btn-secondary"
                                    style={{ fontSize: '0.8rem', flex: 1 }}
                                >
                                    Alternar para {user?.role === 'Gestor' ? 'Colaborador' : 'Gestor'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
