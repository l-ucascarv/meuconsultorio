import React from 'react';
import { Icons } from './Icons';

interface LoadingOverlayProps {
  isVisible: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[300] flex items-center justify-center text-white text-center p-6">
      <div className="flex flex-col items-center">
        <div className="p-4 rounded-full bg-white/10 mb-6">
          <Icons.Loading />
        </div>
        <h2 className="text-2xl font-black leading-tight">Criando Documento Perito...</h2>
        <p className="mt-2 text-white/50 text-sm">
          Aguarde alguns segundos enquanto a IA organiza as informações técnicas.
        </p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
