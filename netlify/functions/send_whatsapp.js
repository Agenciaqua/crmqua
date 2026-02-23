exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const { phone, message } = JSON.parse(event.body);

        if (!phone || !message) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Phone and message are required' })
            };
        }

        // Configuração das Variáveis de Ambiente na Netlify
        // Você precisa adicionar essas chaves no painel da Netlify (Site settings > Environment variables)
        const apiUrl = process.env.WHATSAPP_API_URL;     // Ex: "https://api.z-api.io/instances/YOUR_INSTANCE/token/YOUR_TOKEN/send-text"
        const apiToken = process.env.WHATSAPP_API_TOKEN; // Usado caso use headers como Bearer Token ou ChatPro/Evolution

        if (!apiUrl) {
            console.log("Mock enviando mensagem para", phone, ":", message);
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, mock: true, note: 'Variável WHATSAPP_API_URL não configurada. Simulando sucesso.' })
            };
        }

        // Estrutura genérica de disparo (Ajuste o payload conforme a documentação da sua API: Z-API, Evolution, etc)
        const payload = {
            phone: phone, // A maioria das APIs aceita 'phone' ou 'number' no formato 5511999999999
            message: message // ou 'text'
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(apiToken && { 'Authorization': `Bearer ${apiToken}` }), // Adiciona header de Auth se existir
                // 'apikey': apiToken // Descomente caso use Evolution API / N8N headers customizados
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API Externa respondeu com status: ${response.status}`);
        }

        const data = await response.json();

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, provider_response: data })
        };

    } catch (error) {
        console.error("Erro ao enviar WhatsApp:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to send WhatsApp message', details: error.message })
        };
    }
};
