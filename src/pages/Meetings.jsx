
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Calendar as CalendarIcon, Clock, User, Plus, Search, ChevronLeft, ChevronRight, Video, MapPin, Phone, FileSignature, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { db } from '../services/database';
import AddMeetingModal from '../components/AddMeetingModal';

const isDone = (status) => ['Realizada', 'Fechou', 'Não Fechou'].includes(status);

const CalendarView = ({ meetings, onDateClick, onMeetingClick, onCompleteMeeting }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentDate);
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    const changeMonth = (offset) => {
        setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + offset)));
    };

    const getMeetingsForDay = (day) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return meetings.filter(m => {
            if (!m.date) return false;
            // Robustly handle YYYY-MM-DD or ISO strings
            const mDate = m.date.substring(0, 10);
            return mDate === dateStr;
        });
    };

    return (
        <div className="glass-panel" style={{ height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => changeMonth(-1)} className="btn-ghost"><ChevronLeft size={20} /></button>
                    <button onClick={() => changeMonth(1)} className="btn-ghost"><ChevronRight size={20} /></button>
                </div>
            </div>

            <div>
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '10px', color: '#888' }}>
                        {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(d => <div key={d} className="calendar-header-mobile" style={{ padding: '10px' }}>{d}</div>)}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                        {Array.from({ length: days }).map((_, i) => {
                            const day = i + 1;
                            const dayMeetings = getMeetingsForDay(day);
                            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                            return (
                                <div
                                    key={day}
                                    className="calendar-cell-mobile"
                                    onClick={() => onDateClick(dateStr)}
                                    style={{
                                        minHeight: '100px',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: '12px',
                                        background: isToday ? 'rgba(255, 77, 0, 0.05)' : 'rgba(255,255,255,0.02)',
                                        padding: '10px',
                                        cursor: 'pointer',
                                        transition: '0.2s',
                                        position: 'relative'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-orange)'}
                                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
                                >
                                    <div className="calendar-header-mobile" style={{ textAlign: 'right', marginBottom: '5px', color: isToday ? 'var(--color-orange)' : '#666', fontWeight: isToday ? '700' : '400' }}>{day}</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {dayMeetings.slice(0, 3).map(m => (
                                            <div
                                                key={m.id}
                                                className="calendar-text-mobile"
                                                onClick={(e) => { e.stopPropagation(); onMeetingClick(m); }}
                                                style={{
                                                    fontSize: '0.65rem',
                                                    background: isDone(m.status) ? 'rgba(76, 175, 80, 0.1)' : 'var(--glass-bg)',
                                                    padding: '4px',
                                                    borderRadius: '4px',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    borderLeft: `2px solid ${isDone(m.status) ? '#4CAF50' : 'var(--color-orange)'}`,
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    color: isDone(m.status) ? '#888' : 'white',
                                                    textDecoration: isDone(m.status) ? 'line-through' : 'none'
                                                }}
                                                title={`${m.time} - ${m.title}`}
                                            >
                                                <span>{m.time}</span>
                                                {!isDone(m.status) && (
                                                    <div style={{ display: 'flex', gap: '2px' }}>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onCompleteMeeting(m, 'Fechou'); }}
                                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#4CAF50', padding: 0 }}
                                                            title="Fechou Negócio"
                                                        >
                                                            <CheckCircle size={10} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onCompleteMeeting(m, 'Não Fechou'); }}
                                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#f44336', padding: 0 }}
                                                            title="Não Fechou"
                                                        >
                                                            <XCircle size={10} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {dayMeetings.length > 3 && <div className="calendar-more-mobile" style={{ fontSize: '0.65rem', color: '#888', textAlign: 'center' }}>+ {dayMeetings.length - 3} mais</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function Meetings() {
    const [meetings, setMeetings] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
    const [initialModalDate, setInitialModalDate] = useState(null);

    const [clients, setClients] = useState([]);

    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = async () => {
        const [allMeetings, allClients] = await Promise.all([
            db.getAll('meetings'),
            db.getAll('clients')
        ]);
        const user = JSON.parse(localStorage.getItem('crm_user')) || {};

        const userMeetings = allMeetings.filter(m =>
            (m.assigneeId && user.id && String(m.assigneeId) === String(user.id)) ||
            (m.ownerId && user.id && String(m.ownerId) === String(user.id))
        );

        const userClients = allClients.filter(c =>
            (c.ownerId && user.id && String(c.ownerId) === String(user.id)) ||
            c.status === 'Fechado'
        );

        setMeetings(userMeetings.sort((a, b) => {
            const da = a.date ? a.date.substring(0, 10) : '0000-00-00';
            const db = b.date ? b.date.substring(0, 10) : '0000-00-00';
            return (da + a.time).localeCompare(db + b.time);
        }));
        setClients(userClients);
    };

    const handleSaveMeeting = async (meeting) => {
        try {
            if (meeting.id) {
                await db.update('meetings', meeting.id, meeting);
            } else {
                await db.add('meetings', meeting);
            }
            refreshData();
            setEditingMeeting(null);
            setInitialModalDate(null);
        } catch (error) {
            console.error("Erro ao salvar reunião:", error);
            alert("Erro fatal ao salvar a reunião no banco de dados. " + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Excluir este agendamento?')) {
            await db.delete('meetings', id);
            refreshData();
        }
    };

    const handleCompleteMeeting = async (meeting, outcome) => {
        const title = outcome === 'Fechou'
            ? `Marcar a reunião "${meeting.title}" como REALIZADA COM SUCESSO (Cliente Fechou)?`
            : `Marcar a reunião "${meeting.title}" como REALIZADA (Não Fechou)?`;
        if (window.confirm(title)) {
            await db.update('meetings', meeting.id, { status: outcome });
            if (outcome === 'Fechou' && meeting.clientId) {
                const client = clients.find(c => c.id === meeting.clientId);
                if (client) await db.update('clients', meeting.clientId, { status: 'Fechado' });
            }
            refreshData();
        }
    };

    const handleDateClick = (dateStr) => {
        setInitialModalDate(dateStr);
        setEditingMeeting(null);
        setIsModalOpen(true);
    };

    const getClientName = (id) => {
        const c = clients.find(client => client.id === id);
        return c ? c.name : 'N/A';
    };

    const getTypeIcon = (type) => {
        if (type.includes('Video')) return <Video size={18} color="#2196F3" />;
        if (type.includes('Presencial') || type.includes('Visita')) return <MapPin size={18} color="#4CAF50" />;
        if (type.includes('Ligação')) return <Phone size={18} color="#FFC107" />;
        if (type.includes('Contrato')) return <FileSignature size={18} color="#E91E63" />;
        return <CalendarIcon size={18} />;
    };

    const filteredMeetings = meetings.filter(m =>
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getClientName(m.clientId).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '700' }}>Reuniões & Agenda</h1>
                    <p style={{ color: '#888' }}>Gerencie seus compromissos com leads e parceiros.</p>
                </div>

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div className="glass-panel" style={{ padding: '4px', display: 'flex', gap: '4px' }}>
                        <button
                            onClick={() => setViewMode('list')}
                            className={viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}
                            style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                        >
                            Lista
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={viewMode === 'calendar' ? 'btn-primary' : 'btn-ghost'}
                            style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                        >
                            Calendário
                        </button>
                    </div>
                    <button onClick={() => { setInitialModalDate(null); setEditingMeeting(null); setIsModalOpen(true); }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={20} /> Agendar
                    </button>
                </div>
            </div>

            {viewMode === 'list' && (
                <div className="glass-panel" style={{ padding: '20px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                    <Search size={20} color="#666" />
                    <input
                        placeholder="Filtrar por título ou cliente..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: 'white', flex: 1, minWidth: '150px', outline: 'none' }}
                    />
                </div>
            )}

            {viewMode === 'list' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {filteredMeetings.length > 0 ? filteredMeetings.map(m => (
                        <div key={m.id} className="glass-panel glass-panel-interactive flex-mobile-col" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', opacity: isDone(m.status) ? 0.6 : 1 }}>
                            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div style={{
                                    padding: '15px', background: isDone(m.status) ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 77, 0, 0.1)', borderRadius: '15px',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px', border: `1px solid ${isDone(m.status) ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 77, 0, 0.2)'}`
                                }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: isDone(m.status) ? '#4CAF50' : 'var(--color-orange)', textTransform: 'uppercase' }}>
                                        {(() => {
                                            try {
                                                const d = m.date ? new Date(m.date.substring(0, 10) + 'T12:00:00') : new Date();
                                                return d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
                                            } catch (e) { return 'ERR'; }
                                        })()}
                                    </span>
                                    <span style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                                        {m.date ? m.date.substring(0, 10).split('-')[2] : '--'}
                                    </span>
                                </div>

                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: '600', textDecoration: isDone(m.status) ? 'line-through' : 'none', color: isDone(m.status) ? '#888' : 'white' }}>{m.title}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', color: '#AAA' }}>
                                            {getTypeIcon(m.type)} {m.type}
                                        </div>
                                        {isDone(m.status) && (
                                            <span style={{ fontSize: '0.7rem', color: m.status === 'Não Fechou' ? '#f44336' : '#4CAF50', backgroundColor: m.status === 'Não Fechou' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(76, 175, 80, 0.1)', padding: '2px 8px', borderRadius: '12px', border: `1px solid ${m.status === 'Não Fechou' ? 'rgba(244, 67, 54, 0.2)' : 'rgba(76, 175, 80, 0.2)'}` }}>
                                                {m.status === 'Fechou' ? 'Fechou Negócio' : (m.status === 'Não Fechou' ? 'Não Fechou' : 'Realizada')}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '20px', color: '#888', fontSize: '0.9rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} /> {getClientName(m.clientId)}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> {m.time} ({m.duration})</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                {!isDone(m.status) && (
                                    <>
                                        <button onClick={() => handleCompleteMeeting(m, 'Fechou')} className="btn-ghost" title="Fechou Negócio" style={{ color: '#4CAF50' }}><CheckCircle size={18} /></button>
                                        <button onClick={() => handleCompleteMeeting(m, 'Não Fechou')} className="btn-ghost" title="Não Fechou" style={{ color: '#f44336' }}><XCircle size={18} /></button>
                                    </>
                                )}
                                <button onClick={() => { setEditingMeeting(m); setIsModalOpen(true); }} className="btn-ghost" title="Editar"><Edit size={18} /></button>
                                <button onClick={() => handleDelete(m.id)} className="btn-ghost" title="Excluir"><Trash2 size={18} color="#ff4d4d" /></button>
                            </div>
                        </div>
                    )) : (
                        <div style={{ textAlign: 'center', padding: '100px', color: '#666' }}>
                            <CalendarIcon size={64} style={{ marginBottom: '20px', opacity: 0.2 }} />
                            <p>Nenhuma reunião agendada para este filtro.</p>
                        </div>
                    )}
                </div>
            ) : (
                <CalendarView
                    meetings={meetings}
                    onDateClick={handleDateClick}
                    onMeetingClick={(m) => { setEditingMeeting(m); setIsModalOpen(true); }}
                    onCompleteMeeting={handleCompleteMeeting}
                />
            )}

            {(isModalOpen || editingMeeting) && (
                <AddMeetingModal
                    onClose={() => { setIsModalOpen(false); setEditingMeeting(null); setInitialModalDate(null); }}
                    onSave={handleSaveMeeting}
                    initialData={editingMeeting ? editingMeeting : (initialModalDate ? {
                        title: '',
                        clientId: '',
                        date: initialModalDate,
                        time: '09:00',
                        duration: '60 min',
                        type: 'Reunião Presencial',
                        notes: '',
                        status: 'scheduled'
                    } : null)}
                />
            )}
        </Layout>
    );
}
