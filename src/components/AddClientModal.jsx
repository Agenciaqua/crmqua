
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Save, User, Instagram, Briefcase, Building2 } from 'lucide-react';

const AddClientModal = ({ onClose, onSave, initialData }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        email: '',
        phone: '',
        status: 'Primeiro Contato',
        category: 'Corretor', // Corretor, Imobiliária, Construtora, Incorporadora
        role: '',
        instagram: '',
        relationship: 'Lead' // Lead, Cliente
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                relationship: initialData.relationship || 'Lead', // Default fallback
                role: initialData.role || '',
                instagram: initialData.instagram || ''
            });
        }
    }, [initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const todayISO = new Date().toISOString().split('T')[0];

        onSave({
            ...formData,
            lastInteraction: initialData?.lastInteraction || todayISO,
            ownerId: initialData?.ownerId || user?.id
        });
        onClose();
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="glass-panel" style={{ padding: '40px', width: '600px', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '300' }}>{initialData ? 'Editar Cadastro' : 'Novo Cadastro'}</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Relationship Type */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '12px', marginBottom: '10px' }}>
                        <label style={{ display: 'block', color: 'var(--color-orange)', marginBottom: '10px', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Tipo de Cadastro</label>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="relationship"
                                    value="Lead"
                                    checked={formData.relationship === 'Lead'}
                                    onChange={e => setFormData({ ...formData, relationship: e.target.value })}
                                />
                                <span style={{ color: formData.relationship === 'Lead' ? 'white' : '#888' }}>Lead (Prospecção)</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="relationship"
                                    value="Cliente"
                                    checked={formData.relationship === 'Cliente'}
                                    onChange={e => setFormData({ ...formData, relationship: e.target.value })}
                                />
                                <span style={{ color: formData.relationship === 'Cliente' ? 'white' : '#888' }}>Cliente (Ativo)</span>
                            </label>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#AAA', marginBottom: '8px', fontSize: '0.9rem' }}>
                                <Building2 size={14} /> Nome / Empresa
                            </label>
                            <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%' }} />
                        </div>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#AAA', marginBottom: '8px', fontSize: '0.9rem' }}>
                                <User size={14} /> Contato Principal
                            </label>
                            <input required value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} style={{ width: '100%' }} />
                        </div>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#AAA', marginBottom: '8px', fontSize: '0.9rem' }}>
                                <Briefcase size={14} /> Cargo
                            </label>
                            <input placeholder="Ex: Diretor, Corretor..." value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} style={{ width: '100%' }} />
                        </div>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#AAA', marginBottom: '8px', fontSize: '0.9rem' }}>
                                <Instagram size={14} /> Instagram
                            </label>
                            <input placeholder="@usuario" value={formData.instagram} onChange={e => setFormData({ ...formData, instagram: e.target.value })} style={{ width: '100%' }} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', color: '#AAA', marginBottom: '8px', fontSize: '0.9rem' }}>Email</label>
                            <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', color: '#AAA', marginBottom: '8px', fontSize: '0.9rem' }}>Telefone</label>
                            <input required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={{ width: '100%' }} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', color: '#AAA', marginBottom: '8px', fontSize: '0.9rem' }}>Categoria</label>
                            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={{ width: '100%' }}>
                                <option>Corretor</option>
                                <option>Imobiliária</option>
                                <option>Construtora</option>
                                <option>Incorporadora</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', color: '#AAA', marginBottom: '8px', fontSize: '0.9rem' }}>Status</label>
                            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} style={{ width: '100%' }}>
                                <option>Primeiro Contato</option>
                                <option>Fazer Follow up</option>
                                <option>Negociando</option>
                                <option>Reunião</option>
                                <option>Fechado</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Save size={18} />
                        {initialData ? 'Salvar Alterações' : 'Cadastrar'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddClientModal;
