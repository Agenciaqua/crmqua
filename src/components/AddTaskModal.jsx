
import React, { useState } from 'react';
import { db } from '../services/database';
import { useAuth } from '../context/AuthContext';
import { X, Calendar, AlignLeft, User, Tag } from 'lucide-react';

const AddTaskModal = ({ onClose, onSave }) => {
    const auth = useAuth();
    const user = auth?.user;

    // Safety check: If auth context is missing, don't render (or show error)
    if (!user) {
        console.error("AddTaskModal: User is missing from Auth Context");
        return null;
    }

    const [task, setTask] = useState({
        title: '',
        assigneeId: '',
        priority: 'medium',
        dueDate: '',
        description: '',
        type: 'Reunião'
    });
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);

    useEffect(() => {
        let mounted = true;
        const loadUsers = async () => {
            try {
                const allUsers = await db.getAll('users');
                if (mounted && Array.isArray(allUsers)) {
                    setUsers(allUsers);
                }
            } catch (err) {
                console.error("Error loading users:", err);
            } finally {
                if (mounted) setLoadingUsers(false);
            }
        };
        loadUsers();
        return () => { mounted = false; };
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...task, status: 'todo', ownerId: user.id });
        onClose();
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="glass-panel" style={{ padding: '40px', width: '600px', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '300' }}>Nova Tarefa</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Title */}
                    <div>
                        <label style={{ display: 'block', color: '#AAA', marginBottom: '8px', fontSize: '0.9rem' }}>Título da Tarefa</label>
                        <input
                            required
                            placeholder="Ex: Reunião com Cliente X"
                            value={task.title}
                            onChange={e => setTask({ ...task, title: e.target.value })}
                            style={{ width: '100%', fontSize: '1.1rem', padding: '12px' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {/* Type */}
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#AAA', marginBottom: '8px', fontSize: '0.9rem' }}>
                                <Tag size={14} /> Tipo
                            </label>
                            <select value={task.type} onChange={e => setTask({ ...task, type: e.target.value })} style={{ width: '100%' }}>
                                <option>Reunião</option>
                                <option>Ligação</option>
                                <option>Visita</option>
                                <option>Contrato</option>
                                <option>Email</option>
                                <option>Outro</option>
                            </select>
                        </div>

                        {/* Assignee */}
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#AAA', marginBottom: '8px', fontSize: '0.9rem' }}>
                                <User size={14} /> Responsável
                            </label>
                            <select required value={task.assigneeId} onChange={e => setTask({ ...task, assigneeId: e.target.value })} style={{ width: '100%' }}>
                                {loadingUsers && <option value="">Carregando...</option>}
                                <option value="">Selecione...</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {/* Date */}
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#AAA', marginBottom: '8px', fontSize: '0.9rem' }}>
                                <Calendar size={14} /> Data Limite
                            </label>
                            <input required type="date" value={task.dueDate} onChange={e => setTask({ ...task, dueDate: e.target.value })} style={{ width: '100%' }} />
                        </div>

                        {/* Priority */}
                        <div>
                            <label style={{ display: 'block', color: '#AAA', marginBottom: '8px', fontSize: '0.9rem' }}>Prioridade</label>
                            <select value={task.priority} onChange={e => setTask({ ...task, priority: e.target.value })} style={{ width: '100%' }}>
                                <option value="high">Alta</option>
                                <option value="medium">Média</option>
                                <option value="low">Baixa</option>
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#AAA', marginBottom: '8px', fontSize: '0.9rem' }}>
                            <AlignLeft size={14} /> Observações / Detalhes
                        </label>
                        <textarea
                            placeholder="Descreva detalhadamente o que precisa ser feito..."
                            value={task.description}
                            onChange={e => setTask({ ...task, description: e.target.value })}
                            style={{
                                width: '100%', minHeight: '120px', padding: '12px',
                                background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                                color: 'white', borderRadius: '8px', resize: 'vertical'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                        <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1, border: '1px solid rgba(255,255,255,0.2)' }}>Cancelar</button>
                        <button type="submit" className="btn-primary" style={{ flex: 1 }}>Criar Tarefa</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTaskModal;
