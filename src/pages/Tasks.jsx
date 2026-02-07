
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Plus, CheckCircle, Clock, AlertCircle, ChevronRight, ChevronLeft, Calendar, User, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/database';
import AddTaskModal from '../components/AddTaskModal';

const TaskCard = ({ task, onMove }) => {
    const [assigneeName, setAssigneeName] = React.useState('Carregando...');

    React.useEffect(() => {
        const loadAssignee = async () => {
            const user = await db.getById('users', task.assigneeId);
            setAssigneeName(user ? user.name : 'Desconhecido');
        };
        loadAssignee();
    }, [task.assigneeId]);

    const priorityColor = task.priority === 'high' ? '#f44336' : task.priority === 'medium' ? 'var(--color-orange)' : '#4caf50';

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} />
                    <span>{task.dueDate}</span>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                {task.status !== 'todo' && <button onClick={() => onMove(task, -1)} title="Voltar" className="btn-ghost" style={{ padding: '6px' }}><ChevronLeft size={16} /></button>}
                {task.status !== 'done' && <button onClick={() => onMove(task, 1)} title="Avançar" className="btn-ghost" style={{ padding: '6px', color: 'var(--color-orange)' }}><ChevronRight size={16} /></button>}
            </div>
        </div>
    );
};

export default function Tasks() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const loadTasks = async () => {
            try {
                const allTasks = await db.getAll('tasks');
                if (Array.isArray(allTasks)) {
                    // Filter tasks for the current user (Owner or Assignee)
                    // Or show all if Manager? For now, showing all to debug "disappearance"
                    setTasks(allTasks);
                }
            } catch (error) {
                console.error("Error loading tasks:", error);
            }
        };
        loadTasks();
    }, []);

    const handleCreateTask = async (newTask) => {
        await db.add('tasks', { ...newTask, assigneeId: Number(newTask.assigneeId) });
        const allTasks = await db.getAll('tasks');
        setTasks(allTasks);
    };

    const handleMoveTask = async (task, direction) => {
        const statuses = ['todo', 'inprogress', 'done'];
        const currentIndex = statuses.indexOf(task.status);
        const newStatus = statuses[currentIndex + direction];
        if (newStatus) {
            await db.update('tasks', task.id, { status: newStatus });
            const allTasks = await db.getAll('tasks');
            setTasks(allTasks);
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
                            {filterTasks(key).map(task => <TaskCard key={task.id} task={task} onMove={handleMoveTask} />)}
                        </div>
                    </div>
                ))}
            </div>
            {isModalOpen && <AddTaskModal onClose={() => setIsModalOpen(false)} onSave={handleCreateTask} />}
        </Layout>
    );
}
