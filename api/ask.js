// api/ask.js

export default async function handler(req, res) {
  // 1. Validar se o método é POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Apenas o método POST é permitido' });
  }

  // 2. Pegar a URL do n8n das variáveis de ambiente (mais seguro)
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!n8nWebhookUrl) {
    return res.status(500).json({ error: 'Webhook do n8n não configurado no servidor.' });
  }

  try {
    // 3. Encaminhar a pergunta para o n8n
    const userQuestion = req.body.question;
    
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: userQuestion })
    });

    // 4. Se a resposta do n8n não for OK, retorna o erro
    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      return res.status(n8nResponse.status).json({ error: `Erro do n8n: ${errorText}` });
    }

    // 5. Encaminhar a resposta do n8n de volta para o frontend
    const n8nData = await n8nResponse.json();
    res.status(200).json(n8nData); // Repassa a resposta completa, ex: { "answer": "..." }

  } catch (error) {
    console.error('Erro na função serverless:', error);
    res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
  }
}
