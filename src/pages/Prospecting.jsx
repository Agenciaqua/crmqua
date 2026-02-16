
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { db } from '../services/database';
import { Plus, GripVertical, Target, MoreHorizontal, MessageSquare, Phone, Globe, Instagram, Move, UserPlus, Check, Edit2, Trash2 } from 'lucide-react';
import ImportListModal from '../components/ImportListModal';
import AddLeadModal from '../components/AddLeadModal';

const DAYS = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];

const Prospecting = () => {
    const [leads, setLeads] = useState([]);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
    const [draggedLead, setDraggedLead] = useState(null);
    const [editingLead, setEditingLead] = useState(null);

    const refreshData = async () => {
        const allClients = await db.getAll('clients');
        // Filter specifically for leads in prospecting stage if needed, 
        // or just use the prospectingDay field. 
        // For now, let's assume any lead with a prospectingDay is strictly for this board,
        // OR we can make this board manage ALL leads but grouped by day.
        // Let's filter by status "Prospecção" OR those that have a day assigned.
        const prospectingLeads = allClients.filter(c => c.prospectingDay || c.status === 'Prospecção');
        setLeads(prospectingLeads);
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleImportSuccess = () => {
        refreshData();
    };

    const onDragStart = (e, lead) => {
        setDraggedLead(lead);
        e.dataTransfer.effectAllowed = "move";
        // e.dataTransfer.setDragImage(e.target, 20, 20); // Optional custom drag image
    };

    const onDragOver = (e) => {
        e.preventDefault();
    };

    const onDrop = async (e, day) => {
        e.preventDefault();

        // Check Limit
        const textLeadsOnDay = leads.filter(l => l.prospectingDay === day).length;
        if (textLeadsOnDay >= 30) {
            alert(`O dia ${day} já atingiu o limite de 30 leads.`);
            setDraggedLead(null);
            return;
        }

        if (draggedLead && draggedLead.prospectingDay !== day) {
            await db.update('clients', draggedLead.id, { prospectingDay: day });
            refreshData();
        }
        setDraggedLead(null);
    };

    const handleContacted = async (lead) => {
        if (window.confirm(`Marcar ${lead.name} como contactado?`)) {
            try {
                const todayISO = new Date().toISOString().split('T')[0];
                await db.update('clients', lead.id, {
                    status: 'Fazer Follow up', // Update status to reflect next step
                    relationship: 'Lead', // Ensure it stays in Lead tab
                    prospectingDay: null, // Remove from board
                    lastInteraction: todayISO
                });
                refreshData();
            } catch (error) {
                console.error("Erro ao atualizar lead:", error);
                alert("Erro ao atualizar lead: " + error.message);
            }
        }
    };

    const getLeadsByDay = (day) => {
        return leads.filter(l => l.prospectingDay === day);
    };

    const handleEdit = (lead) => {
        setEditingLead(lead);
        setIsAddLeadModalOpen(true); // Using the same modal for edit
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este lead?')) {
            await db.delete('clients', id);
            refreshData();
        }
    };

    // Helper to generate a default day if none exists (for old records if any)
    const normalizedLeads = leads.map(l => ({ ...l, prospectingDay: l.prospectingDay || 'Segunda-feira' }));

    return (
        <Layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Target color="var(--color-orange)" size={32} />
                        Prospecção Semanal
                    </h1>
                    <p style={{ color: 'var(--color-text-dim)' }}>Organize seus ataques de vendas por dia da semana.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => setIsAddLeadModalOpen(true)}
                        className="btn-ghost"
                        style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                        <UserPlus size={20} /> Novo Lead Manual
                    </button>
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="btn-primary"
                        style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Plus size={20} /> Importar Lista
                    </button>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, minmax(300px, 1fr))',
                gap: '16px',
                height: 'calc(100vh - 200px)',
                overflowX: 'auto',
                paddingBottom: '20px'
            }}>
                {DAYS.map(day => (
                    <div
                        key={day}
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, day)}
                        style={{
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex', flexDirection: 'column'
                        }}
                    >
                        {/* Column Header */}
                        <div style={{
                            padding: '16px',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>{day}</h3>
                            <span style={{
                                background: 'rgba(255,255,255,0.05)',
                                padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', color: '#888'
                            }}>
                                {leads.filter(l => (l.prospectingDay || 'Segunda-feira') === day).length}
                            </span>
                        </div>

                        {/* Cards Area */}
                        <div style={{ padding: '12px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {leads
                                .filter(l => (l.prospectingDay || 'Segunda-feira') === day)
                                .map(lead => (
                                    <div
                                        key={lead.id}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, lead)}
                                        className="glass-panel"
                                        style={{
                                            padding: '16px',
                                            cursor: 'grab',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            background: 'rgba(20,20,20,0.6)',
                                            position: 'relative'
                                        }}
                                    >
                                        <div style={{ position: 'absolute', top: '16px', right: '12px', color: '#444' }}>
                                            <GripVertical size={16} />
                                        </div>

                                        <div style={{ marginBottom: '8px', paddingRight: '20px' }}>
                                            <div style={{ fontSize: '0.95rem', fontWeight: '600' }}>{lead.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-orange)' }}>{lead.businessType || lead.role || 'Lead'}</div>
                                            {lead.source && (
                                                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                                                    Origem: {lead.source}
                                                </div>
                                            )}
                                            {lead.lastInteraction && (
                                                <div style={{ fontSize: '0.65rem', color: '#666', marginTop: '4px', fontStyle: 'italic' }}>
                                                    {(() => {
                                                        const cleanDate = lead.lastInteraction.substring(0, 10);
                                                        const [y, m, d] = cleanDate.split('-');
                                                        return d && m && y && y.length === 4 ? `${d}/${m}/${y}` : lead.lastInteraction;
                                                    })()}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                {lead.phone && (
                                                    <a href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" title="WhatsApp" style={{ color: '#888', transition: '0.2s' }}>
                                                        <Phone size={14} />
                                                    </a>
                                                )}
                                                {lead.instagram && (
                                                    <a href={`https://instagram.com/${lead.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" title="Instagram" style={{ color: '#888', transition: '0.2s' }}>
                                                        <Instagram size={14} />
                                                    </a>
                                                )}
                                                {lead.website && (
                                                    <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer" title="Site" style={{ color: '#888', transition: '0.2s' }}>
                                                        <Globe size={14} />
                                                    </a>
                                                )}
                                            </div>

                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(lead); }}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    title="Editar"
                                                    style={{
                                                        background: 'transparent', border: 'none',
                                                        cursor: 'pointer', color: '#666'
                                                    }}
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(lead.id); }}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    title="Excluir"
                                                    style={{
                                                        background: 'transparent', border: 'none',
                                                        cursor: 'pointer', color: '#666'
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleContacted(lead); }}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    title="Marcar como Contactado"
                                                    style={{
                                                        background: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)',
                                                        cursor: 'pointer', color: '#4caf50', borderRadius: '50%', width: '24px', height: '24px',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}
                                                >
                                                    <Check size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                ))}
            </div>

            {isImportModalOpen && <ImportListModal onClose={() => setIsImportModalOpen(false)} onSave={handleImportSuccess} />}
            {isAddLeadModalOpen && (
                <AddLeadModal
                    onClose={() => { setIsAddLeadModalOpen(false); setEditingLead(null); }}
                    onSave={handleImportSuccess}
                    initialData={editingLead}
                />
            )}
        </Layout>
    );
};

export default Prospecting;
