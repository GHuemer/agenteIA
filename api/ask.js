export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Apenas o método POST é permitido' });
  }

  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!n8nWebhookUrl) {
    return res.status(500).json({ error: 'Webhook do n8n não configurado no servidor.' });
  }

  try {
    const userQuestion = req.body.question;

    // Enviando para o n8n no formato { "question": "..." }
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: userQuestion })
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      return res.status(n8nResponse.status).json({ error: `Erro do n8n: ${errorText}` });
    }

    const n8nData = await n8nResponse.json();
    let finalAnswer = 'Desculpe, não consegui processar a resposta.';

    // Extrai a resposta do n8n de forma segura
    if (Array.isArray(n8nData) && n8nData[0] && n8nData[0].output) {
      finalAnswer = n8nData[0].output;
    } else if (n8nData && n8nData.output) {
      finalAnswer = n8nData.output;
    }

    // --- A CORREÇÃO PRINCIPAL ESTÁ AQUI ---
    // Envia a resposta de volta para o frontend no formato JSON correto
    res.status(200).json({ answer: finalAnswer });

  } catch (error) {
    console.error('Erro na função serverless:', error);
    res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
  }
}
