import React from 'react';
import { GeneratedReport, PsychologistInfo, ReportData, PrimaryColor } from '../../types/psicodoc';
import { COLOR_PALETTES, DOC_DEFINITIONS } from '../../constants/psicodoc';
import { Icons } from './Icons';

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

  const handlePrint = () => {
    window.print();
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
        
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="p-3 rounded-xl bg-muted active-touch flex items-center gap-2"
          >
            <Icons.Printer />
            <span className="hidden md:inline font-bold text-sm">Imprimir</span>
          </button>
          
          <button
            onClick={onSave}
            className="p-3 rounded-xl text-white active-touch flex items-center gap-2"
            style={{ background: palette.hex }}
          >
            <Icons.Download />
            <span className="hidden md:inline font-bold text-sm">Salvar</span>
          </button>
        </div>
      </div>

      {/* Document Preview */}
      <div className="bg-card rounded-2xl shadow-elevation-lg border border-border p-8 md:p-12">
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
    </div>
  );
};

export default PreviewView;
