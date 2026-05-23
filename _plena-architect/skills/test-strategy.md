# Skill: Estratégia de Testes

**Quando usar:** Escrever testes para qualquer feature nova  
**Tempo:** 30min–1h por feature  
**Meta:** >80% coverage nos arquivos novos

---

## Pirâmide de Testes

```
        [E2E]          ← fluxos críticos no browser (Browser Recording)
      [Integration]    ← service + storage working together
    [Unit Tests]       ← funções puras, componentes isolados
```

## 1. Testes de Domínio (Mais Rápidos)

```typescript
// src/domain/[feature].test.ts
import { functionName } from './featureModule';

// Padrão: describe → it → arrange/act/assert
describe('featureModule', () => {
  it('deve retornar X quando Y', () => {
    // Arrange
    const input = { empresaId: 'empresa-a', ... };
    
    // Act
    const result = functionName(input);
    
    // Assert
    expect(result).toBe(expectedValue);
  });

  it('deve rejeitar dados de empresa diferente', () => {
    expect(() => {
      validateAndImport(dataEmpresaA, 'empresa-b');
    }).toThrow('Dados de empresa diferente');
  });
});
```

## 2. Testes de Isolamento Multi-Empresa (Obrigatório)

```typescript
describe('isolamento multi-empresa', () => {
  const EMPRESA_A = 'empresa-a-test';
  const EMPRESA_B = 'empresa-b-test';

  beforeEach(() => {
    // Limpar storage entre testes
    Object.keys(localStorage).forEach(key => {
      if (key.includes(EMPRESA_A) || key.includes(EMPRESA_B)) {
        localStorage.removeItem(key);
      }
    });
  });

  it('empresa A não vê dados de empresa B', () => {
    // Criar dado na empresa A
    itemService.create({ name: 'Produto A' }, EMPRESA_A);
    
    // Empresa B não deve ver
    const itemsB = itemService.getAll(EMPRESA_B);
    expect(itemsB).toHaveLength(0);
  });

  it('dados importados de empresa errada são rejeitados', () => {
    const dataDeA = exportService.export(EMPRESA_A);
    expect(() => importService.import(dataDeA, EMPRESA_B))
      .toThrow();
  });
});
```

## 3. Testes de Componente

```typescript
// Focar em comportamento, não implementação
describe('LicenseBanner', () => {
  it('não renderiza quando daysRemaining > 30', () => {
    const { queryByRole } = render(
      <LicenseBanner daysRemaining={31} onDismiss={() => {}} />
    );
    expect(queryByRole('alert')).toBeNull();
  });

  it('renderiza aviso quando daysRemaining <= 30', () => {
    const { getByText } = render(
      <LicenseBanner daysRemaining={15} onDismiss={() => {}} />
    );
    expect(getByText(/15 dias/)).toBeInTheDocument();
  });

  it('chama onDismiss ao fechar', () => {
    const onDismiss = jest.fn();
    const { getByLabelText } = render(
      <LicenseBanner daysRemaining={10} onDismiss={onDismiss} />
    );
    fireEvent.click(getByLabelText('fechar'));
    expect(onDismiss).toHaveBeenCalled();
  });
});
```

## 4. Validação Visual (Browser Recording)

Sempre solicitar no prompt da missão:

```
"Após implementar, abrir http://localhost:3000 e:
1. Navegar para [view]
2. Executar [ação crítica]
3. Verificar [resultado esperado]
4. Gravar interação e incluir no Walkthrough"
```

## Checklist de Testes

- [ ] Funções puras testadas com inputs válidos e inválidos
- [ ] Isolamento multi-empresa testado (A não vê B)
- [ ] Import/export validado com empresa errada
- [ ] Componentes testam comportamento (não implementação)
- [ ] npm run test → >80% coverage nos arquivos novos
- [ ] Browser Recording confirma UI funcionando
