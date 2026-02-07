
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { db } from '../services/database';
import { ArrowUpRight, ArrowDownRight, Users, CheckCircle, DollarSign, Activity, Plus, Upload, UserPlus, FileText, Calendar, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AddClientModal from '../components/AddClientModal';
import AddTaskModal from '../components/AddTaskModal';

const data = [
    { name: 'Jan', vendas: 4000 },
    { name: 'Fev', vendas: 3000 },
    { name: 'Mar', vendas: 2000 },
    { name: 'Abr', vendas: 2780 },
    { name: 'Mai', vendas: 1890 },
    { name: 'Jun', vendas: 2390 },
];

const StatCard = ({ title, value, change, icon: Icon }) => (
    <div className="glass-panel glass-panel-interactive" style={{
        padding: '24px',
        flex: 1,
        position: 'relative',
        overflow: 'hidden'
    }}>
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.05, transform: 'rotate(15deg)' }}>
            <Icon size={120} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-orange)'
            }}>
                <Icon size={20} />
            </div>
        </div>

        <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '4px', letterSpacing: '-1px' }}>{value}</div>
        <h3 style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem', fontWeight: '500' }}>{title}</h3>
    </div>
);

const QuickAction = ({ icon: Icon, label, onClick }) => (
    <button onClick={onClick} className="glass-panel glass-panel-interactive" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '20px', gap: '10px', border: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(255,255,255,0.02)', width: '100%'
    }}>
        <div style={{
            padding: '12px', borderRadius: '50%', background: 'rgba(255, 77, 0, 0.1)',
            color: 'var(--color-orange)'
        }}>
            <Icon size={24} />
        </div>
        <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{label}</span>
    </button>
);

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ clients: 0, pendingTasks: 0, meetings: 0 });
    const [recentClients, setRecentClients] = useState([]);
    const [todaysTasks, setTodaysTasks] = useState([]);
    const [upcomingMeetings, setUpcomingMeetings] = useState([]);
    const [chartData, setChartData] = useState([]);

    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    // Task Modal Removed from Dashboard
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        const handler = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            console.log('👋 PWA Install Prompt Captured!');
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            alert('A instalação não está disponível no momento. Verifique se já está instalado ou use o menu do navegador "Adicionar à Tela Inicial".');
            return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    const refreshData = async () => {
        try {
            const [clients, tasks, meetings] = await Promise.all([
                db.getAll('clients'),
                db.getAll('tasks'),
                db.getAll('meetings')
            ]);

            const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
            const now = new Date();

            // Filter upcoming meetings (today onwards)
            const futureMeetings = meetings
                .filter(m => m.date >= todayStr)
                .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

            setStats({
                clients: clients.filter(c => c.status !== 'Inativo').length,
                pendingTasks: tasks.filter(t => t.status === 'todo' || t.status === 'inprogress').length,
                meetings: futureMeetings.length
            });
            setRecentClients(clients.slice(-5).reverse());
            // Filter tasks for today that are NOT done
            setTodaysTasks(tasks.filter(t => t.dueDate === todayStr && t.status !== 'done'));

            // Take top 3 for the widget
            setUpcomingMeetings(futureMeetings.slice(0, 3));

            // Calculate Leads Contacted This Week
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday

            const weekData = [];
            const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

            for (let i = 0; i < 7; i++) {
                const d = new Date(startOfWeek);
                d.setDate(startOfWeek.getDate() + i);
                const dateStrPT = d.toLocaleDateString('pt-BR'); // DD/MM/YYYY matching client.lastInteraction

                // Count where interaction happened on this day AND they are marked as Contacted (moved from prospecting)
                const count = clients.filter(c =>
                    c.lastInteraction === dateStrPT &&
                    (c.relationship === 'Contacted' || c.status === 'Lead')
                ).length;

                weekData.push({ name: days[i], leads: count });
            }
            setChartData(weekData);
        } catch (e) {
            console.error("Dashboard Load Error:", e);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleAddClient = async (client) => {
        await db.add('clients', client);
        refreshData();
    };

    const handleAddTask = async (task) => {
        // Modal already formats the task correctly with ownerId
        // Just ensure assigneeId is a number if it exists
        const formattedTask = {
            ...task,
            assigneeId: task.assigneeId ? Number(task.assigneeId) : null
        };
        await db.add('tasks', formattedTask);
        refreshData();
    };

    const handleCompleteTask = async (task) => {
        await db.update('tasks', task.id, { status: 'done' });
        refreshData();
    };

    const isIOS = () => {
        return /iPhone|iPad|iPod/i.test(navigator.userAgent);
    };

    return (
        <Layout>
            <header style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '8px' }}>
                    Olá, <span className="text-neon">{user.name.split(' ')[0]}</span>
                </h1>
                <p style={{ color: 'var(--color-text-dim)', fontSize: '1.1rem' }}>Aqui está o panorama de hoje.</p>
            </header>

            {/* Quick Actions Section */}
            <section style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px', color: '#AAA' }}>Ações Rápidas</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                    <QuickAction icon={UserPlus} label="Novo Lead" onClick={() => setIsClientModalOpen(true)} />
                    {/* Task Quick Action Removed per user request */}
                    <QuickAction icon={Upload} label="Enviar Arquivo" onClick={() => navigate('/arquivos')} />
                    {(user.role === 'Gestor' || user.role === 'manager') && (
                        <QuickAction icon={FileText} label="Ver Relatórios" onClick={() => navigate('/relatorios')} />
                    )}

                    {/* Install App Button - Shows for Everyone (Smart Logic) */}
                    <QuickAction
                        icon={ArrowDownRight}
                        label="Instalar App"
                        onClick={() => {
                            if (deferredPrompt) {
                                handleInstallClick();
                            } else if (isIOS()) {
                                alert("Para instalar no iPhone:\n1. Toque no botão de Compartilhar (quadrado com seta).\n2. Role para baixo e toque em 'Adicionar à Tela de Início'.");
                            } else {
                                alert("Para instalar:\nToque no menu do navegador (três pontos) e selecione 'Adicionar à Tela Inicial' ou 'Instalar Aplicativo'.");
                            }
                        }}
                        style={{ opacity: 1 }}
                    />
                </div>
            </section>

            <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' }}>
                <StatCard title="Leads Ativos" value={stats.clients} change="+12%" icon={Users} />
                <StatCard title="Reuniões Agendadas" value={stats.meetings} change="Futuras" icon={Calendar} />
                <StatCard title="Tarefas Pendentes" value={stats.pendingTasks} change="-5%" icon={CheckCircle} />
            </div>

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'start' }}>

                {/* Left Column - Leads Chart */}
                <div className="glass-panel" style={{
                    flex: 2,
                    minWidth: '400px',
                    padding: '30px',
                }}>
                    <h3 style={{ marginBottom: '30px', fontSize: '1.3rem', fontWeight: '600' }}>Leads Contactados (Semana)</h3>
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="name" stroke="#666" axisLine={false} tickLine={false} dy={10} />
                            <YAxis stroke="#666" axisLine={false} tickLine={false} />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{
                                    backgroundColor: 'rgba(20,20,20,0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 20px rgba(0,0,0,0.5)'
                                }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Bar dataKey="leads" radius={[6, 6, 6, 6]} barSize={40} fill="url(#colorOrange)" />
                            <defs>
                                <linearGradient id="colorOrange" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#FF4D00" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#FF4D00" stopOpacity={0.6} />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Right Column - Tasks & Leads */}
                <div style={{ flex: 1, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* UPCOMING APPOINTMENTS WIDGET */}
                    <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(255, 77, 0, 0.3)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Calendar size={20} color="var(--color-orange)" />
                                Próximas Reuniões
                            </h3>
                            <button onClick={() => navigate('/reunioes')} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>
                                <ArrowUpRight size={18} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {upcomingMeetings.length > 0 ? upcomingMeetings.map(meeting => (
                                <div key={meeting.id} style={{
                                    background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.05)', transition: '0.2s',
                                    display: 'flex', gap: '12px'
                                }}>
                                    <div style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        padding: '0 10px', borderRight: '1px solid rgba(255,255,255,0.1)', minWidth: '50px'
                                    }}>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-orange)', textTransform: 'uppercase', fontWeight: '700' }}>
                                            {new Date(meeting.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                                        </span>
                                        <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>
                                            {meeting.date.split('-')[2]}
                                        </span>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '4px' }}>{meeting.title}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#AAA', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Clock size={12} /> {meeting.time} ({meeting.duration})
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', color: '#666', padding: '20px 0', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                    Nenhuma reunião agendada.<br />Aproveite o tempo livre! ☕
                                </div>
                            )}
                        </div>
                    </div>

                    {/* TASKS TODAY WIDGET */}
                    <div className="glass-panel" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <CheckCircle size={20} color="var(--color-orange)" />
                                Para Hoje
                            </h3>
                            <span style={{ fontSize: '0.8rem', color: '#666', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                                {todaysTasks.length}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {todaysTasks.length > 0 ? todaysTasks.map(task => (
                                <div key={task.id} style={{
                                    background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px',
                                    display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(255,255,255,0.05)',
                                    transition: '0.2s'
                                }}>
                                    <button
                                        onClick={() => handleCompleteTask(task)}
                                        style={{
                                            width: '22px', height: '22px', borderRadius: '50%', border: '2px solid #555',
                                            background: 'transparent', cursor: 'pointer', flexShrink: 0,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                        title="Concluir"
                                        onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-orange)'}
                                        onMouseOut={(e) => e.currentTarget.style.borderColor = '#555'}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{task.title}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#888', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{task.priority === 'high' ? 'Alta Prioridade' : 'Normal'}</span>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', color: '#666', padding: '20px 0', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                    Nenhuma tarefa pendente para hoje.<br />Bom trabalho! 🚀
                                </div>
                            )}
                        </div>

                        {todaysTasks.length > 0 &&
                            <button onClick={() => navigate('/tarefas')} style={{ width: '100%', marginTop: '16px', fontSize: '0.8rem', color: '#888', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                                Ver todas
                            </button>
                        }
                    </div>

                    {/* Recent Leads Widget */}
                    <div className="glass-panel" style={{ padding: '24px' }}>
                        <h3 style={{ marginBottom: '20px', fontSize: '1.2rem', fontWeight: '600' }}>Últimos Leads</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {recentClients.map((client) => (
                                <div key={client.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '10px',
                                            background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: '700', fontSize: '0.9rem', color: '#FFF'
                                        }}>
                                            {client.name[0]}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: '500', color: 'white' }}>{client.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>{client.category || 'Lead'}</div>
                                        </div>
                                    </div>
                                    <span style={{
                                        fontSize: '0.65rem',
                                        color: 'var(--color-orange)',
                                        background: 'rgba(255, 77, 0, 0.1)',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontWeight: '600'
                                    }}>
                                        {client.status}
                                    </span>
                                </div>
                            ))}
                            {recentClients.length === 0 && <p style={{ color: '#666', fontSize: '0.9rem' }}>Nenhum lead recente.</p>}
                        </div>

                        <button onClick={() => navigate('/clientes')} className="btn-ghost" style={{ width: '100%', marginTop: '16px', color: 'var(--color-orange)', fontSize: '0.9rem' }}>
                            Ver Todos
                        </button>
                    </div>

                </div>
            </div>

            {isClientModalOpen && <AddClientModal onClose={() => setIsClientModalOpen(false)} onSave={handleAddClient} />}
        </Layout>
    );
}
