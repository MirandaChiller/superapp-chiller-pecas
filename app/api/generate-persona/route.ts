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
        model: 'llama-3.3-70b-versatile', // Modelo mais recente e potente
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em criação de personas B2B para o setor de refrigeração comercial e HVAC no Brasil.

CONTEXTO: Chiller Peças BR - distribuidora técnica de peças para refrigeração comercial/industrial em São Paulo.
Mercado: Técnicos HVAC, instaladores, empresários do setor. 70% das decisões em menos de 2 horas (emergências).

TAREFA: Criar narrativa profissional LONGA E DETALHADA (mínimo 5-6 parágrafos) sobre a persona.

ESTRUTURA OBRIGATÓRIA (cada parágrafo com 6-8 linhas):

1. IDENTIFICAÇÃO: Nome completo, idade, profissão detalhada, anos de experiência, certificações, onde atende, estrutura (solo/equipe).

2. DIA A DIA OPERACIONAL: Rotina diária COM NÚMEROS (quantos clientes/dia, horário de trabalho, tipos de atendimento), principais desafios técnicos.

3. COMPORTAMENTO DE COMPRA: Como busca peças (WhatsApp, ligação, Google), quando precisa (urgência vs planejado), critérios de decisão (preço vs velocidade), onde compra.

4. DORES E PRESSÕES: Equipamento parado = prejuízo do cliente, falta de peça em estoque, fornecedor lento, atendimento não técnico, impacto na reputação.

5. VALORES E FORNECEDORES: O que valoriza (rapidez, conhecimento técnico, disponibilidade), como escolhe fornecedor, expectativas, o que o frustra.

REQUISITOS:
- Use vocabulário técnico real: compressor, condensadora, evaporadora, refrigerante R-404A/R-134a, válvula de expansão, pressostato, filtro secador
- Inclua números específicos: "atende 4-5 clientes/dia", "ticket médio R$ 800", "90% emergencial"
- Contexto de São Paulo: zonas (leste, oeste, sul), bairros, tipo de clientes (restaurantes, açougues, supermercados)
- Tom profissional mas humanizado: mencione família (1 frase), aspirações profissionais
- MÍNIMO 1500 palavras na narrativa final

NÃO USE: listas com marcadores, formatação excessiva, clichês de marketing`
          },
          {
            role: 'user',
            content: `Crie narrativa PROFISSIONAL e DETALHADA (5-6 parágrafos densos) para:

Nome: ${data.nome_ficticio}
Idade: ${data.idade_min}-${data.idade_max} anos  
Profissão: ${data.profissao}
Rotina/Estilo: ${data.estilo_vida}
Valores: ${data.valores}
Objetivos: ${data.objetivos}
Dores: ${data.dores}
Objeções: ${data.objecoes}

Siga RIGOROSAMENTE a estrutura de 5 parágrafos acima. Use vocabulário técnico HVAC. Inclua NÚMEROS específicos. Mínimo 1500 palavras.`
          }
        ],
        temperature: 0.9,
        max_tokens: 2000,
        top_p: 1,
        stream: false,
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
