
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles, Copy, Check, AlertTriangle } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { GEMINI_API_KEY } from '../services/ai-config';

const AIChatWidget = () => {
    console.log("AI Chat Widget Loaded v0.2.8");
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Olá! Sou seu assistente de vendas com IA do Google Gemini. 🤖\n\nPosso criar scripts personalizados, feedbacks e muito mais. Como posso ajudar com sua prospecção hoje?", sender: 'ai' }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [apiKeyMissing, setApiKeyMissing] = useState(false);
    const messagesEndRef = useRef(null);

    const apiKey = GEMINI_API_KEY;

    useEffect(() => {
        if (!apiKey) {
            setApiKeyMissing(true);
            setMessages(prev => [...prev, {
                id: Date.now(),
                text: "⚠️ **Falta a Chave do Gemini:**\n\nVocê configurou o Login do Google, mas para eu (IA) funcionar, preciso da **Gemini API Key**.\n\n1. Crie sua chave gratuita em [aistudio.google.com](https://aistudio.google.com/app/apikey)\n2. Adicione no arquivo `.env`:\n`VITE_GEMINI_API_KEY=sua_chave_aqui`\n3. Reinicie o projeto.",
                sender: 'ai'
            }]);
        }
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSendMessage = async (text = inputText) => {
        if (!text.trim()) return;

        // User Message
        const userMsg = { id: Date.now(), text: text, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);

        if (!apiKey) {
            setTimeout(() => {
                setMessages(prev => [...prev, { id: Date.now() + 1, text: "Eu preciso da API Key para responder. Configure o arquivo .env por favor!", sender: 'ai' }]);
                setIsTyping(false);
            }, 1000);
            return;
        }

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            // Use standard gemini-pro model (most compatible)
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

            // Context Prompt
            const prompt = `
                Você é um assistente especialista em vendas B2B e CRM. Seu objetivo é ajudar o usuário a vender mais.
                Responda de forma curta, direta e persuasiva e em PORTUGUÊS.
                O usuário pediu: "${text}"
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const aiText = response.text();

            setMessages(prev => [...prev, { id: Date.now() + 1, text: aiText, sender: 'ai' }]);

        } catch (error) {
            console.error("Erro Gemini:", error);
            // Show actual error message to help debugging
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: `❌ Erro Técnico: ${error.message || error.toString()}\n\nVerifique se a chave API está ativa e se o modelo 'gemini-1.5-flash' está disponível.`,
                sender: 'ai'
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const QuickButton = ({ label, query }) => (
        <button
            onClick={() => handleSendMessage(query)}
            disabled={!apiKey}
            style={{
                background: 'rgba(255, 77, 0, 0.1)', border: '1px solid rgba(255, 77, 0, 0.2)',
                color: 'var(--color-orange)', padding: '6px 12px', borderRadius: '20px',
                fontSize: '0.8rem', cursor: apiKey ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', transition: '0.2s',
                display: 'flex', alignItems: 'center', gap: '4px', opacity: apiKey ? 1 : 0.5
            }}
            onMouseOver={e => apiKey && (e.currentTarget.style.background = 'rgba(255, 77, 0, 0.2)')}
            onMouseOut={e => apiKey && (e.currentTarget.style.background = 'rgba(255, 77, 0, 0.1)')}
        >
            <Sparkles size={12} /> {label}
        </button>
    );

    const MessageBubble = ({ msg }) => {
        const [copied, setCopied] = useState(false);
        const isAI = msg.sender === 'ai';

        const handleCopy = () => {
            navigator.clipboard.writeText(msg.text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        };

        return (
            <div style={{
                alignSelf: isAI ? 'flex-start' : 'flex-end',
                maxWidth: '85%',
                marginBottom: '12px',
                position: 'relative'
            }}>
                <div style={{
                    background: isAI ? 'rgba(255,255,255,0.08)' : 'var(--color-orange)',
                    color: 'white',
                    padding: '12px 16px',
                    borderRadius: isAI ? '12px 12px 12px 0' : '12px 12px 0 12px',
                    fontSize: '0.9rem',
                    lineHeight: '1.4',
                    border: isAI ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    whiteSpace: 'pre-wrap'
                }}>
                    {/* Render Markdown-like bold/links manually or simply text for now */}
                    {msg.text.split('**').map((chunk, i) =>
                        i % 2 === 1 ? <strong key={i}>{chunk}</strong> : chunk
                    )}
                </div>
                {isAI && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px', marginLeft: '4px' }}>
                        <span style={{ fontSize: '0.7rem', color: '#666' }}>Gemini AI</span>
                        <button
                            onClick={handleCopy}
                            title="Copiar texto"
                            style={{
                                background: 'transparent', border: 'none', cursor: 'pointer',
                                color: copied ? '#4caf50' : '#888', display: 'flex', alignItems: 'center', gap: '2px',
                                fontSize: '0.7rem'
                            }}
                        >
                            {copied ? <Check size={12} /> : <Copy size={12} />}
                            {copied ? 'Copiado!' : 'Copiar'}
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>

            {/* Chat Window */}
            {isOpen && (
                <div className="glass-panel" style={{
                    width: '350px', height: '500px', marginBottom: '20px',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '16px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(45deg, #4285F4, #9B72CB, #D96570)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Sparkles size={18} color="white" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Gemini Sales</h3>
                                <span style={{ fontSize: '0.7rem', color: apiKey ? '#4caf50' : '#ff4d4d', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: apiKey ? '#4caf50' : '#ff4d4d' }}></span>
                                    {apiKey ? 'Online' : 'Configuração Necessária'}
                                </span>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
                        {isTyping && (
                            <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', padding: '10px 16px', borderRadius: '12px 12px 12px 0', marginBottom: '12px' }}>
                                <span className="typing-dot">.</span><span className="typing-dot">.</span><span className="typing-dot">.</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Actions */}
                    <div style={{ padding: '0 16px 10px 16px', display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                        <QuickButton label="Abordagem Fria" query="Escreva um script curto de abordagem fria para vender serviços B2B no Linkedin" />
                        <QuickButton label="Follow-up" query="Escreva uma mensagem de cobrança suave para um cliente que visualizou a proposta mas não respondeu" />
                        <QuickButton label="Objeção Preço" query="Como responder a objeção: 'Seu preço está acima do mercado'?" />
                    </div>

                    {/* Input Area */}
                    <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '10px' }}>
                        <input
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder={apiKey ? "Pergunte ao Gemini..." : "Configure a API Key primeiro"}
                            disabled={!apiKey}
                            style={{
                                flex: 1, background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '20px',
                                padding: '10px 16px', color: 'white', fontSize: '0.9rem', outline: 'none',
                                opacity: apiKey ? 1 : 0.5
                            }}
                        />
                        <button
                            onClick={() => handleSendMessage()}
                            disabled={!apiKey}
                            style={{
                                width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-orange)',
                                border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: apiKey ? 'pointer' : 'not-allowed', opacity: apiKey ? 1 : 0.5
                            }}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '60px', height: '60px', borderRadius: '50%',
                    background: 'linear-gradient(45deg, #FF4D00, #FF8C00)',
                    boxShadow: '0 4px 20px rgba(255, 77, 0, 0.4)',
                    border: 'none', color: 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'transform 0.2s',
                    transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)'
                }}
                onMouseOver={e => e.currentTarget.style.transform = isOpen ? 'rotate(90deg) scale(1.1)' : 'scale(1.1)'}
                onMouseOut={e => e.currentTarget.style.transform = isOpen ? 'rotate(90deg) scale(1)' : 'scale(1)'}
            >
                {isOpen ? <X size={28} /> : <Sparkles size={28} />}
            </button>

            <style>
                {`
                .typing-dot {
                    animation: typing 1.4s infinite ease-in-out both;
                    font-size: 1.2rem;
                    margin: 0 1px;
                }
                .typing-dot:nth-child(1) { animation-delay: -0.32s; }
                .typing-dot:nth-child(2) { animation-delay: -0.16s; }
                
                @keyframes typing {
                    0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
                    40% { transform: scale(1); opacity: 1; }
                }
                `}
            </style>
        </div>
    );
};

export default AIChatWidget;
