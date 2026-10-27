export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  try {
    const body = req.body || {};
    const userText = body.message || body.prompt || body.query || body.text || (Array.isArray(body.messages) ? body.messages.map(m => m.content).join('\n') : '');

    if (!userText) return res.status(400).json({ error: 'No message provided' });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY missing on server' });

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are Complaint Finder. Find real customer complaints about any brand/product from Reddit, X, Amazon, forums. Summarize complaints with sources. Format: Short summary, then list complaints. If no complaints found, say so.' },
          { role: 'user', content: userText }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    const data = await groqRes.json();
    if (!groqRes.ok) return res.status(500).json({ error: data.error?.message || 'Groq error', details: data });

    const reply = data.choices?.[0]?.message?.content || 'No reply';
    return res.status(200).json({ reply, response: reply, text: reply, result: reply });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
