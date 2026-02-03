
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, CheckSquare, FileText,
    LogOut, Calendar, Target, BarChart2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProfileModal from './ProfileModal';
import logo from '../assets/qua_logo.png';

const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Target, label: 'Prospecção', path: '/prospeccao' },
        { icon: Users, label: 'Clientes', path: '/clientes' },
        { icon: CheckSquare, label: 'Tarefas', path: '/tarefas' },
        ...(user?.role === 'Gestor' ? [{ icon: BarChart2, label: 'Relatórios', path: '/relatorios' }] : []),
        { icon: FileText, label: 'Arquivos', path: '/arquivos' },
        { icon: Calendar, label: 'Reuniões', path: '/reunioes' },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />

            <aside className={`sidebar ${isOpen ? 'open' : ''}`} style={{
                background: 'rgba(20, 20, 20, 0.95)', // Darker for mobile readability
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                padding: '24px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                overflow: 'hidden',
                overflowY: 'auto',
                zIndex: 1000
            }}>
                {/* Logo Section */}
                <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                    <img src={logo} alt="QUA CRM" style={{ height: '80px', objectFit: 'contain' }} />
                </div>

                {/* Navigation */}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={onClose} // Close on navigaton (mobile)
                            className={({ isActive }) =>
                                isActive ? 'nav-item active' : 'nav-item'
                            }
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                color: isActive ? 'white' : '#888',
                                textDecoration: 'none',
                                transition: 'all 0.3s ease',
                                background: isActive ? 'rgba(255, 77, 0, 0.1)' : 'transparent',
                                border: isActive ? '1px solid rgba(255, 77, 0, 0.2)' : '1px solid transparent',
                            })}
                        >
                            <item.icon size={20} color={window.location.pathname === item.path ? 'var(--color-orange)' : 'currentColor'} />
                            <span style={{ fontWeight: '500' }}>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* User Profile */}
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div
                        onClick={() => navigate('/profile')}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                    >
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #333, #111)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid rgba(255,255,255,0.1)',
                            overflow: 'hidden'
                        }}>
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-orange)' }}>
                                    {user?.name?.charAt(0)}
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{user?.name?.split(' ')[0]}</span>
                            <span style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase' }}>{user?.role || '...'}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        style={{
                            background: 'transparent', border: 'none', color: '#666',
                            cursor: 'pointer', padding: '8px', borderRadius: '8px',
                            transition: '0.2s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.color = '#ff4d4d'; e.currentTarget.style.background = 'rgba(255, 77, 77, 0.1)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.color = '#666'; e.currentTarget.style.background = 'transparent'; }}
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
