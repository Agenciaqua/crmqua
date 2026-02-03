
import React, { useState } from 'react';
import { X, Save, User, Phone, Briefcase, Globe, Instagram, MapPin } from 'lucide-react';
import { db } from '../services/database';

const AddLeadModal = ({ onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        role: '',
        instagram: '',
        website: '',
        businessType: 'Imobiliária',
        hasTraffic: 'Não',
        source: 'Tráfego Pago',
        prospectingDay: 'Segunda-feira',
        notes: ''
    });

    React.useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                phone: initialData.phone || '',
                role: initialData.role || '',
                instagram: initialData.instagram || '',
                website: initialData.website || '',
                businessType: initialData.businessType || 'Imobiliária',
                hasTraffic: initialData.hasTraffic ? 'Sim' : 'Não',
                source: initialData.source || 'Tráfego Pago',
                prospectingDay: initialData.prospectingDay || 'Segunda-feira',
                notes: initialData.notes || ''
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check Limit if creating new or changing day
        if (formData.prospectingDay && (!initialData || initialData.prospectingDay !== formData.prospectingDay)) {
            const allClients = await db.getAll('clients');
            const dayLeads = allClients.filter(c => c.prospectingDay === formData.prospectingDay).length;
            if (dayLeads >= 30) {
                alert(`O dia ${formData.prospectingDay} já atingiu o limite de 30 leads. Escolha outro dia.`);
                return;
            }
        }

        const leadData = {
            ...formData,
            hasTraffic: formData.hasTraffic === 'Sim',
            status: initialData ? initialData.status : 'Prospecção', // Keep status if editing
            category: initialData ? initialData.category : 'Frio',
            lastInteraction: new Date().toLocaleDateString('pt-BR')
        };

        if (initialData && initialData.id) {
            await db.update('clients', initialData.id, leadData);
        } else {
            await db.add('clients', leadData);
        }

        onSave();
        onClose();
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="glass-panel" style={{ width: '500px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{initialData ? 'Editar Lead' : 'Novo Lead Manual'}</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><X /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Basic Info */}
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#ccc' }}>Nome do Lead</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '8px' }}>
                            <User size={18} color="#666" />
                            <input
                                name="name" value={formData.name} onChange={handleChange} required
                                placeholder="Ex: João Silva"
                                style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#ccc' }}>Telefone</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '8px' }}>
                                <Phone size={18} color="#666" />
                                <input
                                    name="phone" value={formData.phone} onChange={handleChange}
                                    placeholder="(11) 99999-9999"
                                    style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none' }}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#ccc' }}>Cargo</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '8px' }}>
                                <Briefcase size={18} color="#666" />
                                <input
                                    name="role" value={formData.role} onChange={handleChange}
                                    placeholder="Ex: Corretor"
                                    style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Social / Web */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#ccc' }}>Instagram</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '8px' }}>
                                <Instagram size={18} color="#666" />
                                <input
                                    name="instagram" value={formData.instagram} onChange={handleChange}
                                    placeholder="@usuario"
                                    style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none' }}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#ccc' }}>Site</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '8px' }}>
                                <Globe size={18} color="#666" />
                                <input
                                    name="website" value={formData.website} onChange={handleChange}
                                    placeholder="www.site.com"
                                    style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Business Details */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#ccc' }}>Tipo de Negócio</label>
                            <select
                                name="businessType" value={formData.businessType} onChange={handleChange}
                                style={{
                                    width: '100%', padding: '10px', borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', outline: 'none'
                                }}
                            >
                                <option value="Imobiliária">Imobiliária</option>
                                <option value="Corretor">Corretor</option>
                                <option value="Construtora">Construtora</option>
                                <option value="Incorporadora">Incorporadora</option>
                                <option value="Loteadora">Loteadora</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#ccc' }}>Faz Tráfego?</label>
                            <select
                                name="hasTraffic" value={formData.hasTraffic} onChange={handleChange}
                                style={{
                                    width: '100%', padding: '10px', borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', outline: 'none'
                                }}
                            >
                                <option value="Não">Não</option>
                                <option value="Sim">Sim</option>
                            </select>
                        </div>
                    </div>

                    {/* Source & Schedule */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#ccc' }}>Origem</label>
                            <select
                                name="source" value={formData.source} onChange={handleChange}
                                style={{
                                    width: '100%', padding: '10px', borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', outline: 'none'
                                }}
                            >
                                <option value="Tráfego Pago">Tráfego Pago</option>
                                <option value="Instagram">Instagram</option>
                                <option value="Recomendação">Recomendação</option>
                                <option value="Prospecção Outbound">Prospecção Outbound</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#ccc' }}>Dia de Prospecção</label>
                            <select
                                name="prospectingDay" value={formData.prospectingDay} onChange={handleChange}
                                style={{
                                    width: '100%', padding: '10px', borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', outline: 'none'
                                }}
                            >
                                <option value="Segunda-feira">Segunda-feira</option>
                                <option value="Terça-feira">Terça-feira</option>
                                <option value="Quarta-feira">Quarta-feira</option>
                                <option value="Quinta-feira">Quinta-feira</option>
                                <option value="Sexta-feira">Sexta-feira</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <Save size={18} /> {initialData ? 'Salvar Alterações' : 'Salvar Lead'}
                    </button>

                </form>
            </div>
        </div>
    );
};

export default AddLeadModal;
