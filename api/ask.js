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

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatInput: userQuestion })
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      return res.status(n8nResponse.status).json({ error: `Erro do n8n: ${errorText}` });
    }

    const n8nData = await n8nResponse.json();
    let answer = '';

    // Se o n8n retornar um array de objetos
    if (Array.isArray(n8nData) && n8nData.length > 0) {
      const firstItem = n8nData[0].json || {};
      answer = firstItem.output || firstItem.text || firstItem.answer || '';
    } 
    // Se o n8n retornar um objeto direto
    else if (typeof n8nData === 'object' && n8nData !== null) {
      answer = n8nData.output || n8nData.text || n8nData.answer || '';
    }

    res.status(200).send(answer);

  } catch (error) {
    console.error('Erro na função serverless:', error);
    res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
  }
}
