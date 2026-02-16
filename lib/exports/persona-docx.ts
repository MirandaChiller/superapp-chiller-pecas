import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

interface Persona {
  nome: string;
  idade_min: number;
  idade_max: number;
  profissao: string;
  dados_demograficos: any;
  narrativa_gerada: string | null;
}

export async function generatePersonaDOCX(persona: Persona) {
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          text: 'PERSONA',
          heading: HeadingLevel.HEADING_1,
          alignment: 'center',
        }),
        new Paragraph({
          text: persona.nome,
          heading: HeadingLevel.HEADING_2,
          alignment: 'center',
        }),
        new Paragraph({ text: '' }),
        
        new Paragraph({
          text: 'Dados Demográficos',
          heading: HeadingLevel.HEADING_3,
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Idade: ${persona.idade_min} - ${persona.idade_max} anos` }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Profissão: ${persona.profissao}` }),
          ],
        }),
        new Paragraph({ text: '' }),
        
        ...(persona.narrativa_gerada ? [
          new Paragraph({
            text: 'Narrativa',
            heading: HeadingLevel.HEADING_3,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: persona.narrativa_gerada }),
            ],
          }),
          new Paragraph({ text: '' }),
        ] : []),
        
        ...(persona.dados_demograficos?.valores ? [
          new Paragraph({
            text: 'Valores',
            heading: HeadingLevel.HEADING_3,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: persona.dados_demograficos.valores }),
            ],
          }),
          new Paragraph({ text: '' }),
        ] : []),
        
        ...(persona.dados_demograficos?.dores ? [
          new Paragraph({
            text: 'Dores e Desafios',
            heading: HeadingLevel.HEADING_3,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: persona.dados_demograficos.dores }),
            ],
          }),
        ] : []),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `persona-${persona.nome.toLowerCase().replace(/\s/g, '-')}.docx`);
}
