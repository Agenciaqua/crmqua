
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Calendar as CalendarIcon, Clock, User, Plus, Search, ChevronLeft, ChevronRight, Video, MapPin, Phone, FileSignature, Edit, Trash2 } from 'lucide-react';
import { db } from '../services/database';
import AddMeetingModal from '../components/AddMeetingModal';

const CalendarView = ({ meetings, onDateClick, onMeetingClick }) => {
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
        return meetings.filter(m => m.date === dateStr);
    };

    return (
        <div className="glass-panel" style={{ padding: '30px', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => changeMonth(-1)} className="btn-ghost"><ChevronLeft size={20} /></button>
                    <button onClick={() => changeMonth(1)} className="btn-ghost"><ChevronRight size={20} /></button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '10px', color: '#888' }}>
                {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(d => <div key={d} style={{ padding: '10px' }}>{d}</div>)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: days }).map((_, i) => {
                    const day = i + 1;
                    const dayMeetings = getMeetingsForDay(day);
                    const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                    return (
                        <div
                            key={day}
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
                            <div style={{ textAlign: 'right', marginBottom: '5px', color: isToday ? 'var(--color-orange)' : '#666', fontWeight: isToday ? '700' : '400' }}>{day}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {dayMeetings.slice(0, 3).map(m => (
                                    <div
                                        key={m.id}
                                        onClick={(e) => { e.stopPropagation(); onMeetingClick(m); }}
                                        style={{
                                            fontSize: '0.65rem',
                                            background: 'var(--glass-bg)',
                                            padding: '4px',
                                            borderRadius: '4px',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            borderLeft: '2px solid var(--color-orange)'
                                        }}
                                        title={`${m.time} - ${m.title}`}
                                    >
                                        {m.time} {m.title}
                                    </div>
                                ))}
                                {dayMeetings.length > 3 && <div style={{ fontSize: '0.65rem', color: '#888', textAlign: 'center' }}>+ {dayMeetings.length - 3} mais</div>}
                            </div>
                        </div>
                    );
                })}
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
        setMeetings(allMeetings.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)));
        setClients(allClients);
    };

    const handleSaveMeeting = async (meeting) => {
        if (meeting.id) {
            await db.update('meetings', meeting.id, meeting);
        } else {
            await db.add('meetings', meeting);
        }
        refreshData();
        setEditingMeeting(null);
        setInitialModalDate(null);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Excluir este agendamento?')) {
            await db.delete('meetings', id);
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '700' }}>Reuniões & Agenda</h1>
                    <p style={{ color: '#888' }}>Gerencie seus compromissos com leads e parceiros.</p>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
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
                <div className="glass-panel" style={{ padding: '20px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <Search size={20} color="#666" />
                    <input
                        placeholder="Filtrar por título ou cliente..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: 'white', width: '300px', outline: 'none' }}
                    />
                </div>
            )}

            {viewMode === 'list' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {filteredMeetings.length > 0 ? filteredMeetings.map(m => (
                        <div key={m.id} className="glass-panel glass-panel-interactive" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                                <div style={{
                                    padding: '15px', background: 'rgba(255, 77, 0, 0.1)', borderRadius: '15px',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px', border: '1px solid rgba(255, 77, 0, 0.2)'
                                }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-orange)', textTransform: 'uppercase' }}>
                                        {new Date(m.date + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                                    </span>
                                    <span style={{ fontSize: '1.5rem', fontWeight: '700' }}>{m.date.split('-')[2]}</span>
                                </div>

                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>{m.title}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', color: '#AAA' }}>
                                            {getTypeIcon(m.type)} {m.type}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '20px', color: '#888', fontSize: '0.9rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} /> {getClientName(m.clientId)}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> {m.time} ({m.duration})</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
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
