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
    
    const typeStructures: Record<string, { structure: string; jsonFormat: string }> = {
      relatorio: {
        structure: `RELATÓRIO PSICOLÓGICO (Resolução CFP 06/2019, Art. 11-14):
Documento resultante do processo de avaliação psicológica, com finalidade de apresentar os procedimentos e conclusões gerados pelo processo de avaliação psicológica.
Estrutura obrigatória:
1. IDENTIFICAÇÃO: Autor/relator, interessado, demandante/solicitante
2. DESCRIÇÃO DA DEMANDA: Informações referentes à problemática apresentada e dos motivos, razões e expectativas
3. PROCEDIMENTO: Recursos e instrumentos técnicos utilizados (número de encontros, pessoas ouvidas, testes aplicados com registro no SATEPSI quando aplicável)
4. ANÁLISE: Exposição descritiva fundamentada teoricamente, correlacionando os dados obtidos. Deve ser precisa, clara e fundamentada
5. CONCLUSÃO: Síntese dos resultados, encaminhamentos e indicações, respondendo à demanda. Quando não houver dados suficientes, indicar a impossibilidade de conclusão`,
        jsonFormat: `{
  "title": "RELATÓRIO PSICOLÓGICO",
  "identification": "Seção de identificação com autor, interessado e demandante",
  "demand": "Descrição da demanda e problemática",
  "procedure": "Procedimentos e instrumentos utilizados",
  "analysis": "Análise técnica fundamentada teoricamente",
  "conclusion": "Conclusão com síntese e encaminhamentos"
}`
      },
      atestado: {
        structure: `ATESTADO PSICOLÓGICO (Resolução CFP 06/2019, Art. 15-17):
Documento que certifica uma determinada situação ou estado psicológico para afirmar sobre as condições psicológicas.
Estrutura obrigatória:
1. IDENTIFICAÇÃO: Nome completo do cliente/paciente
2. FINALIDADE: Para que fim está sendo emitido o atestado
3. REGISTRO DAS INFORMAÇÕES: Descrição sintética sobre o estado psicológico, condição ou situação do atendido, SEM diagnóstico completo
4. CONCLUSÃO: Afirmação objetiva sobre a condição atestada
5. VALIDADE/PRAZO: Período de validade do atestado quando aplicável
IMPORTANTE: O atestado NÃO deve conter diagnóstico psicológico completo, apenas informar sobre condições ou estados.`,
        jsonFormat: `{
  "title": "ATESTADO PSICOLÓGICO",
  "identification": "Identificação do cliente/paciente",
  "purpose": "Finalidade do atestado",
  "psychologicalState": "Registro sintético do estado psicológico",
  "conclusion": "Afirmação objetiva sobre a condição",
  "validity": "Prazo de validade quando aplicável"
}`
      },
      laudo: {
        structure: `LAUDO PSICOLÓGICO (Resolução CFP 06/2019, Art. 11-14):
Resultado de procedimento de avaliação psicológica com caráter pericial, com maior rigor técnico e metodológico.
Estrutura obrigatória:
1. IDENTIFICAÇÃO: Autor/relator (perito), interessado (periciando), demandante/solicitante
2. DESCRIÇÃO DA DEMANDA: Motivo da avaliação pericial e quesitos a serem respondidos quando houver
3. PROCEDIMENTO: Descrição detalhada de recursos e instrumentos utilizados (testes com registro SATEPSI, entrevistas, observações), número de sessões e datas
4. ANÁLISE: Exposição fundamentada teoricamente com rigor técnico, correlacionando todos os dados obtidos nos procedimentos. Referenciar teorias e autores
5. CONCLUSÃO: Resposta objetiva aos quesitos (quando houver), parecer técnico fundamentado, prognóstico quando pertinente`,
        jsonFormat: `{
  "title": "LAUDO PSICOLÓGICO",
  "identification": "Identificação completa do perito, periciando e solicitante",
  "demand": "Demanda pericial e quesitos",
  "procedure": "Procedimentos detalhados com datas e instrumentos",
  "analysis": "Análise técnica com fundamentação teórica rigorosa",
  "conclusion": "Conclusão respondendo aos quesitos com parecer fundamentado"
}`
      },
      parecer: {
        structure: `PARECER PSICOLÓGICO (Resolução CFP 06/2019, Art. 18-20):
Documento fundamentado e resumido sobre uma questão focal do campo psicológico, resultado de solicitação de consulta.
Estrutura obrigatória:
1. IDENTIFICAÇÃO: Parecerista, interessado, solicitante
2. EXPOSIÇÃO DE MOTIVOS: Apresentação da questão focal que motivou o parecer e o contexto
3. ANÁLISE: Discussão fundamentada e resumida do tema/questão. Deve ser uma análise minuciosa, objetiva, indicando os procedimentos adotados. Fundamentar em referencial teórico-científico
4. CONCLUSÃO: Resposta DIRETA e OBJETIVA à questão formulada, apresentando o posicionamento técnico do psicólogo
IMPORTANTE: O parecer responde a uma QUESTÃO ESPECÍFICA. A conclusão deve ser uma resposta clara a essa questão.`,
        jsonFormat: `{
  "title": "PARECER PSICOLÓGICO",
  "identification": "Identificação do parecerista, interessado e solicitante",
  "question": "Questão focal do parecer",
  "reasoning": "Exposição de motivos e contexto",
  "analysis": "Análise fundamentada e resumida",
  "conclusion": "Resposta objetiva à questão formulada"
}`
      },
      declaracao: {
        structure: `DECLARAÇÃO PSICOLÓGICA (Resolução CFP 06/2019, Art. 21-22):
Documento que visa informar a ocorrência de fatos ou situações objetivas relacionados ao atendimento psicológico.
Estrutura obrigatória:
1. IDENTIFICAÇÃO: Declarante (psicólogo) e pessoa atendida
2. INFORMAÇÕES DECLARADAS: Registro APENAS de informações objetivas como:
   - Comparecimento do atendido
   - Horários de atendimento
   - Número de sessões realizadas
   - Período de acompanhamento
3. CONCLUSÃO: Encerramento formal
PROIBIÇÕES EXPRESSAS: A declaração NÃO PODE conter:
- Diagnósticos
- Prognósticos
- Análises clínicas
- Opiniões técnicas sobre o estado psicológico
- Qualquer informação além de dados objetivos de comparecimento e atendimento`,
        jsonFormat: `{
  "title": "DECLARAÇÃO",
  "identification": "Identificação do declarante e pessoa atendida",
  "declaredInfo": "Informações objetivas declaradas (comparecimento, horários, sessões, período)",
  "conclusion": "Encerramento formal da declaração"
}`
      }
    };

    const typeConfig = typeStructures[data.type] || typeStructures.relatorio;

    const systemPrompt = `Você é um assistente especializado em documentos psicológicos conforme a Resolução CFP nº 06/2019 do Conselho Federal de Psicologia do Brasil.

Regras importantes:
1. Use linguagem técnica e profissional
2. Mantenha impessoalidade e objetividade
3. Não faça diagnósticos definitivos sem avaliação presencial
4. Respeite o sigilo profissional
5. Siga RIGOROSAMENTE a estrutura específica do tipo de documento
6. Use termos como "indica-se", "sugere-se", "observa-se"
7. Conclusões são baseadas nas informações fornecidas

${typeConfig.structure}`;

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

Retorne o documento em formato JSON com EXATAMENTE esta estrutura:
${typeConfig.jsonFormat}`;

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
