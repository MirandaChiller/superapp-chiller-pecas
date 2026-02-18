import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Chamada para API do GROQ (100% gratuita)
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
            content: `Você é um Especialista Sênior em Inteligência de Cliente B2B e Criação de Personas Estratégicas, com 15 anos de experiência em empresas de tecnologia, distribuição técnica e mercados B2B complexos.

CONTEXTO: A Chiller Peças BR é uma distribuidora técnica de peças para refrigeração comercial e industrial no Brasil. Mercado B2B altamente especializado onde:
- Ciclo de compra: 70% das decisões ocorrem em janelas de 2 horas ou menos
- Cliente prioritário: Técnicos HVAC, instaladores e pequenos empresários do setor
- Diferencial: Velocidade de resposta, credenciais técnicas e disponibilidade

SUA MISSÃO: Criar uma narrativa de persona profissional, humanizada e estratégica que capture:
1. Contexto profissional real do mercado B2B brasileiro
2. Dores operacionais específicas do setor HVAC/refrigeração
3. Motivadores de decisão de compra em situações de urgência
4. Padrões comportamentais de técnicos e instaladores
5. Linguagem autêntica do setor técnico

DIRETRIZES:
- Escreva em terceira pessoa, tom profissional mas humanizado
- Use vocabulário técnico quando apropriado (BTUs, refrigerante, compressor, etc)
- Foque em dores reais: urgência de atendimento, disponibilidade de peças, suporte técnico
- Inclua contexto familiar/pessoal brevemente para humanizar
- Máximo 4-5 parágrafos
- Capture a pressão do dia a dia: clientes ligando, equipamentos parados, prazos apertados
- Mencione valores profissionais: reputação, qualidade do serviço, satisfação do cliente

NÃO USE:
- Marcadores ou listas
- Formatação excessiva
- Jargão de marketing genérico
- Estereótipos superficiais`
          },
          {
            role: 'user',
            content: `Crie uma narrativa profissional e humanizada para esta persona do setor B2B de HVAC/refrigeração:

DADOS FORNECIDOS:
- Nome: ${data.nome_ficticio || 'Roberto'}
- Idade: ${data.idade_min}-${data.idade_max} anos
- Profissão: ${data.profissao}
- Estilo de Vida: ${data.estilo_vida}
- Valores Profissionais: ${data.valores}
- Objetivos de Negócio: ${data.objetivos}
- Dores e Desafios Operacionais: ${data.dores}
- Objeções ao Comprar: ${data.objecoes}

IMPORTANTE: 
Crie uma narrativa que mostre o dia a dia real deste profissional, suas pressões, como toma decisões de compra, por que velocidade e disponibilidade importam tanto, e como ele equilibra qualidade técnica com urgência operacional.

Foque no contexto B2B brasileiro, mercado de refrigeração comercial/industrial, e nas especificidades de São Paulo.`
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error('Erro ao gerar narrativa com GROQ');
    }

    const result = await response.json();
    const narrative = result.choices[0]?.message?.content || '';

    return NextResponse.json({ narrative });

  } catch (error) {
    console.error('Erro na API de persona:', error);
    
    // Fallback: Se GROQ falhar, retorna narrativa básica
    const data = await request.json();
    const fallbackNarrative = `${data.nome_ficticio}, com ${data.idade_min}-${data.idade_max} anos, atua como ${data.profissao}. ${data.estilo_vida}. Valoriza principalmente ${data.valores}. Seu principal objetivo é ${data.objetivos}, porém enfrenta desafios como ${data.dores}. Antes de tomar decisões de compra, costuma questionar aspectos como ${data.objecoes}.`;
    
    return NextResponse.json({ narrative: fallbackNarrative });
  }
}
