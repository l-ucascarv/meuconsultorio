
# Fase 1 — Pagamentos Mercado Pago, Webhook, Criação Automática de Usuários e Onboarding

Escopo desta fase: Tarefas 3 a 7 do briefing. Não inclui refactor visual premium (T2), arquitetura mobile (T9) nem IA de relatórios (T10) — esses ficam para fases seguintes.

## 1. Auditoria do estado atual (resumo)

- **Pagamentos hoje:** fluxo via Stripe (memória do projeto: `subscription-management`). Inclui edge function de checkout e geração de senha temporária. Será **substituído** por Mercado Pago.
- **Profiles:** `profiles.subscription_status` (`active|trial|pending|inactive|cancelled`) e `subscription_plan` controlam acesso. RLS já usa `has_active_subscription()` em quase todas as tabelas — bom, será reaproveitado.
- **Auth:** Supabase Auth com `must_change_password` flag, gate em `App.tsx > ProtectedRoute` com `ProfileOnboarding` cobrindo CRP + LGPD + senha. Vamos manter e reforçar.
- **Riscos identificados:**
  - Não existe tabela de `subscriptions` separada — todo histórico vive no profile (não auditável).
  - Sem `payment_logs` nem `webhook_logs` — impossível reconciliar pagamentos.
  - Edge functions atuais (Stripe) precisam ser removidas após migração.
  - `subscription_status` é string livre no profile, sem expiração (`current_period_end`) → usuário inadimplente nunca é bloqueado automaticamente.

## 2. Mudanças no banco (migration única)

Novas tabelas (com RLS):

- **`subscription_plans`** já existe — vamos adicionar coluna `mercadopago_plan_id` (preapproval plan id) para mensal e anual.
- **`subscriptions`** (nova): `id, user_id, plan_id, status (trial|active|past_due|cancelled|expired), mp_preapproval_id, mp_payer_id, current_period_start, current_period_end, cancel_at, trial_ends_at, created_at, updated_at`. RLS: usuário lê a própria; admin lê todas; só service role escreve.
- **`payment_logs`** (nova): `id, subscription_id, user_id, mp_payment_id (unique), status, amount, currency, paid_at, raw jsonb, created_at`. Só service role escreve; usuário lê os próprios.
- **`webhook_logs`** (nova): `id, provider ('mercadopago'), event_type, mp_resource_id, signature_valid bool, processed bool, error text, payload jsonb, received_at`. Só admin/service role.
- **Função `has_active_subscription` atualizada** para considerar `subscriptions.status IN ('trial','active') AND current_period_end > now()` em vez de só ler o profile. Mantém assinatura do mesmo nome para não quebrar policies existentes.
- **Trigger** em `subscriptions` que sincroniza `profiles.subscription_status` e `subscription_plan` para retro-compatibilidade com o app atual.

## 3. Edge Functions (Mercado Pago)

Três funções novas, todas com `verify_jwt = false` configurado quando público:

- **`mp-create-checkout`** (autenticada via JWT do usuário OU pública para checkout pré-cadastro)
  - Input: `{ planId: 'mensal' | 'anual', email, name }`
  - Cria preapproval (assinatura recorrente) na API do Mercado Pago.
  - Retorna `init_point` (URL de checkout).
  - Registra intent em `subscriptions` com status `pending`.

- **`mp-webhook`** (pública, sem JWT)
  - Valida assinatura `x-signature` + `x-request-id` conforme spec MP (HMAC SHA256 com `MP_WEBHOOK_SECRET`).
  - Idempotência via `webhook_logs.mp_resource_id` UNIQUE.
  - Eventos tratados: `payment.created`, `payment.updated`, `preapproval.updated`, `subscription_authorized_payment`.
  - Para pagamento aprovado:
    1. Busca/cria usuário em `auth.users` (via service role) se não existir.
    2. Gera senha temporária (crypto random 16 chars).
    3. Cria `profile` + role `subscriber` + `subscription` ativa.
    4. Dispara email de onboarding com credenciais via Resend (a ser conectado).
    5. Marca `must_change_password = true`.
  - Para pagamento recusado/cancelado/expirado: atualiza `subscriptions.status` e o trigger reflete no profile.
  - Sempre grava em `payment_logs` e `webhook_logs`.

- **`mp-cancel-subscription`** (autenticada)
  - Cancela preapproval na API MP, atualiza `subscriptions.cancel_at`.

**Secrets necessários:** `MP_ACCESS_TOKEN` (produção), `MP_ACCESS_TOKEN_SANDBOX`, `MP_WEBHOOK_SECRET`, `RESEND_API_KEY` (para email de onboarding). Vou pedir via `add_secret` na hora.

## 4. Frontend

- **`/checkout`** (nova): seleção mensal/anual → form com nome+email → chama `mp-create-checkout` → redireciona para `init_point` do MP.
- **`/checkout/sucesso`** e **`/checkout/pendente`** (novas): páginas de retorno do MP com instruções ("verifique seu email").
- **`/assinatura`** (nova, autenticada): mostra plano atual, próximo vencimento, histórico de pagamentos (lê `payment_logs`), botão cancelar.
- **`/assinatura-expirada`** (nova): tela mostrada pelo `ProtectedRoute` quando `subscription_status NOT IN ('active','trial')`. Já existe inline no `App.tsx` — vou extrair para página dedicada com CTA para reativar via MP.
- **`PricingSection`** existente da landing: trocar CTA para apontar para `/checkout?plan=...` em vez do fluxo Stripe.
- **`ProfileOnboarding`** existente: já cobre primeiro login + troca de senha + CRP + LGPD. Mantém-se. Vou apenas garantir que o trigger `must_change_password=true` do webhook acione esse fluxo corretamente.

## 5. Segurança (T6)

- Manter RLS em todas as tabelas novas, com `has_role('admin')` para visão administrativa.
- Webhook valida assinatura HMAC + idempotência (rejeita replay).
- Service role key **nunca** sai da edge function.
- Sessão já expira em 1h (já implementado no `useAuth`). Vou validar.
- Inputs validados com Zod tanto no frontend quanto nas edge functions.
- `subscription_status` deixa de ser editável pelo usuário — RLS no `profiles` proíbe UPDATE dessa coluna (via trigger BEFORE UPDATE).

## 6. Onboarding (T7)

Fluxo final do usuário:

```text
Landing → /checkout → MP → webhook cria conta + envia email →
Usuário recebe email com senha temp → /auth (login) →
ProfileOnboarding (troca senha + CRP + especialidade + LGPD) →
/app (dashboard liberado)
```

`ProfileOnboarding` já cobre as 3 últimas etapas; só preciso garantir que o email de boas-vindas use a URL correta (`window.location.origin/auth`) e que o gate funcione com o novo modelo de `subscriptions`.

## 7. Ordem de execução

1. Migration: novas tabelas + atualização de `has_active_subscription` + trigger sync profile.
2. Pedir secrets MP + Resend.
3. Implementar `mp-webhook` (a parte mais crítica) com testes de idempotência.
4. Implementar `mp-create-checkout` e `mp-cancel-subscription`.
5. Páginas de checkout/sucesso/pendente/assinatura/assinatura-expirada.
6. Atualizar `PricingSection` da landing.
7. Remover edge functions Stripe antigas (após validar MP funcionando).
8. Atualizar memória do projeto (`subscription-management` passa a ser MP).

## 8. Detalhes técnicos relevantes

- **API MP usada:** Preapproval (assinaturas recorrentes) — `POST /preapproval` para criar, webhooks via `topic=preapproval` e `topic=payment`.
- **Validação de webhook MP:** header `x-signature` formato `ts=...,v1=hash`. Hash = HMAC-SHA256(`id:<resource_id>;request-id:<req_id>;ts:<ts>;`, secret).
- **Idempotência:** UNIQUE em `payment_logs.mp_payment_id` e em `webhook_logs(provider, mp_resource_id, event_type)`.
- **Email transacional:** usar Resend via connector (instrução já está no contexto). Template simples HTML inline com nome, email de login, senha temporária e link `/auth`.
- **Compat:** edge function `generate-document` e demais não são tocadas. Toda RLS existente continua funcionando porque `has_active_subscription(uuid)` mantém a mesma assinatura.

## 9. Fora desta fase (para próximas rodadas)

- T1 auditoria detalhada escrita (entrego só os pontos críticos acima).
- T2 refactor visual premium (Linear/Stripe-style).
- T8 refactor de páginas existentes além das diretamente afetadas.
- T9 separação de camadas para mobile/Expo.
- T10 IA para relatórios.

## 10. Próximos passos após aprovação

1. Crio a migration e peço sua aprovação.
2. Em seguida peço os secrets `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` e conexão com Resend.
3. Implemento as 3 edge functions + páginas frontend.
4. Configuro o webhook no painel do Mercado Pago apontando para a URL da função (eu te passo a URL).
5. Teste end-to-end em sandbox antes de virar produção.
