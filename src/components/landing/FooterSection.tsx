import React from 'react';
import { FileText, Shield, Lock } from 'lucide-react';

const FooterSection: React.FC = () => {
  return (
    <footer className="border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">Meu Consultório</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-primary" />
              Conforme CFP 06/2019
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-primary" />
              Em conformidade com a LGPD
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          © 2025 Meu Consultório. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
};

export default FooterSection;
