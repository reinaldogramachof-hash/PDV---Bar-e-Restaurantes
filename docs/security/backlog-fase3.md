# Backlog de Segurança — Fase 3 SaaS

**Status:** 🔴 Pendente — endereçar na transição para backend centralizado

---

## R-01 — localStorage em Texto Plano

**Severidade:** Médio  
**Contexto:** Dados de colaboradores (observações, salários) e vendas gravados como JSON puro no navegador. Em máquinas compartilhadas, scripts XSS ou acesso físico expõem os dados.

**Mitigação planejada:**
- Criptografar chaves de storage contendo dados sensíveis com **Web Cryptography API** nativa
- Chave simétrica gerada e mantida exclusivamente na memória da sessão ativa (nunca persistida)
- Implementar em: `buildScopedStorageKey` + wrapper `encryptedStorage`

**Pré-requisito:** Fase 3 (usuário autenticado via API fornece chave de derivação)

---

## R-02 — Estado React Manipulável no Cliente

**Severidade:** Baixo (mitigado pelo Local-First)  
**Contexto:** `currentUser.role` pode ser alterado via DevTools do navegador, forçando visibilidade de módulos restritos na sidebar.

**Mitigação planejada:**
- Fase 3: autorização reside **exclusivamente no servidor**
- Tokens JWT em cookies `HttpOnly + Secure + SameSite=Strict`
- API REST valida autorização antes de entregar dados de auditoria
- Frontend passa a ser apenas apresentação — dados sensíveis nunca chegam sem validação server-side

**Pré-requisito:** Fase 3 (backend + autenticação JWT)

---

## R-03 — Audit Trail Apagável pelo Operador

**Severidade:** Médio  
**Contexto:** Usuário com acesso admin pode limpar localStorage e eliminar rastros de fraudes ou operações indevidas.

**Mitigação planejada:**
- Fase 3: `auditService.ts` migra de Local-First para **streaming assíncrono em lote**
- Eventos enviados em background para tabela dedicada no banco de dados (ex: PostgreSQL)
- Audit trail torna-se **imutável** pelo operador local
- Implementar com: fila local de eventos + sync periódico + retry em falha de rede

**Pré-requisito:** Fase 3 (backend + tabela `audit_logs` no banco)

---

## Resumo de Dependências

| Risco | Depende de | Quando |
|-------|-----------|--------|
| R-01 | Autenticação API (chave de derivação) | Fase 3 Sprint 1 |
| R-02 | Backend JWT + API endpoints com auth | Fase 3 Sprint 1 |
| R-03 | Backend + tabela audit_logs + queue | Fase 3 Sprint 2 |
