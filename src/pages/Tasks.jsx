
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Plus, CheckCircle, Clock, AlertCircle, ChevronRight, ChevronLeft, Calendar, User, Tag, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/database';
import AddTaskModal from '../components/AddTaskModal';

const TaskCard = ({ task, onMove, onEdit, onDelete, onArchive }) => {
    const [assigneeName, setAssigneeName] = React.useState('Carregando...');
    const [ownerName, setOwnerName] = React.useState('');

    React.useEffect(() => {
        const loadInfo = async () => {
            if (task.assigneeId) {
                const user = await db.getById('users', task.assigneeId);
                setAssigneeName(user ? user.name : 'Desconhecido');
            } else {
                setAssigneeName('Não Atribuído');
            }

            if (task.ownerId) {
                const owner = await db.getById('users', task.ownerId);
                setOwnerName(owner ? owner.name : '');
            }
        };
        loadInfo();
    }, [task.assigneeId, task.ownerId]);

    const priorityColor = task.priority === 'high' ? '#f44336' : task.priority === 'medium' ? 'var(--color-orange)' : '#4caf50';

    const formatDate = (dateString) => {
        if (!dateString) return '';
        // Handle ISO strings (e.g. 2026-02-16T00:00:00.000Z)
        const cleanDate = dateString.substring(0, 10);
        const [year, month, day] = cleanDate.split('-');
        return `${day}/${month}/${year}`;
    };

    return (
        <div className="glass-panel glass-panel-interactive" style={{
            padding: '20px',
            marginBottom: '16px',
            borderLeft: `4px solid ${priorityColor}`,
            borderRadius: '4px 16px 16px 4px',
            background: 'rgba(255,255,255,0.03)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'white', flex: 1 }}>{task.title}</h4>
                {task.type && (
                    <span style={{
                        fontSize: '0.65rem', padding: '2px 8px', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.1)', color: '#CCC',
                        border: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap'
                    }}>
                        {task.type}
                    </span>
                )}
            </div>

            {task.description && (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)', marginBottom: '16px', whiteSpace: 'pre-wrap', maxHeight: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {task.description}
                </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: '#AAA', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={14} />
                    <span>{assigneeName}</span>
                </div>
                {ownerName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontStyle: 'italic', color: '#666' }}>
                        <span>Criado por: {ownerName}</span>
                    </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} />
                    <span>{formatDate(task.dueDate)}</span>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => onEdit(task)} className="btn-ghost" style={{ padding: '4px', color: '#AAA' }} title="Editar">
                        <Pencil size={14} />
                    </button>
                    <button onClick={() => onDelete(task.id)} className="btn-ghost" style={{ padding: '4px', color: '#ff4d4d' }} title="Excluir">
                        <Trash2 size={14} />
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {task.status !== 'todo' && <button onClick={() => onMove(task, -1)} title="Voltar" className="btn-ghost" style={{ padding: '6px' }}><ChevronLeft size={16} /></button>}
                    {task.status !== 'done' && <button onClick={() => onMove(task, 1)} title="Avançar" className="btn-ghost" style={{ padding: '6px', color: 'var(--color-orange)' }}><ChevronRight size={16} /></button>}
                    {task.status === 'done' && (
                        <button
                            onClick={() => onArchive(task)}
                            className="btn-primary"
                            style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '12px' }}
                        >
                            Confirmar término
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function Tasks() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [selectedTask, setSelectedTask] = useState(null);

    const loadTasks = async () => {
        try {
            const allTasks = await db.getAll('tasks');
            if (Array.isArray(allTasks)) {
                // Permission Logic: Manager sees all, others see only assigned/owned
                const isManager = ['gestor', 'manager', 'admin'].includes(user.role?.toLowerCase());

                const visibleTasks = isManager
                    ? allTasks
                    : allTasks.filter(t => t.assigneeId === user.id || t.ownerId === user.id);

                setTasks(visibleTasks);
            }
        } catch (error) {
            console.error("Error loading tasks:", error);
        }
    };

    useEffect(() => {
        loadTasks();
    }, [user]);

    const handleCreateOrUpdateTask = async (taskData) => {
        const formattedTask = {
            ...taskData,
            assigneeId: taskData.assigneeId ? Number(taskData.assigneeId) : null,
            dueDate: taskData.dueDate || null
        };

        const isNewAssignee = !selectedTask || selectedTask.assigneeId !== formattedTask.assigneeId;

        if (selectedTask) {
            // Edit Mode
            await db.update('tasks', selectedTask.id, formattedTask);
        } else {
            // Create Mode
            await db.add('tasks', formattedTask);
        }

        // Send WhatsApp Notification if assignee exists (Background / API)
        if (formattedTask.assigneeId && isNewAssignee) {
            const assignee = await db.getById('users', formattedTask.assigneeId);
            if (assignee && assignee.id !== user.id) {
                if (assignee.phone) {
                    const message = `Olá *${assignee.name.split(' ')[0]}*, você recebeu uma nova tarefa no CRM QUA!\n\n🔹 *${formattedTask.title}*\n📅 Prazo: ${formattedTask.dueDate ? formattedTask.dueDate.split('-').reverse().join('/') : 'Sem prazo'}\n⚠️ Prioridade: ${formattedTask.priority === 'high' ? 'Alta' : formattedTask.priority === 'medium' ? 'Média' : 'Baixa'}\n\n${formattedTask.description ? `📝 Detalhes: \n${formattedTask.description}` : ''}`;
                    const phone = assignee.phone.replace(/\D/g, ''); // Remove non-digits
                    if (phone) {
                        try {
                            // Dispara de forma assíncrona para não travar a UI (Fire and Forget)
                            fetch('/.netlify/functions/send_whatsapp', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ phone, message })
                            }).catch(err => console.error("Error triggering silent WhatsApp:", err));
                        } catch (e) {
                            console.error("Failed to call WhatsApp background function", e);
                        }
                    }
                } else {
                    alert(`A tarefa foi atribuída, mas ${assignee.name} não tem um WhatsApp cadastrado no perfil.`);
                }
            }
        }

        loadTasks();
        setIsModalOpen(false);
        setSelectedTask(null);
    };

    const handleDeleteTask = async (taskId) => {
        if (window.confirm("Tem certeza que deseja excluir esta tarefa?")) {
            await db.delete('tasks', taskId);
            loadTasks();
        }
    };

    const openEditModal = (task) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const handleMoveTask = async (task, direction) => {
        const statuses = ['todo', 'inprogress', 'done'];
        const currentIndex = statuses.indexOf(task.status);
        const newStatus = statuses[currentIndex + direction];
        if (newStatus) {
            await db.update('tasks', task.id, { status: newStatus });
            loadTasks();
        }
    };

    const handleArchiveTask = async (task) => {
        if (window.confirm("Confirmar o término definitivo desta tarefa? Ela sairá do quadro.")) {
            await db.update('tasks', task.id, { status: 'archived' });
            loadTasks();
        }
    };

    const filterTasks = (status) => tasks.filter(t => t.status === status);

    const columns = [
        ['todo', 'A Fazer', AlertCircle, '#A0A0A0'],
        ['inprogress', 'Em Progresso', Clock, 'var(--color-orange)'],
        ['done', 'Concluído', CheckCircle, '#4caf50']
    ];

    return (
        <Layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '700' }}>Tarefas</h1>
                {(user.role === 'manager' || user.role === 'Gestor') && (
                    <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={20} /> Nova Tarefa
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '20px', height: '100%' }}>
                {columns.map(([key, label, Icon, color]) => (
                    <div key={key} style={{ flex: 1, minWidth: '320px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingLeft: '10px' }}>
                            <Icon size={20} color={color} />
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: color }}>{label}</h3>
                            <span style={{
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                color: color,
                                padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold'
                            }}>
                                {filterTasks(key).length}
                            </span>
                        </div>

                        <div className="glass-panel" style={{
                            padding: '20px',
                            flex: 1,
                            background: 'rgba(0,0,0,0.2)',
                            overflowY: 'auto'
                        }}>
                            {filterTasks(key).map(task =>
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    onMove={handleMoveTask}
                                    onEdit={openEditModal}
                                    onDelete={handleDeleteTask}
                                    onArchive={handleArchiveTask}
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {isModalOpen && <AddTaskModal onClose={() => { setIsModalOpen(false); setSelectedTask(null); }} onSave={handleCreateOrUpdateTask} initialData={selectedTask} />}
        </Layout>
    );
}
