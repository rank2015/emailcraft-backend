export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, tone, category } = req.body;

  if (!query || !tone || !category) {
    return res.status(400).json({ error: 'Missing required fields: query, tone, or category' });
  }

  const apiKey = process.env.EMAILCRAFT_OPENAI_KEY;

  if (!apiKey) {
    console.error("❌ Missing EMAILCRAFT_OPENAI_KEY environment variable");
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an email-writing assistant that crafts ${tone.toLowerCase()} emails for ${category.toLowerCase()} purposes.`,
          },
          {
            role: 'user',
            content: query,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ OpenAI API Error:", data);
      return res.status(500).json({ error: 'OpenAI API failed', details: data });
    }

    const result = data.choices[0].message.content;
    return res.status(200).json({ result });

  } catch (error) {
    console.error("❌ Unexpected Server Error:", error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
