# Skill: Painel Master (Agregação Cross-Empresa)

**Quando usar:** Implementar views ou serviços que agregam dados de múltiplas empresas  
**Tempo:** 4–8h  
**Dependências:** rules/security.md, rules/multiempresa.md

---

## Conceito Central

O Painel Master é acessado apenas por super-admins da Plena.  
Ele agrega métricas de todas as empresas sem nunca expor dados cruzados entre elas.

```
Super-Admin Plena
      ↓
MasterDashboard (view agregada)
      ↓
masterMetricsService.getAll() → [{ empresaId, metrics }]
      ↓
Para cada empresa: lê storage isolado → agrega
```

---

## 1. Validação de Acesso Super-Admin

```typescript
// src/domain/saas.ts — verificar antes de qualquer dado master
export const validateSuperAdminAccess = (token: string): boolean => {
  const payload = decodeToken(token);
  return payload?.role === 'super_admin' && payload?.empresaId === 'plena';
};

// Uso obrigatório em qualquer endpoint/service master
if (!validateSuperAdminAccess(token)) {
  throw new Error('Acesso negado — super-admin required');
}
```

---

## 2. Service de Métricas Agregadas

```typescript
// src/services/masterMetricsService.ts
import { buildScopedStorageKey } from '../domain/saas';

export interface EmpresaMetrics {
  empresaId: string;
  nomeEmpresa: string;
  totalPedidos: number;
  receitaTotal: number;
  ticketMedio: number;
  planoAtivo: string;
  licencaValida: boolean;
  ultimaAtividade: string;
}

export const masterMetricsService = {
  getAllEmpresas: (): string[] => {
    // Lista de empresas cadastradas — nunca hardcoded
    const key = buildScopedStorageKey('empresas', 'plena');
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  },

  getMetricasEmpresa: (empresaId: string): EmpresaMetrics => {
    const pedidosKey = buildScopedStorageKey('orders', empresaId);
    const pedidos = JSON.parse(localStorage.getItem(pedidosKey) || '[]');

    const receita = pedidos.reduce((acc: number, p: { total: number }) => acc + p.total, 0);

    return {
      empresaId,
      nomeEmpresa: empresaId, // substituir por lookup de empresa
      totalPedidos: pedidos.length,
      receitaTotal: receita,
      ticketMedio: pedidos.length ? receita / pedidos.length : 0,
      planoAtivo: 'profissional', // substituir por licenseService
      licencaValida: true,        // substituir por licenseService
      ultimaAtividade: pedidos.at(-1)?.createdAt ?? '',
    };
  },

  getAgregado: (): EmpresaMetrics[] => {
    const empresas = masterMetricsService.getAllEmpresas();
    return empresas.map(id => masterMetricsService.getMetricasEmpresa(id));
  },
};
```

---

## 3. Componente MasterDashboard

```typescript
// Estrutura de props — nunca misturar dados de empresas diferentes
interface MasterDashboardProps {
  // Não recebe empresaId — agrega tudo
}

export const MasterDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<EmpresaMetrics[]>([]);

  useEffect(() => {
    // Só carrega se super-admin validado
    const data = masterMetricsService.getAgregado();
    setMetrics(data);
  }, []);

  return (
    <div>
      {metrics.map(m => (
        <EmpresaMetricCard key={m.empresaId} data={m} />
      ))}
    </div>
  );
};
```

---

## Checklist de Segurança (obrigatório)

- [ ] Acesso validado como super-admin antes de qualquer dado
- [ ] Cada empresa lida via seu próprio `buildScopedStorageKey`
- [ ] Nenhum dado de empresa A exposto na view de empresa B
- [ ] Componentes do painel master não recebem `empresaId` de empresa cliente
- [ ] Testes validam que empresa sem permissão não acessa o painel
