
import React, { useState } from 'react';
import { X, Upload, FileText, Loader2, Sparkles, Check } from 'lucide-react';
import { db } from '../services/database';
import { useAuth } from '../context/AuthContext';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { GEMINI_API_KEY } from '../services/ai-config';

const ImportListModal = ({ onClose, onSave }) => {
    console.log("Import List Modal Loaded v0.2.16");
    const { user } = useAuth();
    const [importMethod, setImportMethod] = useState('text'); // 'text' | 'file'
    const [textInput, setTextInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [parsedLeads, setParsedLeads] = useState([]);
    const [step, setStep] = useState(1); // 1: Input, 2: Review

    const apiKey = GEMINI_API_KEY;

    const handleProcess = async () => {
        if (!textInput.trim()) return;
        setIsProcessing(true);

        try {
            if (!apiKey) {
                alert("Erro: Configure a API Key do Gemini no .env");
                setIsProcessing(false);
                return;
            }

            const modelsToTry = ["gemini-2.0-flash", "gemini-2.0-flash-lite-001", "gemini-pro"];
            let success = false;

            for (const modelName of modelsToTry) {
                try {
                    console.log(`📊 Import IA tentando: ${modelName}`);
                    const genAI = new GoogleGenerativeAI(apiKey);
                    const model = genAI.getGenerativeModel({ model: modelName });

                    const prompt = `
                        Analise o texto abaixo que contém uma lista de leads imobiliários.
                        Extraia as informações e retorne UM ARRAY JSON estrito.
                        Cada objeto deve ter:
                        - name: Nome do lead (string)
                        - phone: Telefone com DDD (string)
                        - role: Cargo/Profissão (string, ex: Corretor, Diretor)
                        - instagram: Usuário ou link do insta (string)
                        - businessType: Uma destas opções: "Corretor", "Imobiliária", "Construtora", "Incorporadora", "Loteadora" (string)
                        - source: Origem do lead ("Tráfego Pago", "Instagram", "Recomendação", "Prospecção Outbound", "Outros") (string)
                        - hasTraffic: Se faz tráfego pago (boolean)
                        - website: URL do site ou se tem site (string)
                        - notes: Outras observações relevantes (string)
        
                        Se algum campo não for encontrado, deixe como string vazia ou false.
                        NÃO escreva nada além do JSON.
                        
                        Texto para analisar:
                        "${textInput}"
                    `;

                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    const text = response.text();

                    // Cleanup markdown code blocks if present
                    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
                    const leads = JSON.parse(cleanText);

                    if (Array.isArray(leads)) {
                        setParsedLeads(leads);
                        setStep(2);
                        success = true;
                        break; // Exit loop on success
                    }
                } catch (err) {
                    console.warn(`⚠️ Modelo ${modelName} falhou ou retornou inválido:`, err.message);
                    // Continue to next model
                }
            }

            if (!success) {
                alert("Falha Crítica: Todos os modelos de IA falharam ou você excedeu sua cota gratuita hoje.");
            }

        } catch (error) {
            console.error("Erro fatal:", error);
            alert(`Erro na IA: ${error.message || error.toString()}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmImport = async () => {
        // Validation: Check daily limits
        const acc = {};
        parsedLeads.forEach(l => {
            const day = l.prospectingDay || 'Segunda-feira'; // Default
            acc[day] = (acc[day] || 0) + 1;
        });

        // Get current counts from DB (approximation or pass as prop if needed, fetching here for safety)
        const allClients = await db.getAll('clients');

        for (const [day, count] of Object.entries(acc)) {
            const currentCount = allClients.filter(c => c.prospectingDay === day).length;
            if (currentCount + count > 30) {
                alert(`Erro: O dia ${day} já tem ${currentCount} leads. Com essa importação passaria do limite de 30.`);
                return;
            }
        }

        await Promise.all(parsedLeads.map(lead =>
            db.add('clients', {
                ...lead,
                status: 'Prospecção',
                category: 'Frio',
                prospectingDay: 'Segunda-feira', // Default day if AI didn't catch it
                prospectingDay: 'Segunda-feira', // Default day if AI didn't catch it
                lastInteraction: new Date().toLocaleDateString('pt-BR'),
                ownerId: user.id
            })
        ));

        onSave();
        onClose();
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                setTextInput(content);
                // Auto-advance or show feedback
                alert(`Arquivo "${file.name}" carregado! Clique em "Analisar e Processar".`);
            };
            reader.readAsText(file);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="glass-panel" style={{ width: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Sparkles color="var(--color-orange)" /> Importar Lista com IA
                    </h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><X /></button>
                </div>

                <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                    {step === 1 ? (
                        <>
                            <p style={{ color: '#aaa', marginBottom: '16px' }}>
                                Cole sua lista de leads abaixo. Pode ser texto copiado de planilha, WhatsApp ou PDF.
                                A IA vai identificar: Nome, Telefone, Cargo, Nick do Insta, Tipo de Negócio, etc.
                            </p>

                            <div style={{ marginBottom: '16px', display: 'flex', gap: '10px' }}>
                                <label
                                    htmlFor="file-upload"
                                    className="btn-ghost"
                                    style={{
                                        padding: '8px 16px', borderRadius: '8px',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem',
                                        border: '1px solid rgba(255,255,255,0.1)', color: 'white'
                                    }}
                                >
                                    <Upload size={16} /> Carregar Arquivo (.txt / .csv)
                                </label>
                            </div>

                            <textarea
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                placeholder={`Exemplo:\nJoão Silva, Corretor, (11) 99999-9999, @joaosilva\nImobiliária X, Maria Souza, maria@imobx.com.br, site: imobx.com`}
                                style={{
                                    width: '100%', height: '300px', background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                                    padding: '16px', color: 'white', fontSize: '0.9rem', resize: 'vertical'
                                }}
                            />
                            <input
                                type="file"
                                accept=".txt,.csv,.json"
                                id="file-upload"
                                style={{ display: 'none' }}
                                onChange={handleFileUpload}
                            />
                        </>
                    ) : (
                        <div>
                            <p style={{ color: '#4caf50', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Check size={18} /> {parsedLeads.length} leads identificados! Revise antes de importar.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {parsedLeads.map((lead, idx) => (
                                    <div key={idx} style={{
                                        background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px',
                                        border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem'
                                    }}>
                                        <div style={{ fontWeight: 'bold', color: 'white' }}>{lead.name} <span style={{ color: 'var(--color-orange)' }}>({lead.businessType})</span></div>
                                        <div style={{ color: '#aaa' }}>{lead.phone} • {lead.role} • {lead.instagram}</div>
                                        <div style={{ color: '#888', fontStyle: 'italic' }}>
                                            {lead.hasTraffic ? 'Faz Tráfego' : 'Sem Tráfego'} • {lead.website ? `Site: ${lead.website}` : 'Sem Site'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    {step === 1 ? (
                        <button
                            onClick={handleProcess}
                            disabled={isProcessing || !textInput.trim()}
                            className="btn-primary"
                            style={{ opacity: (isProcessing || !textInput.trim()) ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            {isProcessing ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
                            {isProcessing ? 'Processando IA...' : 'Analisar e Processar'}
                        </button>
                    ) : (
                        <>
                            <button onClick={() => setStep(1)} className="btn-ghost">Voltar</button>
                            <button onClick={handleConfirmImport} className="btn-primary">Confirmar Importação</button>
                        </>
                    )}
                </div>
            </div>
            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default ImportListModal;
