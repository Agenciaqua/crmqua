import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Briefcase, User } from 'lucide-react';

const Onboarding = () => {
    const { user, updateProfile } = useAuth();
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState(null);

    const handleConfirm = async () => {
        if (selectedRole) {
            await updateProfile({ role: selectedRole });
            navigate('/dashboard');
        }
    };

    return (
        <div style={{
            height: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(circle at center, rgba(255, 77, 0, 0.05) 0%, transparent 50%)'
        }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Bem-vindo, {user?.name}!</h1>
            <p style={{ color: '#aaa', marginBottom: '40px' }}>Para começar, qual será o seu perfil de acesso?</p>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
                <div
                    onClick={() => setSelectedRole('Gestor')}
                    className="glass-panel-interactive"
                    style={{
                        padding: '30px', width: '250px', cursor: 'pointer',
                        border: selectedRole === 'Gestor' ? '2px solid var(--color-orange)' : '1px solid rgba(255,255,255,0.1)',
                        background: selectedRole === 'Gestor' ? 'rgba(255, 77, 0, 0.1)' : 'rgba(255,255,255,0.02)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
                    }}
                >
                    <Briefcase size={40} color={selectedRole === 'Gestor' ? 'var(--color-orange)' : '#666'} />
                    <h3 style={{ fontSize: '1.2rem' }}>Sou Gestor</h3>
                    <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#888' }}>
                        Gerenciamento completo, relatórios e controle de equipe.
                    </p>
                </div>

                <div
                    onClick={() => setSelectedRole('Colaborador')}
                    className="glass-panel-interactive"
                    style={{
                        padding: '30px', width: '250px', cursor: 'pointer',
                        border: selectedRole === 'Colaborador' ? '2px solid var(--color-orange)' : '1px solid rgba(255,255,255,0.1)',
                        background: selectedRole === 'Colaborador' ? 'rgba(255, 77, 0, 0.1)' : 'rgba(255,255,255,0.02)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
                    }}
                >
                    <User size={40} color={selectedRole === 'Colaborador' ? 'var(--color-orange)' : '#666'} />
                    <h3 style={{ fontSize: '1.2rem' }}>Sou Colaborador</h3>
                    <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#888' }}>
                        Foco em vendas, atendimento e gestão de clientes.
                    </p>
                </div>
            </div>

            <button
                onClick={handleConfirm}
                disabled={!selectedRole}
                className="btn-primary"
                style={{ width: '200px', padding: '12px', fontSize: '1rem', opacity: selectedRole ? 1 : 0.5 }}
            >
                Confirmar e Entrar
            </button>
        </div>
    );
};

export default Onboarding;
