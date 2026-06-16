const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

export async function callGemini(prompt: string): Promise<{ text: string | null; error: string | null }> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return {
      text: null,
      error:
        'Chave GEMINI_API_KEY não configurada. Adicione GEMINI_API_KEY=sua_chave ao arquivo .env.local e reinicie o servidor.',
    }
  }

  let response: Response
  try {
    response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1500, temperature: 0.3 },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        ],
      }),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro de rede'
    return { text: null, error: `Falha ao conectar com Gemini: ${msg}` }
  }

  if (!response.ok) {
    if (response.status === 400) return { text: null, error: 'Requisição inválida. Verifique a chave de API.' }
    if (response.status === 403) return { text: null, error: 'Chave de API inválida ou sem permissão.' }
    if (response.status === 429) return { text: null, error: 'Limite de chamadas atingido. Tente novamente em alguns minutos.' }
    const body = await response.text().catch(() => '')
    return { text: null, error: `Erro da API Gemini (${response.status}): ${body.slice(0, 120)}` }
  }

  const data = await response.json().catch(() => null)
  const text: string | null = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null
  if (!text) return { text: null, error: 'Resposta vazia da IA.' }
  return { text, error: null }
}
