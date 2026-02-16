
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles, Copy, Check, AlertTriangle } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { GEMINI_API_KEY } from '../services/ai-config';

const AIChatWidget = () => {
    console.log("AI Chat Widget Loaded v0.2.16");
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Olá! Sou seu assistente de vendas com IA do Google Gemini. 🤖\n\nPosso criar scripts personalizados, feedbacks e muito mais. Como posso ajudar com sua prospecção hoje?", sender: 'ai' }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [apiKeyMissing, setApiKeyMissing] = useState(false);
    const messagesEndRef = useRef(null);

    const apiKey = GEMINI_API_KEY;

    // Database of diverse prompts (50+ Scenarios)
    const PROMPT_BANK = [
        // --- PROSPECÇÃO & ABORDAGEM ---
        { label: "Abordagem Fria LinkedIn", query: "Crie um script de abordagem fria para LinkedIn focado em dor e solução para gestores de RH." },
        { label: "Cold Call Script", query: "Crie um roteiro de Cold Call de 30 segundos para falar com diretores de marketing sobre automação." },
        { label: "Email de Apresentação", query: "Escreva um email curto (4 linhas) apresentando minha empresa de consultoria para um CEO." },
        { label: "Gatekeeper", query: "O que falar para a secretária para conseguir ser transferido para o tomador de decisão?" },
        { label: "Recuperar Ex-Client", query: "Escreva um email empático para tentar reativar um cliente que cancelou há 6 meses." },
        { label: "Pedir Indicação", query: "Crie um script natural para pedir indicações de novos leads para um cliente recém-fechado." },
        { label: "Networking Evento", query: "Como iniciar uma conversa em um evento de networking sem perguntar 'o que você faz?' logo de cara?" },
        { label: "Social Selling", query: "Dê 3 ideias de comentários inteligentes para fazer em posts de prospects no LinkedIn." },
        { label: "Mensagem de Áudio", query: "Crie um roteiro para uma mensagem de áudio no WhatsApp de 40s para um lead que baixou um ebook." },
        { label: "Video Prospecting", query: "O que eu devo falar em um vídeo curto (Loom) de prospecção para chamar atenção do lead?" },

        // --- QUALIFICAÇÃO ---
        { label: "Perguntas SPIN", query: "Me dê 2 exemplos de perguntas de Situação, Problema, Implicação e Necessidade para vender software." },
        { label: "Qualificação BANT", query: "Quais perguntas fazer para descobrir o Budget, Authority, Need e Timing (BANT) sem parecer um interrogatório?" },
        { label: "Descobrir Dor", query: "Que perguntas abertas posso fazer para fazer o cliente me contar suas maiores dores operacionais?" },
        { label: "Validar Decisor", query: "Como perguntar educadamente se a pessoa é quem toma a decisão final de compra?" },
        { label: "Checar Concorrência", query: "Como perguntar se o cliente está cotando com concorrentes sem parecer inseguro?" },

        // --- APRESENTAÇÃO & VALOR ---
        { label: "Storytelling", query: "Crie uma micro-história de sucesso de um cliente fictício que economizou 30% com nossa solução." },
        { label: "Diferenciação", query: "O cliente perguntou 'Por que devo escolher vocês?'. Crie uma resposta focada em atendimento e inovação." },
        { label: "Pitch Elevador", query: "Crie um Elevator Pitch de 1 minuto sobre uma solução de energia solar para empresas." },
        { label: "Proposta de Valor", query: "Reescreva esta frase para ficar mais impactante: 'Nós vendemos cadeiras confortáveis'." },
        { label: "Focar em Benefício", query: "Transforme a característica 'bateria de 24h' em um benefício emocional para o cliente." },

        // --- OBJEÇÕES ---
        { label: "Objeção Preço", query: "O cliente disse 'Está caro'. Me dê 3 opções de resposta para contornar isso focando em ROI." },
        { label: "Objeção 'Vou Pensar'", query: "O cliente disse 'Vou pensar'. Como responder para não deixar o deal esfriar?" },
        { label: "Objeção Concorrente", query: "O cliente disse que o concorrente X é mais barato. Como argumentar sem falar mal do concorrente?" },
        { label: "Objeção Sem Budget", query: "O cliente adorou mas disse que não tem orçamento agora. Como tentar salvar a venda?" },
        { label: "Objeção 'Envie Email'", query: "Na cold call, o lead disse 'Me mande por email'. Como tentar manter ele na linha?" },
        { label: "Objeção Já Tenho", query: "O lead disse que já tem um fornecedor. Que pergunta fazer para plantar uma dúvida?" },

        // --- FOLLOW-UP ---
        { label: "Follow-up Suave", query: "Escreva uma mensagem de follow-up para quem recebeu a proposta há 3 dias e não respondeu." },
        { label: "Follow-up Pós-Reunião", query: "Crie um email de resumo pós-reunião listando as dores identificadas e o próximo passo." },
        { label: "Break-up Email", query: "Crie um email de despedida (break-up) leve para um lead que sumiu (ghosting) há 15 dias." },
        { label: "Reengajamento", query: "Que conteúdo posso mandar para um lead que está 'morno' para lembrar dele da minha marca?" },
        { label: "Cobrar Proposta", query: "Como cobrar um retorno sobre a proposta enviada sem parecer chato ou desesperado?" },

        // --- NEGOCIAÇÃO & FECHAMENTO ---
        { label: "Técnica Ou-Ou", query: "Crie um exemplo de fechamento usando a técnica de 'Ou isso ou aquilo' (Alternative Close)." },
        { label: "Fechamento Direto", query: "Escreva uma frase de fechamento direto para usar quando o cliente já deu sinais de compra." },
        { label: "Pedir Desconto", query: "O cliente pediu 20% de desconto. Como dar apenas 5% mas pedir algo em troca (ex: pagamento à vista)?" },
        { label: "Urgência", query: "Como criar um senso de urgência ético para fechar o contrato ainda este mês?" },
        { label: "Ancoragem", query: "Explique como usar a técnica de ancoragem de preço ao apresentar os planos." },

        // --- PÓS-VENDA & CS ---
        { label: "Boas-vindas", query: "Escreva um email caloroso de boas-vindas para um novo cliente que acabou de assinar." },
        { label: "Pesquisa NPS", query: "Como pedir para o cliente responder uma pesquisa de satisfação (NPS) via WhatsApp?" },
        { label: "Upsell", query: "Como oferecer um upgrade de plano para um cliente que já está tendo bons resultados?" },
        { label: "Cross-sell", query: "Como oferecer um produto complementar para um cliente que comprou apenas o básico?" },
        { label: "Evitar Churn", query: "Um cliente quer cancelar. O que perguntar para tentar reverter a situação?" },

        // --- MENTORIA & ESTRATÉGIA ---
        { label: "Produtividade", query: "Me dê 3 dicas para organizar a agenda de um vendedor e priorizar leads quentes." },
        { label: "Motivação", query: "Escreva uma frase motivacional curta para um time de vendas que não bateu a meta." },
        { label: "Análise de KPIs", query: "Quais são as 3 métricas mais importantes para avaliar a saúde do funil de vendas?" },
        { label: "Definir Metas", query: "Como quebrar uma meta anual grande em metas semanais alcançáveis?" },
        { label: "Lidar com 'Não'", query: "Como um vendedor deve trabalhar o mindset para não desanimar com os 'nãos' do dia a dia?" },
        { label: "Venda Consultiva", query: "Qual a diferença prática entre venda transacional e venda consultiva? Resuma." },
        { label: "Rapport", query: "Me dê 3 técnicas para criar conexão (rapport) rápida nos primeiros minutos de uma call." },
        { label: "Escuta Ativa", query: "O que é escuta ativa e como usá-la para descobrir dores ocultas do cliente?" },
        { label: "Gatilhos Mentais", query: "Dê exemplos de como usar o gatilho da Prova Social e da Escassez em um email." },
        { label: "CRM", query: "Por que é importante registrar cada interação no CRM? Me dê 3 motivos para convencer a equipe." }
    ];

    const [quickPrompts, setQuickPrompts] = useState([]);

    // Randomize prompts on open
    useEffect(() => {
        if (isOpen) {
            const shuffled = [...PROMPT_BANK].sort(() => 0.5 - Math.random());
            setQuickPrompts(shuffled.slice(0, 3));
        }
    }, [isOpen]);

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

        // Optimized list based on user key permissions (No gemini-pro)
        const modelsToTry = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-2.5-flash"];
        let lastError = null;

        for (const modelName of modelsToTry) {
            try {
                console.log(`🤖 Tentando modelo: ${modelName}...`);
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: modelName });

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
                setIsTyping(false);
                return; // Success! Exit loop

            } catch (error) {
                console.warn(`❌ Falha no modelo ${modelName}:`, error.message);
                lastError = error;
                // Create a small delay before retrying to avoid hammering
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        // If we get here, all models failed
        console.error("Todas as tentativas de IA falharam:", lastError);
        setMessages(prev => [...prev, {
            id: Date.now() + 1,
            text: `❌ Erro Fatal: Não foi possível conectar a nenhum modelo de IA.\n\nÚltimo erro: ${lastError.message || lastError.toString()}\n\nVerifique se sua cota gratuita (Quota) não foi excedida em aistudio.google.com.`,
            sender: 'ai'
        }]);
        setIsTyping(false);
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
                        {quickPrompts.map((prompt, idx) => (
                            <QuickButton key={idx} label={prompt.label} query={prompt.query} />
                        ))}
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
