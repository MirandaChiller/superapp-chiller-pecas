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
      console.error('Env vars disponíveis:', Object.keys(process.env));
      throw new Error('API Key não configurada');
    }
    
    console.log('✅ GROQ_API_KEY encontrada! Length:', groqApiKey.length);

    const systemPrompt = `Você é especialista em criar personas B2B para refrigeração comercial/HVAC no Brasil.

Crie narrativa PROFISSIONAL de 5-6 parágrafos densos (mínimo 800 palavras) sobre técnicos/instaladores HVAC.

ESTRUTURA (cada parágrafo com 5-7 linhas):
1. Identificação: Nome, idade, profissão detalhada, anos experiência, certificações, onde trabalha
2. Dia a Dia: Rotina COM NÚMEROS (quantos clientes/dia), horários, desafios
3. Compra: Como busca peças, quando, critérios (preço vs velocidade)
4. Dores: Equipamento parado, falta peça, urgência, impacto reputação
5. Valores: O que valoriza, como escolhe fornecedor

Use vocabulário técnico: compressor, refrigerante R-404A, válvula expansão, condensadora.
Contexto São Paulo. Tom profissional mas humanizado.`;

    const userPrompt = `Nome: ${data.nome_ficticio || 'Roberto'}
Idade: ${data.idade_min}-${data.idade_max} anos
Profissão: ${data.profissao || 'Técnico Refrigerista'}
Rotina: ${data.estilo_vida || 'Atende clientes diariamente'}
Valores: ${data.valores || 'Qualidade e rapidez'}
Objetivos: ${data.objetivos || 'Crescer profissionalmente'}
Dores: ${data.dores || 'Urgência de atendimento'}
Objeções: ${data.objecoes || 'Preço alto'}

Escreva 5-6 parágrafos DENSOS sobre esta persona do setor HVAC/refrigeração.`;

    console.log('🌐 Chamando GROQ API...');
    console.log('URL:', 'https://api.groq.com/openai/v1/chat/completions');
    console.log('Model:', 'llama-3.1-70b-versatile');

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 1500,
        top_p: 1,
      }),
    });

    console.log('📡 GROQ Response Status:', groqResponse.status);
    console.log('📡 GROQ Response OK:', groqResponse.ok);

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('❌ Erro GROQ:', groqResponse.status);
      console.error('❌ Erro body:', errorText);
      throw new Error(`GROQ API Error: ${groqResponse.status} - ${errorText}`);
    }

    const result = await groqResponse.json();
    console.log('✅ Resposta GROQ recebida');
    console.log('Choices length:', result.choices?.length);

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
    console.error('Tipo do erro:', error.constructor.name);
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    
    // Fallback melhorado
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

NOTA: Esta é uma narrativa básica gerada automaticamente devido a um erro na API de IA (${error.message}). Para narrativas mais detalhadas, verifique os logs da aplicação.`;
    
    console.log('📝 Retornando fallback. Tamanho:', fallback.length);
    return NextResponse.json({ narrative: fallback });
  }
}
