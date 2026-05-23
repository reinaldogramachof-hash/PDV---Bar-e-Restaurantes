# Skill: Sistema de Planos e Licenças

**Quando usar:** Implementar validação de plano, limites de acesso, expiração de licença  
**Tempo:** 3–6h  
**Dependências:** rules/security.md, src/domain/saas.ts

---

## Conceito Central

```
Empresa tem um Plano (Essencial | Profissional | Gestão)
      ↓
Plano define limites (usuários, módulos, relatórios)
      ↓
Licença define validade (data de expiração + status)
      ↓
App verifica licença no boot → bloqueia ou libera acesso
```

---

## 1. Tipos de Plano e Limites

```typescript
// src/domain/saas.ts — adicionar
export type PlanoTipo = 'essencial' | 'profissional' | 'gestao';

export interface PlanoConfig {
  tipo: PlanoTipo;
  maxUsuarios: number;
  modulosAtivos: string[];  // 'pdv' | 'estoque' | 'relatorios' | 'cozinha' | 'master'
  relatoriosAvancados: boolean;
  suportePrioritario: boolean;
}

export const PLANOS: Record<PlanoTipo, PlanoConfig> = {
  essencial: {
    tipo: 'essencial',
    maxUsuarios: 3,
    modulosAtivos: ['pdv', 'cozinha'],
    relatoriosAvancados: false,
    suportePrioritario: false,
  },
  profissional: {
    tipo: 'profissional',
    maxUsuarios: 10,
    modulosAtivos: ['pdv', 'cozinha', 'estoque', 'relatorios'],
    relatoriosAvancados: true,
    suportePrioritario: false,
  },
  gestao: {
    tipo: 'gestao',
    maxUsuarios: 999,
    modulosAtivos: ['pdv', 'cozinha', 'estoque', 'relatorios', 'master'],
    relatoriosAvancados: true,
    suportePrioritario: true,
  },
};
```

---

## 2. License Service

```typescript
// src/services/licenseService.ts
import { buildScopedStorageKey, PlanoTipo, PLANOS } from '../domain/saas';

export interface Licenca {
  empresaId: string;
  plano: PlanoTipo;
  dataExpiracao: string; // ISO 8601
  ativa: boolean;
}

const COLLECTION = 'licenca';

export const licenseService = {
  get: (empresaId: string): Licenca | null => {
    const key = buildScopedStorageKey(COLLECTION, empresaId);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  },

  isValida: (empresaId: string): boolean => {
    const licenca = licenseService.get(empresaId);
    if (!licenca || !licenca.ativa) return false;
    return new Date(licenca.dataExpiracao) > new Date();
  },

  getDiasRestantes: (empresaId: string): number => {
    const licenca = licenseService.get(empresaId);
    if (!licenca) return 0;
    const diff = new Date(licenca.dataExpiracao).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  },

  getPlano: (empresaId: string): PlanoTipo => {
    return licenseService.get(empresaId)?.plano ?? 'essencial';
  },

  moduloAtivo: (modulo: string, empresaId: string): boolean => {
    const plano = licenseService.getPlano(empresaId);
    return PLANOS[plano].modulosAtivos.includes(modulo);
  },
};
```

---

## 3. Boot Flow — verificação no App.tsx

```typescript
// src/App.tsx — verificar antes de renderizar qualquer módulo
const LicenseGate: React.FC<{ empresaId: string; children: React.ReactNode }> = ({
  empresaId,
  children,
}) => {
  const isValida = licenseService.isValida(empresaId);
  const diasRestantes = licenseService.getDiasRestantes(empresaId);

  if (!isValida) {
    return <LicenseLock empresaId={empresaId} />;
  }

  return (
    <>
      {diasRestantes <= 30 && <LicenseBanner diasRestantes={diasRestantes} />}
      {children}
    </>
  );
};
```

---

## 4. LicenseBanner — aviso de expiração

```typescript
interface LicenseBannerProps {
  diasRestantes: number;
  onDismiss?: () => void;
}

export const LicenseBanner: React.FC<LicenseBannerProps> = ({
  diasRestantes,
  onDismiss,
}) => {
  // Não renderiza se > 30 dias
  if (diasRestantes > 30) return null;

  const isUrgente = diasRestantes <= 7;

  return (
    <div
      role="alert"
      className={`px-5 py-3 flex items-center justify-between text-sm ${
        isUrgente
          ? 'bg-[var(--color-danger)] text-white'
          : 'bg-[var(--color-warning)] text-black'
      }`}
    >
      <span>
        {isUrgente
          ? `Licença expira em ${diasRestantes} dia(s). Renove agora.`
          : `Sua licença expira em ${diasRestantes} dias.`}
      </span>
      {onDismiss && (
        <button aria-label="fechar" onClick={onDismiss} className="ml-4 opacity-70 hover:opacity-100">
          ✕
        </button>
      )}
    </div>
  );
};
```

---

## Checklist de Validação

- [ ] `licenseService.isValida()` chamado no boot (LicenseGate em App.tsx)
- [ ] `moduloAtivo()` usado antes de renderizar módulos restritos
- [ ] LicenseBanner aparece quando `diasRestantes <= 30`
- [ ] LicenseLock bloqueia completamente quando licença inválida
- [ ] Licença isolada por empresa via `buildScopedStorageKey`
- [ ] Testes cobrem: válida, expirada, 7 dias, 30 dias, módulo bloqueado
