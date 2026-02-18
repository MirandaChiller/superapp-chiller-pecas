fetch('/api/generate-persona', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nome_ficticio: 'Rafael',
    idade_min: 35,
    idade_max: 45,
    profissao: 'Técnico Refrigerista',
    estilo_vida: 'Trabalha muito',
    valores: 'Qualidade',
    objetivos: 'Crescer',
    dores: 'Urgência',
    objecoes: 'Preço'
  })
}).then(r => r.json()).then(d => console.log(d))
```

7. **IMEDIATAMENTE vá nos logs da Vercel** (Live mode)

---

## 📊 LOGS ESPERADOS

Você vai ver algo como:
```
🚀 === INICIO DA FUNÇÃO ===
🔑 Verificando GROQ_API_KEY...
✅ GROQ_API_KEY encontrada! Length: 56
🌐 Chamando GROQ API...
✅ Narrativa gerada! Tamanho: 1234 caracteres
```

**OU** (se for o problema):
```
❌ GROQ_API_KEY NÃO ENCONTRADA!
💥 === ERRO CAPTURADO ===
