
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Search, Plus, Phone, Mail, Edit2, Trash2, Instagram, Briefcase } from 'lucide-react';
import { db } from '../services/database';
import AddClientModal from '../components/AddClientModal';

export default function Clients() {
    const [clients, setClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [activeTab, setActiveTab] = useState('Lead'); // Lead or Cliente

    useEffect(() => {
        refreshClients();
    }, []);

    const refreshClients = async () => {
        const allClients = await db.getAll('clients');
        // Ensure legacy data works by defaulting to 'Lead' if relationship is missing
        const processedClients = allClients.map(c => ({
            ...c,
            relationship: c.relationship || 'Lead'
        }));
        setClients(processedClients);
    };

    const handleSaveClient = async (clientData) => {
        if (editingClient) {
            await db.update('clients', editingClient.id, clientData);
        } else {
            await db.add('clients', clientData);
        }
        refreshClients();
        setEditingClient(null);
    };

    const handleEditClick = (client) => {
        setEditingClient(client);
        setIsModalOpen(true);
    };

    const handleDeleteClick = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir?')) {
            await db.delete('clients', id);
            refreshClients();
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingClient(null);
    };

    const filteredClients = clients.filter(client => {
        // if (client.status === 'Prospecção') return false; // REMOVED: Show all leads

        const isLeadTab = activeTab === 'Lead';
        const matchesTab = isLeadTab
            ? (client.relationship === 'Lead' || client.relationship === 'Contacted')
            : (client.relationship === 'Cliente');

        return matchesTab && (
            client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.contact.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Primeiro Contato': return '#2196F3'; // Blue
            case 'Fazer Follow up': return '#FFC107'; // Amber
            case 'Negociando': return '#FF9800'; // Orange
            case 'Reunião': return '#4CAF50'; // Green
            case 'Fechado': return '#9C27B0'; // Purple
            default: return '#9E9E9E';
        }
    };

    return (
        <Layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '700' }}>{activeTab === 'Lead' ? 'Gestão de Leads' : 'Carteira de Clientes'}</h1>
                <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={20} />
                    {activeTab === 'Lead' ? 'Novo Lead' : 'Novo Cliente'}
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <button
                    onClick={() => setActiveTab('Lead')}
                    style={{
                        background: 'transparent', border: 'none', padding: '10px 20px',
                        fontSize: '1.1rem', fontWeight: '600', cursor: 'pointer',
                        color: activeTab === 'Lead' ? 'var(--color-orange)' : '#666',
                        borderBottom: activeTab === 'Lead' ? '2px solid var(--color-orange)' : '2px solid transparent',
                        transition: '0.3s'
                    }}
                >
                    Leads (Prospecção)
                </button>
                <button
                    onClick={() => setActiveTab('Cliente')}
                    style={{
                        background: 'transparent', border: 'none', padding: '10px 20px',
                        fontSize: '1.1rem', fontWeight: '600', cursor: 'pointer',
                        color: activeTab === 'Cliente' ? 'var(--color-orange)' : '#666',
                        borderBottom: activeTab === 'Cliente' ? '2px solid var(--color-orange)' : '2px solid transparent',
                        transition: '0.3s'
                    }}
                >
                    Clientes (Ativos)
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '16px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Search size={20} color="#666" style={{ marginLeft: '10px' }} />
                <input
                    type="text" placeholder={`Buscar ${activeTab === 'Lead' ? 'lead' : 'cliente'} por nome, empresa ou contato...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ background: 'transparent !important', border: 'none !important', padding: '0 !important', fontSize: '1.1rem !important', width: '100%' }}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {filteredClients.length > 0 ? filteredClients.map(client => (
                    <div key={client.id} className="glass-panel glass-panel-interactive" style={{ padding: '30px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{
                                    width: '56px', height: '56px', borderRadius: '16px',
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.4rem', fontWeight: '700', color: 'white',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    {client.name[0]}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '4px' }}>{client.name}</h3>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <span style={{
                                            fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px',
                                            color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)',
                                            padding: '2px 8px', borderRadius: '4px'
                                        }}>
                                            {client.category || 'Lead'}
                                        </span>
                                        {client.role && (
                                            <span style={{
                                                fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px',
                                                color: 'var(--color-text-dim)'
                                            }}>
                                                <Briefcase size={10} /> {client.role}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleEditClick(client)} className="btn-ghost" style={{ padding: '8px', color: '#CCC' }} title="Editar">
                                    <Edit2 size={18} />
                                </button>
                                <button onClick={() => handleDeleteClick(client.id)} className="btn-ghost" style={{ padding: '8px', color: '#ff4d4d' }} title="Excluir">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <p style={{ color: 'var(--color-text-dim)', marginBottom: '4px', fontSize: '0.95rem' }}>
                            Contato: <span style={{ color: 'white' }}>{client.contact}</span>
                        </p>
                        {client.instagram && (
                            <a
                                href={`https://instagram.com/${client.instagram.replace('@', '')}`}
                                target="_blank" rel="noopener noreferrer"
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#E1306C', fontSize: '0.9rem', marginBottom: '20px', textDecoration: 'none', width: 'fit-content' }}
                            >
                                <Instagram size={14} /> {client.instagram}
                            </a>
                        )}
                        {!client.instagram && <div style={{ marginBottom: '20px' }}></div>}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#ccc', fontSize: '0.95rem' }}>
                                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,77,0,0.1)' }}><Mail size={16} color="var(--color-orange)" /></div>
                                {client.email}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#ccc', fontSize: '0.95rem' }}>
                                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,77,0,0.1)' }}><Phone size={16} color="var(--color-orange)" /></div>
                                <a
                                    href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}
                                    onMouseOver={(e) => e.target.style.color = 'var(--color-orange)'}
                                    onMouseOut={(e) => e.target.style.color = 'inherit'}
                                    title="Abrir no WhatsApp"
                                >
                                    {client.phone}
                                </a>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                            <span style={{
                                padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600',
                                backgroundColor: `${getStatusColor(client.status)}22`,
                                color: getStatusColor(client.status),
                                border: `1px solid ${getStatusColor(client.status)}44`
                            }}>
                                {client.status}
                            </span>
                            <span style={{ fontSize: '0.85rem', color: '#666' }}>{client.lastInteraction}</span>
                        </div>
                    </div>
                )) : (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: '#666', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '20px' }}>
                        <p style={{ fontSize: '1.1rem' }}>Nenhum {activeTab === 'Lead' ? 'lead' : 'cliente'} encontrado.</p>
                        <p style={{ fontSize: '0.9rem' }}>Clique em "Novo {activeTab === 'Lead' ? 'Lead' : 'Cliente'}" para adicionar.</p>
                    </div>
                )}
            </div>
            {isModalOpen && <AddClientModal onClose={handleCloseModal} onSave={handleSaveClient} initialData={editingClient} />}
        </Layout>
    );
}
