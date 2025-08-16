// api/ask.js

export default async function handler(req, res) {
  // 1. Validar se o método é POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Apenas o método POST é permitido' });
  }

  // 2. Pegar a URL do n8n das variáveis de ambiente
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

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      return res.status(n8nResponse.status).json({ error: `Erro do n8n: ${errorText}` });
    }

    // --- INÍCIO DA ALTERAÇÃO ---

    // 4. Processar a resposta do n8n
    const n8nData = await n8nResponse.json();

    // O n8n pode retornar uma lista de objetos ou um único objeto.
    // Esta lógica extrai a resposta do campo "output" de forma segura.
    let finalAnswer = 'Não foi possível encontrar uma resposta.'; // Mensagem padrão

    if (Array.isArray(n8nData) && n8nData[0] && n8nData[0].output) {
      // Caso a resposta seja uma lista: [ { "output": "..." } ]
      finalAnswer = n8nData[0].output;
    } else if (n8nData && n8nData.output) {
      // Caso a resposta seja um objeto único: { "output": "..." }
      finalAnswer = n8nData.output;
    }

    // 5. Construir o objeto final no formato que o frontend espera
    const frontendResponse = {
      answer: finalAnswer
    };

    // 6. Enviar a resposta já formatada para o frontend
    res.status(200).json(frontendResponse);
    
    // --- FIM DA ALTERAÇÃO ---

  } catch (error) {
    console.error('Erro na função serverless:', error);
    res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
  }
}
