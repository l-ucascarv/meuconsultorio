import React from 'react';
import { ReportData, PrimaryColor } from '../../types/psicodoc';
import { COLOR_PALETTES, DOC_DEFINITIONS } from '../../constants/psicodoc';
import { Icons } from './Icons';

interface HistoryViewProps {
  reports: ReportData[];
  primaryColor: PrimaryColor;
  onSelectReport: (report: ReportData) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  reports,
  primaryColor,
  onSelectReport,
}) => {
  const palette = COLOR_PALETTES[primaryColor];

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 page-enter">
      {/* Header */}
      <header className="px-2">
        <h2 className="text-2xl md:text-3xl font-black">Histórico</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Documentos gerados anteriormente
        </p>
      </header>

      {/* Reports List */}
      <div className="space-y-3 px-1">
        {reports.length > 0 ? (
          reports.map(report => (
            <button
              key={report.id}
              onClick={() => onSelectReport(report)}
              className="card-elevated p-4 w-full text-left active-touch hover:shadow-elevation-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${palette.hex}15` }}
                >
                  <div style={{ color: palette.hex }}>
                    <Icons.FileText />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm">
                    {DOC_DEFINITIONS[report.type].label}
                  </p>
                  <p className="text-muted-foreground text-xs truncate">
                    {report.patientName}
                  </p>
                  <p className="text-muted-foreground text-[10px] mt-1">
                    {new Date(report.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="text-center py-16">
            <div 
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: `${palette.hex}15` }}
            >
              <div style={{ color: palette.hex }}>
                <Icons.History />
              </div>
            </div>
            <p className="font-bold text-muted-foreground">
              Nenhum documento gerado ainda
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Seus documentos aparecerão aqui após serem salvos
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryView;
