import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { db } from '../services/database';
import {
    BarChart2, Calendar, CheckCircle, Clock,
    Users, Briefcase, FileText, Download
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function Reports() {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');

    const [rawData, setRawData] = useState({
        tasks: [],
        meetings: [],
        clients: [],
        files: []
    });

    const [metrics, setMetrics] = useState({
        tasks: { total: 0, completed: 0, pending: 0 },
        meetings: { total: 0, done: 0, scheduled: 0 },
        clients: { total: 0, negotiation: 0, closed: 0 },
        files: { total: 0 }
    });
    const reportRef = useRef(null);

    // Set default dates (last 30 days) on mount and fetch users
    useEffect(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        setEndDate(end.toISOString().split('T')[0]);
        setStartDate(start.toISOString().split('T')[0]);

        // Fetch users and all data
        const loadInternalData = async () => {
            const [allUsers, allTasks, allMeetings, allClients, allFiles] = await Promise.all([
                db.getAll('users'),
                db.getAll('tasks'),
                db.getAll('meetings'),
                db.getAll('clients'),
                db.getAll('files')
            ]);
            setUsers(allUsers);
            setRawData({
                tasks: allTasks,
                meetings: allMeetings,
                clients: allClients,
                files: allFiles
            });
        };
        loadInternalData();
    }, []);

    useEffect(() => {
        if (!startDate || !endDate) return;
        calculateMetrics();
    }, [startDate, endDate, selectedUser, rawData]);

    const calculateMetrics = () => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59); // End of day

        const isWithinRange = (dateStr) => {
            if (!dateStr) return false;
            const d = new Date(dateStr);
            return d >= start && d <= end;
        };

        const checkOwner = (item, idField = 'ownerId') => {
            if (!selectedUser) return true;
            return String(item[idField]) === String(selectedUser);
        };

        // Tasks (assigneeId)
        const tasksInRange = rawData.tasks.filter(t => isWithinRange(t.dueDate) && checkOwner(t, 'assigneeId'));
        const tasksCompleted = tasksInRange.filter(t => t.status === 'Concluída' || t.status === 'done' || t.status === 'archived').length;

        // Meetings (assigneeId OR ownerId) - If user is selected, check if they are the assignee (host) or owner (creator)
        // Ideally reports usually track "Who performed the meeting", so assigneeId is priority.
        const checkMeetingOwner = (m) => {
            if (!selectedUser) return true;
            return String(m.assigneeId) === String(selectedUser) || String(m.ownerId) === String(selectedUser);
        };
        const meetingsInRange = rawData.meetings.filter(m => isWithinRange(m.date) && checkMeetingOwner(m));
        const meetingsDone = meetingsInRange.filter(m => m.status === 'Realizada').length;

        // Clients (ownerId)
        const clientsInRange = rawData.clients.filter(c => isWithinRange(c.lastInteraction) && checkOwner(c, 'ownerId'));
        const clientsClosed = clientsInRange.filter(c => c.status === 'Fechado').length;

        // Files (ownerId)
        const filesInRange = rawData.files.filter(f => isWithinRange(f.date) && checkOwner(f, 'ownerId'));

        setMetrics({
            tasks: {
                total: tasksInRange.length,
                completed: tasksCompleted,
                pending: tasksInRange.length - tasksCompleted
            },
            meetings: {
                total: meetingsInRange.length,
                done: meetingsDone,
                scheduled: meetingsInRange.length - meetingsDone
            },
            clients: {
                total: clientsInRange.length,
                negotiation: clientsInRange.length - clientsClosed,
                closed: clientsClosed
            },
            files: { total: filesInRange.length }
        });
    };

    const handleDownloadPDF = async () => {
        if (!reportRef.current) return;

        const canvas = await html2canvas(reportRef.current, {
            scale: 2, // Higher resolution
            backgroundColor: '#050505', // Match dark theme
            logging: false
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Relatorio_QUA_${startDate}_to_${endDate}.pdf`);
    };

    const StatCard = ({ title, icon: Icon, mainValue, subText, color }) => (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ color: '#aaa', fontSize: '0.9rem' }}>{title}</span>
                <div style={{
                    padding: '8px', borderRadius: '8px',
                    background: color + '20', color: color
                }}>
                    <Icon size={20} />
                </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '600' }}>{mainValue}</div>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>{subText}</div>
        </div>
    );

    return (
        <Layout>
            <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>

                {/* Header & Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem' }}>Relatórios e Métricas</h1>
                        <p style={{ color: '#888' }}>Visão geral do desempenho do sistema</p>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '12px' }}>

                        {/* User Filter */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '12px' }}>
                            <Users size={16} color="#888" />
                            <select
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', cursor: 'pointer' }}
                            >
                                <option value="" style={{ color: 'black' }}>Todos os Usuários</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id} style={{ color: 'black' }}>{u.name}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={16} color="#888" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={{ background: 'transparent', border: 'none', padding: '5px', color: 'white', outline: 'none' }}
                            />
                        </div>
                        <span style={{ color: '#666' }}>até</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                style={{ background: 'transparent', border: 'none', padding: '5px', color: 'white', outline: 'none' }}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleDownloadPDF}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                    >
                        <Download size={18} /> Baixar PDF
                    </button>
                </div>

                {/* Printable Area */}
                <div ref={reportRef} style={{ padding: '20px', background: '#050505' }}> {/* Hardcoded bg for PDF safety */}

                    {/* Summary Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                        <StatCard
                            title="Tarefas Totais"
                            icon={CheckCircle}
                            mainValue={metrics.tasks.total}
                            subText={`${metrics.tasks.completed} concluídas / ${metrics.tasks.pending} pendentes`}
                            color="#4CAF50"
                        />
                        <StatCard
                            title="Reuniões"
                            icon={Clock}
                            mainValue={metrics.meetings.total}
                            subText={`${metrics.meetings.done} realizadas`}
                            color="#2196F3"
                        />
                        <StatCard
                            title="Clientes Ativos"
                            icon={Briefcase}
                            mainValue={metrics.clients.total}
                            subText={`${metrics.clients.closed} fechados`}
                            color="#FFC107"
                        />
                        <StatCard
                            title="Arquivos Gerados"
                            icon={FileText}
                            mainValue={metrics.files.total}
                            subText="Documentos e mídias"
                            color="#9C27B0"
                        />
                    </div>

                    {/* Detailed Breakdown */}
                    <div className="glass-panel" style={{ padding: '30px', marginBottom: '30px' }}>
                        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <BarChart2 size={20} color="var(--color-orange)" />
                            Detalhamento de Performance
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                            {/* Task Stats */}
                            <div>
                                <h4 style={{ color: '#888', marginBottom: '15px' }}>Tarefas</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Concluídas</span>
                                        <span style={{ color: '#4CAF50' }}>{Math.round((metrics.tasks.completed / (metrics.tasks.total || 1)) * 100)}% ({metrics.tasks.completed})</span>
                                    </div>
                                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${(metrics.tasks.completed / (metrics.tasks.total || 1)) * 100}%`, height: '100%', background: '#4CAF50' }}></div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                                        <span>Pendentes</span>
                                        <span style={{ color: '#FF4D4D' }}>{metrics.tasks.pending}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Client Stats */}
                            <div>
                                <h4 style={{ color: '#888', marginBottom: '15px' }}>Funil de Clientes</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Taxa de Fechamento</span>
                                        <span style={{ color: '#FFC107' }}>{Math.round((metrics.clients.closed / (metrics.clients.total || 1)) * 100)}%</span>
                                    </div>
                                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${(metrics.clients.closed / (metrics.clients.total || 1)) * 100}%`, height: '100%', background: '#FFC107' }}></div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                                        <span>Em Negociação</span>
                                        <span>{metrics.clients.negotiation}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', color: '#666', fontSize: '0.8rem', marginTop: '40px' }}>
                        Relatório gerado automaticamente pelo Sistema QUA CRM em {new Date().toLocaleDateString('pt-BR')}
                    </div>
                </div>

            </div>
        </Layout>
    );
}
