
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Upload, FileText, Download, Trash2, Image, File, Search, Eye, X } from 'lucide-react';
import { db } from '../services/database';
// import { storage } from '../services/storage'; // Deprecated
import { driveService } from '../services/drive';
import { useAuth } from '../context/AuthContext';
import UploadFileModal from '../components/UploadFileModal';

const FileViewer = ({ fileKey, fileName, fileType, onClose }) => {
    const [blobUrl, setBlobUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFile = async () => {
            const token = localStorage.getItem('qua_google_token');
            if (token) {
                try {
                    const blob = await driveService.getFile(fileKey, token);
                    if (blob) {
                        setBlobUrl(URL.createObjectURL(blob));
                    }
                } catch (err) {
                    if (err.message === 'TokenExpired') {
                        setError("Sessão do Google Drive expirada. Por favor, faça login novamente.");
                    } else {
                        console.error(err);
                    }
                }
            }
            setLoading(false);
        };
        fetchFile();
        return () => {
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        };
    }, [fileKey]);

    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType.toLowerCase());
    const isPdf = fileType.toLowerCase() === 'pdf';

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '40px' }}>
            <div style={{ position: 'absolute', top: '20px', right: '40px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                <span style={{ color: 'white', fontWeight: '500' }}>{fileName}</span>
                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}><X size={24} /></button>
            </div>

            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {loading ? <div style={{ color: 'white' }}>Carregando arquivo...</div> :
                    error ? <div style={{ color: '#ff6b6b', textAlign: 'center' }}><h3>{error}</h3></div> :
                        blobUrl ? (
                            isImage ? <img src={blobUrl} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} alt={fileName} /> :
                                isPdf ? <iframe src={blobUrl} style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }} title={fileName} /> :
                                    <div style={{ color: 'white', textAlign: 'center' }}>
                                        <File size={80} style={{ marginBottom: '20px', opacity: 0.5 }} />
                                        <h3>Visualização não disponível para este tipo de arquivo ({fileType})</h3>
                                        <a href={blobUrl} download={fileName} className="btn-primary" style={{ display: 'inline-block', marginTop: '20px', textDecoration: 'none' }}>Baixar para Ver</a>
                                    </div>
                        ) : <div style={{ color: 'white' }}>Arquivo não encontrado no armazenamento local ou Drive.</div>
                }
            </div>
        </div>
    );
};

export default function Files() {
    const { user } = useAuth();
    const [files, setFiles] = useState([]);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingFile, setViewingFile] = useState(null);

    const [users, setUsers] = useState([]);

    useEffect(() => {
        refreshFiles();
    }, []);

    const refreshFiles = async () => {
        const [allFiles, allUsers] = await Promise.all([
            db.getAll('files'),
            db.getAll('users')
        ]);
        setFiles(allFiles);
        setUsers(allUsers);
    };

    const handleFileUpload = async (newFile) => {
        const token = localStorage.getItem('qua_google_token');
        let driveFileId = null;

        if (token && newFile.file) {
            try {
                // Upload to Google Drive
                const driveData = await driveService.uploadFile(newFile.file, token);
                driveFileId = driveData.id;
            } catch (error) {
                console.error("Erro no upload pro Drive:", error);

                if (error.message === 'TokenExpired' || error.message.includes('TokenExpired')) {
                    alert("Sua sessão do Google Drive expirou. Por favor, faça Logout e Login novamente para reconectar.");
                    return; // Stop execution
                }

                alert(`Erro Google Drive: ${error.message} - Relogue para corrigir.`);
                return;
            }
        } else {
            if (!token) {
                alert("Token Google não encontrado. Por favor, faça Logout e Login novamente.");
            } else if (!newFile.file) {
                // This should not happen with the modal fix, but good for safety
                alert("Erro interno: Arquivo não recebido do modal.");
            }
        }

        // Validate Drive Upload
        if (!driveFileId && newFile.file) {
            alert("Falha no upload para o Google Drive. O arquivo não será salvo no sistema. Verifique seu login/token.");
            return;
        }

        // Save metadata to Database
        try {
            await db.add('files', {
                ...newFile,
                storageKey: driveFileId, // Now stores Drive ID instead of local key
                ownerId: user.id
            });
            refreshFiles();
        } catch (dbError) {
            console.error("Failed to save file metadata:", dbError);
            alert("Erro ao salvar registro do arquivo no sistema: " + dbError.message);
        }
    };

    const getIcon = (type) => {
        const t = (type || '').toLowerCase();
        if (['jpg', 'png', 'jpeg', 'webp'].includes(t)) return <Image size={24} color="#E91E63" />;
        if (['pdf'].includes(t)) return <FileText size={24} color="#F44336" />;
        return <File size={24} color="#AAA" />;
    };

    const getUserName = (id) => {
        const u = users.find(user => user.id == id);
        return u ? u.name : '-';
    };

    const handleDelete = async (file) => {
        if (window.confirm(`Deseja deletar "${file.name}" permanentemente?`)) {
            // Logic to delete from Drive could be added here if needed
            await db.delete('files', file.id);
            refreshFiles();
        }
    };

    const handleDownload = async (file) => {
        const token = localStorage.getItem('qua_google_token');

        if (!token) {
            alert("Erro: Token de acesso Google não encontrado. Faça Logout e Login novamente.");
            return;
        }

        if (!file.storageKey) {
            alert(`Erro: Este arquivo (${file.name}) não possui vínculo com o Drive (ID nulo).`);
            return;
        }

        try {
            const blob = await driveService.getFile(file.storageKey, token);
            if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.name;
                a.click();
                URL.revokeObjectURL(url);
            } else {
                alert("Erro ao baixar arquivo do Drive (Blob vazio).");
            }
        } catch (error) {
            if (error.message === 'TokenExpired') {
                alert("Sua sessão do Google Drive expirou. Por favor, faça Logout e Login novamente.");
            } else {
                alert("Erro ao baixar: " + error.message);
            }
        }
    };

    const filteredFiles = files.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.category && f.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <Layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '700' }}>Arquivos</h1>
                <div className="glass-panel" style={{ padding: '0 16px', display: 'flex', alignItems: 'center', gap: '10px', height: '44px' }}>
                    <Search size={18} color="#666" />
                    <input
                        placeholder="Buscar arquivos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: 'white', width: '200px', outline: 'none' }}
                    />
                </div>
            </div>

            <div
                onClick={() => setIsUploadModalOpen(true)}
                className="glass-panel"
                style={{
                    border: '2px dashed rgba(255,255,255,0.1)', padding: '50px', textAlign: 'center', marginBottom: '40px', cursor: 'pointer', transition: 'all 0.3s'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-orange)';
                    e.currentTarget.style.background = 'rgba(255, 77, 0, 0.05)';
                    e.currentTarget.style.transform = 'scale(1.01)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.background = 'var(--glass-bg)';
                    e.currentTarget.style.transform = 'scale(1)';
                }}
            >
                <Upload size={36} color="var(--color-orange)" style={{ marginBottom: '15px' }} />
                <h3 style={{ fontSize: '1.4rem', marginBottom: '10px' }}>Upload de Arquivos Reais</h3>
                <p style={{ color: 'var(--color-text-dim)' }}>Envie documentos, imagens ou contratos (Salvamento Interno Local)</p>
            </div>

            <div className="glass-panel overflow-auto-mobile" style={{ padding: '0', overflow: 'hidden' /* Desktop default */ }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' /* Ensure table doesn't squash */ }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <th style={{ padding: '20px 30px', color: '#888', fontWeight: '600', fontSize: '0.85rem' }}>NOME / CATEGORIA</th>
                            <th style={{ padding: '20px 30px', color: '#888', fontWeight: '600', fontSize: '0.85rem' }}>TAMANHO</th>
                            <th style={{ padding: '20px 30px', color: '#888', fontWeight: '600', fontSize: '0.85rem' }}>PARA QUEM</th>
                            <th style={{ padding: '20px 30px', color: '#888', fontWeight: '600', fontSize: '0.85rem', textAlign: 'right' }}>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredFiles.map(file => (
                            <tr key={file.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: '0.2s' }}>
                                <td style={{ padding: '20px 30px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>{getIcon(file.type)}</div>
                                    <div>
                                        <div style={{ fontWeight: '500', fontSize: '1rem', marginBottom: '4px' }}>{file.name}</div>
                                        {file.category && <span style={{ fontSize: '0.7rem', background: 'rgba(255, 77, 0, 0.1)', color: 'var(--color-orange)', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>{file.category}</span>}
                                    </div>
                                </td>
                                <td style={{ padding: '20px 30px', color: '#CCC', fontSize: '0.9rem' }}>{file.size}</td>
                                <td style={{ padding: '20px 30px' }}>
                                    <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', fontSize: '0.8rem' }}>
                                        {getUserName(file.recipientId)}
                                    </span>
                                </td>
                                <td style={{ padding: '20px 30px', textAlign: 'right' }}>
                                    {file.storageKey && <button onClick={() => setViewingFile(file)} className="btn-ghost" style={{ padding: '10px', marginRight: '8px' }} title="Visualizar"><Eye size={20} color="#ccc" /></button>}
                                    <button onClick={() => handleDownload(file)} className="btn-ghost" style={{ padding: '10px', marginRight: '8px' }} title="Baixar"><Download size={20} color="#ccc" /></button>
                                    <button onClick={() => handleDelete(file)} className="btn-ghost" style={{ padding: '10px' }} title="Excluir"><Trash2 size={20} color="#ff4d4d" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isUploadModalOpen && <UploadFileModal onClose={() => setIsUploadModalOpen(false)} onSave={handleFileUpload} />}
            {viewingFile && <FileViewer fileKey={viewingFile.storageKey} fileName={viewingFile.name} fileType={viewingFile.type} onClose={() => setViewingFile(null)} />}

            {viewingFile && <FileViewer fileKey={viewingFile.storageKey} fileName={viewingFile.name} fileType={viewingFile.type} onClose={() => setViewingFile(null)} />}
        </Layout>
    );
}
