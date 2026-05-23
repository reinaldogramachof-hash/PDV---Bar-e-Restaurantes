# Skill: Fluxo de Onboarding (Signup + Primeiro Setup)

**Quando usar:** Implementar cadastro de nova empresa e primeiro acesso  
**Tempo:** 4–6h  
**Dependências:** rules/security.md, skills/license-plan.md

---

## Conceito Central

```
Novo cliente acessa → Signup (dados da empresa)
      ↓
Sistema cria empresaId único + licença trial
      ↓
Wizard de primeiro setup (nome, logo, categorias, usuário admin)
      ↓
Redirect para Dashboard com estado inicial vazio
      ↓
LicenseBanner mostra dias restantes do trial
```

---

## 1. Estrutura da Empresa

```typescript
// src/domain/saas.ts — adicionar
export interface Empresa {
  id: string;                  // UUID gerado no cadastro
  nomeFantasia: string;
  cnpj?: string;
  email: string;
  telefone?: string;
  plano: PlanoTipo;
  createdAt: string;
  setupCompleto: boolean;      // false até wizard finalizar
}
```

---

## 2. Onboarding Service

```typescript
// src/services/onboardingService.ts
import { buildScopedStorageKey, Empresa, PlanoTipo } from '../domain/saas';
import { licenseService } from './licenseService';
import { auditService } from './auditService';

const TRIAL_DIAS = 30;
const EMPRESAS_KEY = 'gestao-gastro:plena:empresas';

export const onboardingService = {
  criarEmpresa: (dados: {
    nomeFantasia: string;
    email: string;
    plano?: PlanoTipo;
  }): Empresa => {
    const empresa: Empresa = {
      id: crypto.randomUUID(),
      nomeFantasia: dados.nomeFantasia,
      email: dados.email,
      plano: dados.plano ?? 'essencial',
      createdAt: new Date().toISOString(),
      setupCompleto: false,
    };

    // Registrar empresa na lista global
    const existentes: Empresa[] = JSON.parse(
      localStorage.getItem(EMPRESAS_KEY) || '[]'
    );
    localStorage.setItem(
      EMPRESAS_KEY,
      JSON.stringify([...existentes, empresa])
    );

    // Criar licença trial
    const dataExpiracao = new Date();
    dataExpiracao.setDate(dataExpiracao.getDate() + TRIAL_DIAS);

    const key = buildScopedStorageKey('licenca', empresa.id);
    localStorage.setItem(key, JSON.stringify({
      empresaId: empresa.id,
      plano: empresa.plano,
      dataExpiracao: dataExpiracao.toISOString(),
      ativa: true,
    }));

    auditService.log(
      'usuario_criado',
      `Empresa "${empresa.nomeFantasia}" cadastrada com plano ${empresa.plano}`,
      empresa.id,
      'system',
      'Sistema',
      { plano: empresa.plano, trial: TRIAL_DIAS }
    );

    return empresa;
  },

  concluirSetup: (empresaId: string): void => {
    const key = buildScopedStorageKey('empresa_config', empresaId);
    const config = JSON.parse(localStorage.getItem(key) || '{}');
    localStorage.setItem(key, JSON.stringify({ ...config, setupCompleto: true }));
  },

  setupCompleto: (empresaId: string): boolean => {
    const key = buildScopedStorageKey('empresa_config', empresaId);
    const config = JSON.parse(localStorage.getItem(key) || '{}');
    return config.setupCompleto === true;
  },
};
```

---

## 3. Wizard de Setup — Estrutura de Steps

```typescript
// Passos do wizard (ordem obrigatória)
type SetupStep =
  | 'dados_empresa'     // Nome fantasia, telefone, logo
  | 'categorias'        // Categorias do cardápio padrão
  | 'usuario_admin'     // Nome e senha do admin local
  | 'concluido';        // Redirect para dashboard

interface SetupWizardState {
  currentStep: SetupStep;
  empresaId: string;
  completed: SetupStep[];
}

// Componente principal
export const SetupWizard: React.FC<{ empresaId: string }> = ({ empresaId }) => {
  const [step, setStep] = useState<SetupStep>('dados_empresa');

  const handleNext = (nextStep: SetupStep) => {
    if (nextStep === 'concluido') {
      onboardingService.concluirSetup(empresaId);
      // redirect para dashboard
    }
    setStep(nextStep);
  };

  return (
    <div>
      {step === 'dados_empresa' && (
        <DadosEmpresaStep onNext={() => handleNext('categorias')} />
      )}
      {step === 'categorias' && (
        <CategoriasStep onNext={() => handleNext('usuario_admin')} />
      )}
      {step === 'usuario_admin' && (
        <UsuarioAdminStep onNext={() => handleNext('concluido')} />
      )}
    </div>
  );
};
```

---

## 4. Guard de Setup no App.tsx

```typescript
// Redirecionar para wizard se setup não concluído
const AppRouter: React.FC<{ empresaId: string }> = ({ empresaId }) => {
  const setupOk = onboardingService.setupCompleto(empresaId);

  if (!setupOk) {
    return <SetupWizard empresaId={empresaId} />;
  }

  return <MainApp empresaId={empresaId} />;
};
```

---

## Checklist de Validação

- [ ] `empresaId` gerado como UUID único (nunca hardcoded)
- [ ] Licença trial criada automaticamente no signup
- [ ] Wizard bloqueia acesso ao app até `setupCompleto = true`
- [ ] Auditoria registra criação da empresa
- [ ] Dados da empresa isolados via `buildScopedStorageKey`
- [ ] Testes cobrem: empresa criada, trial ativo, setup incompleto redireciona, setup completo libera
