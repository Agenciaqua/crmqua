
import React, { useState, useEffect } from 'react';
import { db } from '../services/database';
import { useAuth } from '../context/AuthContext';
import { X, Calendar, Clock, User, Tag, AlignLeft, CheckCircle } from 'lucide-react';

const AddMeetingModal = ({ onClose, onSave, initialData }) => {
    const { user } = useAuth();
    const [meeting, setMeeting] = useState({
        title: '',
        clientId: '',
        date: '',
        time: '',
        duration: '60 min',
        type: 'Reunião Presencial',
        notes: '',
        status: 'scheduled'
    });

    const [clients, setClients] = useState([]);

    useEffect(() => {
        const loadClients = async () => {
            const allClients = await db.getAll('clients');
            setClients(allClients);
        };
        loadClients();

        if (initialData) {
            setMeeting(initialData);
        }
    }, [initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...meeting,
            ownerId: initialData?.ownerId || user?.id
        });
        onClose();
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
            <div className="glass-panel" style={{ padding: '40px', width: '550px', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '300' }}>{initialData ? 'Editar Compromisso' : 'Agendar Reunião'}</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', color: '#AAA', marginBottom: '8px', fontSize: '0.9rem' }}>Assunto / Título</label>
                        <input
                            required
                            placeholder="Ex: Apresentação de Proposta - QUA"
                            value={meeting.title}
                            onChange={e => setMeeting({ ...meeting, title: e.target.value })}
                            style={{ width: '100%', fontSize: '1.1rem' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#AAA', marginBottom: '8px', fontSize: '0.9rem' }}>
                                <User size={14} /> Cliente / Lead
                            </label>
                            <select required value={meeting.clientId} onChange={e => setMeeting({ ...meeting, clientId: e.target.value })} style={{ width: '100%' }}>
                                <option value="">Selecione...</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#AAA', marginBottom: '8px', fontSize: '0.9rem' }}>
                                <Tag size={14} /> Tipo de Reunião
                            </label>
                            <select value={meeting.type} onChange={e => setMeeting({ ...meeting, type: e.target.value })} style={{ width: '100%' }}>
                                <option>Reunião Presencial</option>
                                <option>Videochamada (Google Meet/Zoom)</option>
                                <option>Ligação Telefônica</option>
                                <option>Visita ao Imóvel</option>
                                <option>Assinatura de Contrato</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#AAA', marginBottom: '8px', fontSize: '0.9rem' }}>
                                <Calendar size={14} /> Data
                            </label>
                            <input required type="date" value={meeting.date} onChange={e => setMeeting({ ...meeting, date: e.target.value })} style={{ width: '100%' }} />
                        </div>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#AAA', marginBottom: '8px', fontSize: '0.9rem' }}>
                                <Clock size={14} /> Horário
                            </label>
                            <input required type="time" value={meeting.time} onChange={e => setMeeting({ ...meeting, time: e.target.value })} style={{ width: '100%' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', color: '#AAA', marginBottom: '8px', fontSize: '0.9rem' }}>Duração</label>
                            <select value={meeting.duration} onChange={e => setMeeting({ ...meeting, duration: e.target.value })} style={{ width: '100%' }}>
                                <option>15 min</option>
                                <option>30 min</option>
                                <option>45 min</option>
                                <option>60 min</option>
                                <option>90 min</option>
                                <option>2 horas</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#AAA', marginBottom: '8px', fontSize: '0.9rem' }}>
                            <AlignLeft size={14} /> Pauta / Notas
                        </label>
                        <textarea
                            placeholder="O que será discutido?"
                            value={meeting.notes}
                            onChange={e => setMeeting({ ...meeting, notes: e.target.value })}
                            style={{
                                width: '100%', minHeight: '100px', padding: '12px',
                                background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                                color: 'white', borderRadius: '8px', resize: 'vertical'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                        <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1, border: '1px solid rgba(255,255,255,0.2)' }}>Cancelar</button>
                        <button type="submit" className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <CheckCircle size={18} />
                            {initialData ? 'Salvar Alterações' : 'Confirmar Agendamento'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddMeetingModal;
