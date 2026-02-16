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
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(249, 115, 22); // Orange
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('PERSONA', 105, 20, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(persona.nome, 105, 32, { align: 'center' });
  
  // Content
  doc.setTextColor(0, 0, 0);
  let yPos = 55;
  
  // Dados básicos
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Dados Demográficos', 20, yPos);
  yPos += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Idade: ${persona.idade_min} - ${persona.idade_max} anos`, 20, yPos);
  yPos += 6;
  doc.text(`Profissão: ${persona.profissao}`, 20, yPos);
  yPos += 10;
  
  // Narrativa
  if (persona.narrativa_gerada) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Narrativa', 20, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const splitText = doc.splitTextToSize(persona.narrativa_gerada, 170);
    doc.text(splitText, 20, yPos);
    yPos += splitText.length * 6 + 10;
  }
  
  // Dados adicionais
  if (persona.dados_demograficos) {
    const dados = persona.dados_demograficos;
    
    if (dados.valores) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Valores', 20, yPos);
      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const splitText = doc.splitTextToSize(dados.valores, 170);
      doc.text(splitText, 20, yPos);
      yPos += splitText.length * 6 + 10;
    }
    
    if (dados.dores) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Dores e Desafios', 20, yPos);
      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const splitText = doc.splitTextToSize(dados.dores, 170);
      doc.text(splitText, 20, yPos);
      yPos += splitText.length * 6 + 10;
    }
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Gerado por Superapp Chiller Peças', 105, 285, { align: 'center' });
  
  doc.save(`persona-${persona.nome.toLowerCase().replace(/\s/g, '-')}.pdf`);
}
