import React from 'react';

const docs = [
  { name: 'Relatório', desc: 'Análise detalhada' },
  { name: 'Laudo', desc: 'Avaliação técnica' },
  { name: 'Parecer', desc: 'Opinião especializada' },
  { name: 'Atestado', desc: 'Certificação' },
  { name: 'Declaração', desc: 'Afirmação formal' },
];

const DocumentTypesSection: React.FC = () => {
  return (
    <section className="container mx-auto px-4 py-20">
      <h2 className="text-3xl md:text-4xl font-black text-center text-foreground mb-12">
        Tipos de Documentos
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {docs.map((doc) => (
          <div key={doc.name} className="bg-muted rounded-2xl p-6 text-center hover:bg-primary/10 transition-all cursor-default">
            <p className="font-bold text-foreground">{doc.name}</p>
            <p className="text-sm text-muted-foreground">{doc.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default DocumentTypesSection;
