import React, { useState, useRef } from 'react';
import { GeneratedReport, PsychologistInfo, ReportData, PrimaryColor } from '../../types/psicodoc';
import { COLOR_PALETTES, DOC_DEFINITIONS } from '../../constants/psicodoc';
import { Icons } from './Icons';
import { toast } from 'sonner';

interface PreviewViewProps {
  generatedDoc: GeneratedReport;
  reportData: ReportData;
  psychoInfo: PsychologistInfo;
  onBack: () => void;
  onSave: () => void;
}

export const PreviewView: React.FC<PreviewViewProps> = ({
  generatedDoc,
  reportData,
  psychoInfo,
  onBack,
  onSave,
}) => {
  const palette = COLOR_PALETTES[psychoInfo.primaryColor];
  const documentRef = useRef<HTMLDivElement>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const handlePrint = () => {
    setShowPrintModal(false);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleDownloadTxt = () => {
    const content = generateTextContent();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${DOC_DEFINITIONS[reportData.type].label} - ${reportData.patientName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Documento baixado com sucesso!');
    setShowSaveModal(false);
  };

  const handleDownloadHtml = () => {
    if (!documentRef.current) return;
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${generatedDoc.title || DOC_DEFINITIONS[reportData.type].label}</title>
  <style>
    body { font-family: 'Times New Roman', serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.8; color: #1a1a1a; }
    h1 { text-align: center; font-size: 1.5em; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; }
    .subtitle { text-align: center; color: #666; font-size: 0.9em; margin-bottom: 40px; }
    h2 { font-size: 0.85em; text-transform: uppercase; letter-spacing: 3px; color: #666; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
    .content { white-space: pre-wrap; text-align: justify; }
    .footer { margin-top: 60px; text-align: center; border-top: 1px solid #333; padding-top: 20px; }
    .signature { width: 200px; border-top: 1px solid #333; margin: 30px auto 10px; }
    @media print { body { margin: 0; padding: 20mm; } }
  </style>
</head>
<body>
  <h1>${generatedDoc.title || DOC_DEFINITIONS[reportData.type].label}</h1>
  <p class="subtitle">Documento gerado em conformidade com a Resolução CFP Nº 06/2019</p>
  
  <h2>1. Identificação</h2>
  <div class="content">${generatedDoc.identification}</div>
  
  ${generatedDoc.demand ? `<h2>2. Demanda</h2><div class="content">${generatedDoc.demand}</div>` : ''}
  ${generatedDoc.procedure ? `<h2>3. Procedimento</h2><div class="content">${generatedDoc.procedure}</div>` : ''}
  ${generatedDoc.analysis ? `<h2>4. Análise</h2><div class="content">${generatedDoc.analysis}</div>` : ''}
  
  <h2>${generatedDoc.analysis ? '5.' : '2.'} Conclusão</h2>
  <div class="content">${generatedDoc.conclusion}</div>
  
  <div class="footer">
    <p>${reportData.city}, ${new Date(reportData.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    <div class="signature"></div>
    <p><strong>${psychoInfo.name}</strong></p>
    <p>${psychoInfo.specialty}</p>
    <p>CRP: ${psychoInfo.crp}</p>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${DOC_DEFINITIONS[reportData.type].label} - ${reportData.patientName}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Documento HTML baixado!');
    setShowSaveModal(false);
  };

  const generateTextContent = () => {
    const sections = [
      `${generatedDoc.title || DOC_DEFINITIONS[reportData.type].label}`,
      `Documento gerado em conformidade com a Resolução CFP Nº 06/2019`,
      '',
      '1. IDENTIFICAÇÃO',
      generatedDoc.identification,
      '',
    ];

    if (generatedDoc.demand) {
      sections.push('2. DEMANDA', generatedDoc.demand, '');
    }
    if (generatedDoc.procedure) {
      sections.push('3. PROCEDIMENTO', generatedDoc.procedure, '');
    }
    if (generatedDoc.analysis) {
      sections.push('4. ANÁLISE', generatedDoc.analysis, '');
    }

    sections.push(
      `${generatedDoc.analysis ? '5.' : '2.'} CONCLUSÃO`,
      generatedDoc.conclusion,
      '',
      '---',
      `${reportData.city}, ${new Date(reportData.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      '',
      psychoInfo.name,
      psychoInfo.specialty || '',
      `CRP: ${psychoInfo.crp}`,
    );

    return sections.join('\n');
  };

  const handleCopyToClipboard = async () => {
    const content = generateTextContent();
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Documento copiado para a área de transferência!');
      setShowShareModal(false);
    } catch {
      toast.error('Erro ao copiar documento');
    }
  };

  const handleSaveAndClose = () => {
    onSave();
    toast.success('Documento salvo no histórico!');
  };

  return (
    <div className="max-w-4xl mx-auto py-4 page-enter">
      {/* Action Bar */}
      <div className="no-print flex items-center justify-between gap-4 mb-6 px-2">
        <button 
          onClick={onBack}
          className="p-2 rounded-xl bg-muted active-touch"
        >
          <Icons.ArrowLeft />
        </button>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowShareModal(true)}
            className="p-3 rounded-xl bg-muted active-touch flex items-center gap-2"
            title="Compartilhar"
          >
            <Icons.Share />
          </button>
          
          <button
            onClick={() => setShowPrintModal(true)}
            className="p-3 rounded-xl bg-muted active-touch flex items-center gap-2"
          >
            <Icons.Printer />
            <span className="hidden md:inline font-bold text-sm">Imprimir</span>
          </button>
          
          <button
            onClick={() => setShowSaveModal(true)}
            className="p-3 rounded-xl bg-muted active-touch flex items-center gap-2"
          >
            <Icons.Download />
            <span className="hidden md:inline font-bold text-sm">Baixar</span>
          </button>
          
          <button
            onClick={handleSaveAndClose}
            className="p-3 rounded-xl text-white active-touch flex items-center gap-2"
            style={{ background: palette.hex }}
          >
            <Icons.Check />
            <span className="hidden md:inline font-bold text-sm">Salvar</span>
          </button>
        </div>
      </div>

      {/* Document Preview */}
      <div 
        ref={documentRef}
        className="print-document bg-card rounded-2xl shadow-elevation-lg border border-border p-8 md:p-12"
      >
        {/* Header */}
        <div className="text-center mb-8 border-b border-border pb-8">
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-wide mb-2">
            {generatedDoc.title || DOC_DEFINITIONS[reportData.type].label}
          </h1>
          <p className="text-sm text-muted-foreground">
            Documento gerado em conformidade com a Resolução CFP Nº 06/2019
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 text-sm leading-relaxed">
          {/* Identification */}
          <section>
            <h2 className="font-black uppercase text-xs tracking-widest text-muted-foreground mb-3">
              1. Identificação
            </h2>
            <div className="whitespace-pre-wrap">{generatedDoc.identification}</div>
          </section>

          {/* Demand (if present) */}
          {generatedDoc.demand && (
            <section>
              <h2 className="font-black uppercase text-xs tracking-widest text-muted-foreground mb-3">
                2. Demanda
              </h2>
              <div className="whitespace-pre-wrap">{generatedDoc.demand}</div>
            </section>
          )}

          {/* Procedure (if present) */}
          {generatedDoc.procedure && (
            <section>
              <h2 className="font-black uppercase text-xs tracking-widest text-muted-foreground mb-3">
                3. Procedimento
              </h2>
              <div className="whitespace-pre-wrap">{generatedDoc.procedure}</div>
            </section>
          )}

          {/* Analysis (if present) */}
          {generatedDoc.analysis && (
            <section>
              <h2 className="font-black uppercase text-xs tracking-widest text-muted-foreground mb-3">
                4. Análise
              </h2>
              <div className="whitespace-pre-wrap">{generatedDoc.analysis}</div>
            </section>
          )}

          {/* Conclusion */}
          <section>
            <h2 className="font-black uppercase text-xs tracking-widest text-muted-foreground mb-3">
              {generatedDoc.analysis ? '5.' : '2.'} Conclusão
            </h2>
            <div className="whitespace-pre-wrap">{generatedDoc.conclusion}</div>
          </section>
        </div>

        {/* Footer / Signature */}
        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-sm mb-2">
            {reportData.city}, {new Date(reportData.date).toLocaleDateString('pt-BR', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
          
          <div className="mt-8 inline-block">
            <div className="border-t border-foreground w-64 mx-auto mb-2" />
            <p className="font-bold">{psychoInfo.name}</p>
            <p className="text-sm text-muted-foreground">{psychoInfo.specialty}</p>
            <p className="text-sm text-muted-foreground">CRP: {psychoInfo.crp}</p>
          </div>
        </div>
      </div>

      {/* Download Options Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-card rounded-t-3xl md:rounded-3xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black">Baixar Documento</h3>
              <button 
                onClick={() => setShowSaveModal(false)}
                className="p-2 rounded-full hover:bg-muted"
              >
                <Icons.X />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleDownloadTxt}
                className="w-full p-4 rounded-xl border-2 border-border hover:border-primary/50 flex items-center gap-4 active-touch transition-all"
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${palette.hex}15`, color: palette.hex }}
                >
                  <Icons.FileText />
                </div>
                <div className="text-left">
                  <p className="font-black">Texto (.txt)</p>
                  <p className="text-xs text-muted-foreground">Formato simples, compatível com qualquer editor</p>
                </div>
              </button>

              <button
                onClick={handleDownloadHtml}
                className="w-full p-4 rounded-xl border-2 border-border hover:border-primary/50 flex items-center gap-4 active-touch transition-all"
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${palette.hex}15`, color: palette.hex }}
                >
                  <Icons.File />
                </div>
                <div className="text-left">
                  <p className="font-black">HTML Formatado</p>
                  <p className="text-xs text-muted-foreground">Com formatação profissional, pronto para impressão</p>
                </div>
              </button>

              <button
                onClick={() => { setShowSaveModal(false); setShowPrintModal(true); }}
                className="w-full p-4 rounded-xl border-2 border-border hover:border-primary/50 flex items-center gap-4 active-touch transition-all"
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${palette.hex}15`, color: palette.hex }}
                >
                  <Icons.Printer />
                </div>
                <div className="text-left">
                  <p className="font-black">Imprimir / PDF</p>
                  <p className="text-xs text-muted-foreground">Use "Salvar como PDF" na janela de impressão</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Confirmation Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl w-full max-w-sm p-6 animate-slide-up">
            <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4" style={{ background: `${palette.hex}15` }}>
              <div style={{ color: palette.hex }}>
                <Icons.Printer />
              </div>
            </div>
            <h3 className="text-xl font-black text-center mb-2">Imprimir Documento</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Para salvar como PDF, selecione "Salvar como PDF" nas opções de destino da impressora.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPrintModal(false)}
                className="flex-1 py-3 rounded-xl font-bold bg-muted active-touch"
              >
                Cancelar
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 py-3 rounded-xl font-bold text-white active-touch"
                style={{ background: palette.hex }}
              >
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-card rounded-t-3xl md:rounded-3xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black">Compartilhar</h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="p-2 rounded-full hover:bg-muted"
              >
                <Icons.X />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleCopyToClipboard}
                className="w-full p-4 rounded-xl border-2 border-border hover:border-primary/50 flex items-center gap-4 active-touch transition-all"
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${palette.hex}15`, color: palette.hex }}
                >
                  <Icons.Copy />
                </div>
                <div className="text-left">
                  <p className="font-black">Copiar Texto</p>
                  <p className="text-xs text-muted-foreground">Copiar conteúdo para área de transferência</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewView;