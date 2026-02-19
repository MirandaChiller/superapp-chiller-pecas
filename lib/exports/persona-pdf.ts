import jsPDF from 'jspdf';

interface Persona {
  nome: string;
  idade_min: number;
  idade_max: number;
  profissao: string;
  dados_demograficos: any;
  narrativa_gerada: string | null;
}

export function generatePersonaPDF(persona: Persona) {
  // Criar elemento HTML temporário
  const container = document.createElement('div');
  container.style.width = '210mm';
  container.style.padding = '20mm';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.backgroundColor = 'white';
  
  // HTML com CSS inline para garantir UTF-8
  container.innerHTML = `
    <div style="background: linear-gradient(135deg, #f97316 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; margin: -20mm -20mm 20px -20mm;">
      <h1 style="margin: 0; font-size: 32px; font-weight: bold;">PERSONA</h1>
      <h2 style="margin: 10px 0 0 0; font-size: 20px; font-weight: normal;">${persona.nome}</h2>
    </div>
    
    <div style="margin-top: 20px;">
      <h3 style="color: #1e293b; font-size: 16px; margin-bottom: 10px; font-weight: bold;">Dados Demográficos</h3>
      <p style="color: #475569; margin: 5px 0; font-size: 12px;"><strong>Idade:</strong> ${persona.idade_min} - ${persona.idade_max} anos</p>
      <p style="color: #475569; margin: 5px 0; font-size: 12px;"><strong>Profissão:</strong> ${persona.profissao}</p>
    </div>
    
    ${persona.narrativa_gerada ? `
      <div style="margin-top: 20px;">
        <h3 style="color: #1e293b; font-size: 16px; margin-bottom: 10px; font-weight: bold;">Narrativa</h3>
        <p style="color: #475569; line-height: 1.6; text-align: justify; font-size: 11px; white-space: pre-wrap;">${persona.narrativa_gerada}</p>
      </div>
    ` : ''}
    
    ${persona.dados_demograficos?.valores ? `
      <div style="margin-top: 20px;">
        <h3 style="color: #1e293b; font-size: 16px; margin-bottom: 10px; font-weight: bold;">Valores</h3>
        <p style="color: #475569; font-size: 11px;">${persona.dados_demograficos.valores}</p>
      </div>
    ` : ''}
    
    ${persona.dados_demograficos?.dores ? `
      <div style="margin-top: 20px;">
        <h3 style="color: #1e293b; font-size: 16px; margin-bottom: 10px; font-weight: bold;">Dores e Desafios</h3>
        <p style="color: #475569; font-size: 11px;">${persona.dados_demograficos.dores}</p>
      </div>
    ` : ''}
    
    <div style="text-align: center; color: #94a3b8; font-size: 10px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
      Gerado por Superapp Chiller Peças
    </div>
  `;
  
  // Adicionar ao DOM temporariamente
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  document.body.appendChild(container);
  
  // Usar html2canvas + jsPDF para converter
  import('html2canvas').then((html2canvas) => {
    html2canvas.default(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
      
      // Se precisar de múltiplas páginas
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }
      
      // Remover elemento temporário
      document.body.removeChild(container);
      
      // Download
      pdf.save(`persona-${persona.nome.toLowerCase().replace(/\s/g, '-')}.pdf`);
    });
  });
}
