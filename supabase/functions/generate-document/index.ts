import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentRequest {
  type: 'relatorio' | 'atestado' | 'laudo' | 'parecer' | 'declaracao';
  patientName: string;
  solicitor: string;
  purpose: string;
  demandDescription: string;
  procedures: string;
  analysis: string;
  conclusion: string;
  specificQuestion?: string;
  periodStart?: string;
  periodEnd?: string;
  psychologistName: string;
  psychologistCrp: string;
  psychologistSpecialty: string;
}

const DOC_LABELS: Record<string, string> = {
  relatorio: 'Relatório Psicológico',
  atestado: 'Atestado Psicológico',
  laudo: 'Laudo Psicológico',
  parecer: 'Parecer Psicológico',
  declaracao: 'Declaração Psicológica',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: DocumentRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating document for:", data.patientName, "Type:", data.type);

    const docLabel = DOC_LABELS[data.type] || 'Documento Psicológico';
    
    const systemPrompt = `Você é um assistente especializado em documentos psicológicos conforme a Resolução CFP nº 06/2019 do Conselho Federal de Psicologia do Brasil.

Sua função é gerar documentos psicológicos técnicos, éticos e em conformidade com as normas do CFP.

Regras importantes:
1. Use linguagem técnica e profissional
2. Mantenha impessoalidade e objetividade
3. Não faça diagnósticos definitivos sem avaliação presencial
4. Respeite o sigilo profissional
5. Siga a estrutura padrão de cada tipo de documento
6. Use termos como "indica-se", "sugere-se", "observa-se" ao invés de afirmações categóricas
7. Sempre mencione que as conclusões são baseadas nas informações fornecidas

Estrutura do ${docLabel}:
- IDENTIFICAÇÃO: Dados do paciente, solicitante e finalidade
- DEMANDA: Descrição clara do motivo da avaliação
- PROCEDIMENTOS: Métodos e instrumentos utilizados
- ANÁLISE: Interpretação técnica dos dados coletados
- CONCLUSÃO: Parecer final fundamentado`;

    const userPrompt = `Gere um ${docLabel} completo com as seguintes informações:

DADOS DO PACIENTE:
- Nome: ${data.patientName}
- Solicitante: ${data.solicitor}
- Finalidade: ${data.purpose}

INFORMAÇÕES DO CASO:
- Demanda: ${data.demandDescription || 'Não especificada'}
- Procedimentos realizados: ${data.procedures || 'Não especificados'}
- Análise clínica: ${data.analysis || 'Não especificada'}
- Conclusão prévia: ${data.conclusion || 'A ser elaborada'}
${data.specificQuestion ? `- Questão específica (parecer): ${data.specificQuestion}` : ''}
${data.periodStart && data.periodEnd ? `- Período: ${data.periodStart} a ${data.periodEnd}` : ''}

PROFISSIONAL RESPONSÁVEL:
- Nome: ${data.psychologistName}
- CRP: ${data.psychologistCrp}
- Especialidade: ${data.psychologistSpecialty}

Por favor, gere um documento completo e profissional seguindo a Resolução CFP 06/2019. Retorne o documento em formato JSON com as seguintes seções:
{
  "title": "Título do documento",
  "identification": "Seção de identificação completa",
  "demand": "Descrição da demanda",
  "procedure": "Procedimentos realizados",
  "analysis": "Análise técnica detalhada",
  "conclusion": "Conclusão fundamentada"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione mais créditos à sua conta." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("AI Response received, parsing...");

    // Try to parse as JSON, handling markdown code blocks
    let generatedDoc;
    try {
      // Remove markdown code blocks if present
      let jsonContent = content;
      if (content.includes('```json')) {
        jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (content.includes('```')) {
        jsonContent = content.replace(/```\n?/g, '');
      }
      generatedDoc = JSON.parse(jsonContent.trim());
    } catch (parseError) {
      console.log("Failed to parse as JSON, creating structured response from text");
      // If JSON parsing fails, create a structured response from text
      generatedDoc = {
        title: `${docLabel.toUpperCase()}`,
        identification: `Paciente: ${data.patientName}\nSolicitante: ${data.solicitor}\nFinalidade: ${data.purpose}\n\nProfissional Responsável: ${data.psychologistName}\nCRP: ${data.psychologistCrp}\nEspecialidade: ${data.psychologistSpecialty}`,
        demand: content.includes("DEMANDA") ? content.split("DEMANDA")[1]?.split(/[A-Z]{4,}/)[0]?.trim() : data.demandDescription,
        procedure: content.includes("PROCEDIMENTO") ? content.split("PROCEDIMENTO")[1]?.split(/[A-Z]{4,}/)[0]?.trim() : data.procedures,
        analysis: content.includes("ANÁLISE") ? content.split("ANÁLISE")[1]?.split(/[A-Z]{4,}/)[0]?.trim() : data.analysis,
        conclusion: content.includes("CONCLUSÃO") ? content.split("CONCLUSÃO")[1]?.trim() : content,
      };
    }

    console.log("Document generated successfully");

    return new Response(JSON.stringify(generatedDoc), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating document:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erro ao gerar documento" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
