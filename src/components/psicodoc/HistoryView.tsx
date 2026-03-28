import React, { useState } from 'react';
import { ReportData, PrimaryColor } from '../../types/psicodoc';
import { COLOR_PALETTES, DOC_DEFINITIONS } from '../../constants/psicodoc';
import { Icons } from './Icons';

interface HistoryViewProps {
  reports: ReportData[];
  primaryColor: PrimaryColor;
  onSelectReport: (report: ReportData) => void;
  onDeleteReport?: (reportId: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  reports,
  primaryColor,
  onSelectReport,
  onDeleteReport,
}) => {
  const palette = COLOR_PALETTES[primaryColor];
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 page-enter">
      <header className="px-2">
        <h2 className="text-2xl md:text-3xl font-black">Histórico</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Documentos gerados anteriormente
        </p>
      </header>

      <div className="space-y-3 px-1">
        {reports.length > 0 ? (
          reports.map(report => (
            <div
              key={report.id}
              className="card-elevated p-4 w-full text-left active-touch hover:shadow-elevation-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => onSelectReport(report)}
                  className="flex items-start gap-4 flex-1 min-w-0 text-left"
                >
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
                </button>
                {onDeleteReport && (
                  <button
                    onClick={() => setDeleteConfirm(report.id)}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  >
                    <Icons.Trash />
                  </button>
                )}
              </div>
            </div>
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

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-card rounded-3xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mx-auto mb-4">
              <div className="text-destructive">
                <Icons.AlertCircle />
              </div>
            </div>
            <h3 className="text-xl font-black text-center mb-2">Excluir documento?</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-xl font-bold bg-muted active-touch"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteReport?.(deleteConfirm);
                  setDeleteConfirm(null);
                }}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-destructive active-touch"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryView;
