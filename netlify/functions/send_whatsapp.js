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

        const apiUrl = process.env.WHATSAPP_API_URL;
        const apiToken = process.env.WHATSAPP_API_TOKEN;
        const clientToken = process.env.WHATSAPP_CLIENT_TOKEN;

        if (!apiUrl) {
            console.log("Mock enviando mensagem para", phone, ":", message);
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, mock: true, note: 'Variável WHATSAPP_API_URL não configurada. Simulando sucesso.' })
            };
        }

        // Generic Payload for Z-API / Evolution
        const payload = {
            phone: phone, // A maioria das APIs aceita 'phone' ou 'number'
            message: message
        };

        console.log(`[WhatsApp API] Tentando enviar para: ${phone} via ${apiUrl}`);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(apiToken && { 'Authorization': `Bearer ${apiToken}` }),
                ...(clientToken && { 'client-token': clientToken })
            },
            body: JSON.stringify(payload)
        });

        // Tentar extrair corpo de erro da API Externa
        const responseText = await response.text();
        let data = {};
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            data = { rawText: responseText };
        }

        if (!response.ok) {
            console.error(`[WhatsApp API] Erro do provedor: Status ${response.status}`, data);
            throw new Error(`A API Externa (Z-API/Evolution) falhou: HTTP ${response.status} - ${JSON.stringify(data)}`);
        }

        console.log(`[WhatsApp API] Sucesso:`, data);
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, provider_response: data })
        };

    } catch (error) {
        console.error("[WhatsApp API] Exception caught:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Falha ao processar o envio na Netlify', details: error.message })
        };
    }
};
