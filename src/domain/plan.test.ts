import { canAccessModule, ModuleId } from './saas';
import assert from 'assert';

// Custom simple test runner for saas/plan domains
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(error);
    process.exit(1);
  }
}

console.log('\nRunning Plan & Access Control Tests...\n');

test('Usuário garcom + plano essencial → canAccessModule(\'essencial\', \'garcom\', \'estoque\') === false', () => {
  const result = canAccessModule('essencial', 'garcom', 'estoque');
  assert.strictEqual(result, false, 'Garçom com plano essencial não deve acessar estoque');
});

test('Usuário gerente + plano profissional → canAccessModule(\'profissional\', \'gerente\', \'cozinha\') === true', () => {
  const result = canAccessModule('profissional', 'gerente', 'cozinha');
  assert.strictEqual(result, true, 'Gerente com plano profissional deve acessar cozinha');
});

test('Usuário gerente + plano essencial → canAccessModule(\'essencial\', \'gerente\', \'dashboard\') === false', () => {
  const result = canAccessModule('essencial', 'gerente', 'dashboard');
  assert.strictEqual(result, false, 'Gerente com plano essencial não deve acessar dashboard (módulo restrito do plano)');
});

test('Usuário master + plano gestao → todos os módulos acessíveis', () => {
  const modules: ModuleId[] = [
    'dashboard', 'pdv', 'mesas', 'cozinha', 'estoque', 'caixa', 
    'produtos', 'clientes', 'colaboradores', 'fornecedores', 
    'relatorios', 'configuracoes', 'seguranca', 'suporte', 'manual'
  ];
  
  for (const mod of modules) {
    const result = canAccessModule('gestao', 'master', mod);
    assert.strictEqual(result, true, `Master com plano gestão deve acessar o módulo ${mod}`);
  }
});
