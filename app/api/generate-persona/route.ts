import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Você é especialista em personas B2B. Crie narrativas profissionais e humanizadas focadas no mercado brasileiro.'
          },
          {
            role: 'user',
            content: `Crie narrativa profissional para: ${data.nome_ficticio}, ${data.idade_min}-${data.idade_max} anos, ${data.profissao}. Estilo: ${data.estilo_vida}. Valores: ${data.valores}. Objetivos: ${data.objetivos}. Dores: ${data.dores}. Objeções: ${data.objecoes}. Máximo 4 parágrafos, terceira pessoa, tom B2B brasileiro.`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const result = await response.json();
    return NextResponse.json({ narrative: result.choices[0]?.message?.content || '' });

  } catch (error) {
    const data = await request.json();
    const fallback = `${data.nome_ficticio}, ${data.idade_min}-${data.idade_max} anos, atua como ${data.profissao}. ${data.estilo_vida}. Valoriza ${data.valores}. Objetivo: ${data.objetivos}. Desafios: ${data.dores}. Objeções: ${data.objecoes}.`;
    return NextResponse.json({ narrative: fallback });
  }
}
