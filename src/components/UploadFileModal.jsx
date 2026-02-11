
import React, { useState, useEffect } from 'react';
import { db } from '../services/database';
import { storage } from '../services/storage';
import { X, Upload, File, User, Tag, AlignLeft, CheckCircle } from 'lucide-react';

const UploadFileModal = ({ onClose, onSave }) => {
    const [fileData, setFileData] = useState(null);
    const [meta, setMeta] = useState({
        recipientId: '',
        category: 'Documento',
        notes: ''
    });
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const loadUsers = async () => {
            const allUsers = await db.getAll('users');
            setUsers(allUsers);
        };
        loadUsers();
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFileData(e.target.files[0]);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFileData(e.dataTransfer.files[0]);
        }
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!fileData) return alert('Selecione um arquivo!');
        if (!meta.recipientId) return alert('Selecione um destinatário!');

        setUploading(true);
        setProgress(10);

        try {
            // Generate a unique key for the storage
            const storageKey = `file_${Date.now()}_${fileData.name}`;

            // "Real" upload to IndexedDB
            setProgress(30);
            await storage.saveFile(storageKey, fileData);

            // Simulate progress for UI feel
            let p = 30;
            const interval = setInterval(() => {
                p += 10;
                if (p >= 100) {
                    clearInterval(interval);
                    onSave({
                        name: fileData.name,
                        type: fileData.name.split('.').pop(),
                        size: formatSize(fileData.size),
                        date: new Date().toLocaleDateString('pt-BR'),
                        recipientId: parseInt(meta.recipientId),
                        category: meta.category,
                        notes: meta.notes,
                        storageKey: storageKey,
                        file: fileData // Pass the actual file for Drive upload
                    });
                    onClose();
                }
                setProgress(p);
            }, 100);

        } catch (error) {
            console.error("Upload Error:", error);
            alert("Erro ao salvar arquivo no banco de dados local. Talvez seja grande demais para o navegador.");
            setUploading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="glass-panel" style={{ padding: '40px', width: '550px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '300' }}>Enviar Arquivo Real</h2>
                    {!uploading && <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}><X size={24} /></button>}
                </div>

                {!uploading ? (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            style={{
                                border: `2px dashed ${fileData ? '#4caf50' : 'rgba(255,255,255,0.2)'}`,
                                background: fileData ? 'rgba(76, 175, 80, 0.1)' : 'rgba(0,0,0,0.2)',
                                padding: '30px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer',
                                transition: '0.3s'
                            }}
                            onClick={() => document.getElementById('fileInput').click()}
                        >
                            <input id="fileInput" type="file" style={{ display: 'none' }} onChange={handleFileChange} />
                            {fileData ? (
                                <div>
                                    <File size={32} color="#4caf50" style={{ marginBottom: '10px' }} />
                                    <div style={{ fontWeight: '600' }}>{fileData.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#AAA' }}>{formatSize(fileData.size)}</div>
                                </div>
                            ) : (
                                <div>
                                    <Upload size={32} color="#888" style={{ marginBottom: '10px' }} />
                                    <div style={{ color: '#CCC', marginBottom: '8px' }}>Clique ou arraste o arquivo aqui</div>
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>O arquivo será salvo no seu navegador</div>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#AAA', marginBottom: '8px', fontSize: '0.9rem' }}>
                                    <User size={14} /> Destinatário
                                </label>
                                <select required value={meta.recipientId} onChange={e => setMeta({ ...meta, recipientId: e.target.value })} style={{ width: '100%' }}>
                                    <option value="">Selecione...</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#AAA', marginBottom: '8px', fontSize: '0.9rem' }}>
                                    <Tag size={14} /> Categoria
                                </label>
                                <select value={meta.category} onChange={e => setMeta({ ...meta, category: e.target.value })} style={{ width: '100%' }}>
                                    <option>Documento</option>
                                    <option>Contrato</option>
                                    <option>Planta</option>
                                    <option>Boleto</option>
                                    <option>Proposta</option>
                                    <option>Imagem/Render</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#AAA', marginBottom: '8px', fontSize: '0.9rem' }}>
                                <AlignLeft size={14} /> Detalhes / Observações
                            </label>
                            <textarea
                                placeholder="Notas sobre o arquivo..."
                                value={meta.notes}
                                onChange={e => setMeta({ ...meta, notes: e.target.value })}
                                style={{
                                    width: '100%', minHeight: '80px', padding: '12px',
                                    background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white', borderRadius: '8px', resize: 'none'
                                }}
                            />
                        </div>

                        <button type="submit" className="btn-primary">Enviar Agora</button>
                    </form>
                ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ marginBottom: '20px', fontSize: '1.2rem', fontWeight: '500' }}>Processando Arquivo...</div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
                            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-orange)', transition: 'width 0.2s ease-out' }} />
                        </div>
                        <div style={{ color: '#888', fontSize: '0.9rem' }}>{Math.round(progress)}%</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadFileModal;
