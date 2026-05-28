# Focus NF-e — Cadastro e Configuração

**Executar antes do go-live do módulo fiscal.**  
Tempo estimado: 15 minutos.

---

## Passo 1 — Criar conta gratuita

1. Acesse [focusnfe.com.br](https://focusnfe.com.br)
2. Clique em **"Teste grátis por 30 dias"**
3. Preencha os dados da **Plena Informática**:
   - CNPJ: `59.779.242/0001-78`
   - E-mail: `tecnologia@plenainformatica.com.br`
   - Telefone: `(12) 99219-1018`
4. Confirme o e-mail de ativação

---

## Passo 2 — Cadastrar empresa emitente (seu cliente de teste)

1. Acesse o painel em [app.focusnfe.com.br](https://app.focusnfe.com.br)
2. Vá em **Empresas → Nova Empresa**
3. Preencha:
   - CNPJ do restaurante de teste
   - Regime tributário: **Simples Nacional**
   - UF e município do estabelecimento
4. Faça upload do **certificado digital A1** (.pfx ou .p12) da empresa
5. Informe a senha do certificado

---

## Passo 3 — Obter tokens de homologação

1. No painel, acesse **Empresas → [nome da empresa] → Tokens**
2. Copie o **Token de Homologação** (usado para testes)
3. Copie também o **Token de Produção** (guardar para o go-live)
4. Anote o **CSC ID** e **CSC Token** — obrigatórios para o QR Code da NFC-e
   - Esses dados são fornecidos pela SEFAZ do estado do emitente
   - Para SP: acesse [nfce.fazenda.sp.gov.br](https://nfce.fazenda.sp.gov.br) e cadastre o CSC

---

## Passo 4 — Configurar no Plena Gastro Manager

1. Acesse **Configurações → Emissor Fiscal**
2. Preencha:
   - **CNPJ Emitente:** CNPJ do restaurante
   - **Token Homologação:** token copiado no Passo 3
   - **Token Produção:** token copiado no Passo 3
   - **CSC ID** e **CSC Token**
   - **Ambiente:** Homologação (para testes)
3. Clique em **"Testar Conexão"** — deve emitir uma NFC-e de teste
4. Se bem-sucedido: toggle **"Habilitar Emissão NFC-e"** → ativo

---

## Passo 5 — Go-live (somente quando pronto para produção)

1. Acesse [focusnfe.com.br/planos](https://focusnfe.com.br/planos)
2. Contrate o **Plano Retail — R$59,90/mês**:
   - 500 NFC-e + 100 NF-e incluídas
   - NFC-e adicional: R$0,05
3. No Plena Gastro Manager → Configurações → Emissor Fiscal:
   - Troque **Ambiente** de "Homologação" para **"Produção"**
   - Salvar

---

## Referências

| Recurso | URL |
|---------|-----|
| Painel Focus NF-e | https://app.focusnfe.com.br |
| Documentação API | https://focusnfe.com.br/docs |
| API Homologação | https://homologacao.focusnfe.com.br/v2 |
| API Produção | https://api.focusnfe.com.br/v2 |
| Suporte Focus | suporte@focusnfe.com.br |

---

## Modelo de cobrança sugerido (add-on Emissor Fiscal)

| Item | Custo | Sugestão de repasse |
|------|-------|-------------------|
| Plano Retail Focus NF-e | R$59,90/mês | — |
| Add-on "Emissor Fiscal" cobrado do cliente | — | R$79,00/mês |
| **Margem por cliente** | | **R$19,10/mês** |

> A partir do 4º cliente com o add-on ativo, o custo do plano está coberto.

---

*Documento interno — Plena Informática*  
*Atualizado em: 28/05/2026*
