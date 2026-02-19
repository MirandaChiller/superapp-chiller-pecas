import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('🚀 === INICIO DA FUNÇÃO ===');
  
  try {
    console.log('📝 Parseando request...');
    const data = await request.json();
    console.log('✅ Data recebida:', JSON.stringify(data));
    
    console.log('🔑 Verificando GROQ_API_KEY...');
    const groqApiKey = process.env.GROQ_API_KEY;
    
    if (!groqApiKey) {
      console.error('❌ GROQ_API_KEY NÃO ENCONTRADA!');
      throw new Error('API Key não configurada');
    }
    
    console.log('✅ GROQ_API_KEY encontrada! Length:', groqApiKey.length);

    const systemPrompt = `VOCÊ DEVE RESPONDER EXCLUSIVAMENTE EM PORTUGUÊS BRASILEIRO. NÃO USE INGLÊS EM NENHUMA PARTE DA RESPOSTA.

Você é especialista em criar personas B2B para refrigeração comercial/HVAC no Brasil.

TAREFA: Criar narrativa PROFISSIONAL de 5-6 parágrafos densos (mínimo 800 palavras) sobre técnicos/instaladores HVAC BRASILEIROS.

ESTRUTURA OBRIGATÓRIA (cada parágrafo com 5-7 linhas):
1. Identificação: Nome completo brasileiro, idade, profissão detalhada, anos experiência, certificações brasileiras (NR-10, ANREDE), região de São Paulo onde trabalha, estrutura (solo/equipe)

2. Dia a Dia: Rotina diária COM NÚMEROS ESPECÍFICOS (quantos clientes/dia, horário inicial de trabalho, tipos de atendimento), principais desafios técnicos do mercado brasileiro

3. Comportamento de Compra: Como busca peças no Brasil (WhatsApp, ligação, Google), quando precisa (urgência vs planejado), critérios de decisão (preço vs velocidade), fornecedores que usa

4. Dores e Pressões: Equipamento parado = prejuízo do cliente, falta de peça em estoque, fornecedor lento, atendimento não técnico, impacto na reputação profissional

5. Valores Profissionais: O que valoriza (rapidez, conhecimento técnico, disponibilidade), como escolhe fornecedor, expectativas, relacionamento com clientes

REQUISITOS OBRIGATÓRIOS:
- Use vocabulário técnico HVAC: compressor, condensadora, evaporadora, refrigerante R-404A/R-134a, válvula de expansão, filtro secador
- Inclua números: "atende 4-5 clientes/dia", "ticket médio R$ 800", "90% emergencial"
- Contexto São Paulo: zonas (leste, oeste, sul), bairros, clientes (restaurantes, açougues, supermercados)
- Tom profissional mas humanizado: mencione família brevemente, aspirações profissionais
- Escreva parágrafos DENSOS e COMPLETOS

CRÍTICO: TODA A RESPOSTA DEVE SER EM PORTUGUÊS BRASILEIRO. SEM INGLÊS.`;

    const userPrompt = `RESPONDA APENAS EM PORTUGUÊS BRASILEIRO.

Dados da persona:
Nome: ${data.nome_ficticio || 'Roberto'}
Idade: ${data.idade_min}-${data.idade_max} anos
Profissão: ${data.profissao || 'Técnico Refrigerista'}
Rotina: ${data.estilo_vida || 'Atende clientes diariamente'}
Valores: ${data.valores || 'Qualidade e rapidez'}
Objetivos: ${data.objetivos || 'Crescer profissionalmente'}
Dores: ${data.dores || 'Urgência de atendimento'}
Objeções: ${data.objecoes || 'Preço alto'}

Escreva 5-6 parágrafos COMPLETOS E DENSOS EM PORTUGUÊS sobre esta persona brasileira do setor HVAC/refrigeração.`;

    console.log('🌐 Chamando GROQ API...');
    console.log('Model: qwen/qwen-2.5-32b-instruct');

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen-2.5-32b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.95,
      }),
    });

    console.log('📡 GROQ Response Status:', groqResponse.status);

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('❌ Erro GROQ:', groqResponse.status);
      console.error('❌ Erro body:', errorText);
      throw new Error(`GROQ API Error: ${groqResponse.status}`);
    }

    const result = await groqResponse.json();
    console.log('✅ Resposta GROQ recebida');

    const narrative = result.choices?.[0]?.message?.content || '';
    
    if (!narrative) {
      console.error('❌ Narrativa vazia retornada');
      throw new Error('Narrativa vazia');
    }

    console.log('✅ Narrativa gerada! Tamanho:', narrative.length, 'caracteres');
    console.log('🎉 === SUCESSO ===');
    
    return NextResponse.json({ narrative });

  } catch (error: any) {
    console.error('💥 === ERRO CAPTURADO ===');
    console.error('Mensagem:', error.message);
    
    // Fallback melhorado em português
    let requestData;
    try {
      requestData = await request.json();
    } catch {
      requestData = {};
    }
    
    const fallback = `${requestData.nome_ficticio || 'Roberto'} Silva, ${requestData.idade_min || 35}-${requestData.idade_max || 45} anos, é ${requestData.profissao || 'Técnico Refrigerista'} especializado em refrigeração comercial. Atua principalmente na região metropolitana de São Paulo, atendendo restaurantes, supermercados e estabelecimentos comerciais.

Seu dia a dia é marcado pela urgência: equipamentos parados representam prejuízo imediato para seus clientes. ${requestData.dores || 'Trabalha sob pressão constante, equilibrando qualidade técnica com velocidade de resposta'}. A falta de peças em estoque de fornecedores é um dos maiores gargalos operacionais.

Quando precisa de peças, ${requestData.nome_ficticio || 'Roberto'} prioriza fornecedores que entendem a urgência do setor. ${requestData.valores || 'Valoriza qualidade e agilidade'} acima de tudo. Seu objetivo é ${requestData.objetivos || 'construir uma base sólida de clientes recorrentes'}.

${requestData.objecoes || 'Preço alto sem justificativa técnica e demora na entrega'} são as principais barreiras que enfrenta ao escolher fornecedores. Busca parceiros que falem a linguagem técnica do setor e compreendam a realidade operacional de um técnico de campo.

NOTA: Esta é uma narrativa básica gerada automaticamente devido a um erro na API (${error.message}).`;
    
    console.log('📝 Retornando fallback em português');
    return NextResponse.json({ narrative: fallback });
  }
}
