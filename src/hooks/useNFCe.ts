import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useBase } from '../store/AppBaseContext';
import { focusNfeService } from '../services/integrations/focusNfeService';
import type { Order, NfceConfig, NfceItem, NfcePagamento, NfceEmissaoParams } from '../types';

export const useNFCe = () => {
  const { currentEmpresa } = useBase();
  const [isEmitting, setIsEmitting] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

  const fetchConfig = async (): Promise<NfceConfig | null> => {
    setIsLoadingConfig(true);
    try {
      const { data, error } = await supabase
        .from('nfce_configs')
        .select('*')
        .eq('empresa_id', currentEmpresa.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        empresaId: data.empresa_id,
        enabled: data.enabled,
        cnpj: data.cnpj,
        tokenHomologacao: data.token_homologacao,
        tokenProducao: data.token_producao,
        cscId: data.csc_id,
        cscToken: data.csc_token,
        ambiente: data.ambiente,
      };
    } catch (err) {
      console.error('Erro ao buscar configuração NFC-e:', err);
      return null;
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const saveConfig = async (config: Partial<NfceConfig>) => {
    try {
      const payload = {
        empresa_id: currentEmpresa.id,
        enabled: config.enabled,
        cnpj: config.cnpj,
        token_homologacao: config.tokenHomologacao,
        token_producao: config.tokenProducao,
        csc_id: config.cscId,
        csc_token: config.cscToken,
        ambiente: config.ambiente,
        updated_at: new Date().toISOString()
      };

      const existingConfig = await fetchConfig();

      if (existingConfig) {
        const { error } = await supabase
          .from('nfce_configs')
          .update(payload)
          .eq('empresa_id', currentEmpresa.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('nfce_configs')
          .insert([payload]);
        if (error) throw error;
      }
      return true;
    } catch (err) {
      console.error('Erro ao salvar configuração NFC-e:', err);
      return false;
    }
  };

  const mapPaymentMethodToSefaz = (method: string): string => {
    switch (method) {
      case 'dinheiro': return '01';
      case 'credito': return '03';
      case 'debito': return '04';
      case 'pix': return '17';
      case 'vr': return '05'; // Crédito Loja / Cartão Refeição
      case 'va': return '05';
      case 'voucher': return '05';
      default: return '99'; // Outros
    }
  };

  const emitirNFCe = async (order: Order, config: NfceConfig) => {
    if (!config.enabled) {
      throw new Error('Emissão de NFC-e desabilitada.');
    }

    const token = config.ambiente === 'producao' ? config.tokenProducao : config.tokenHomologacao;
    if (!token) {
      throw new Error('Token Focus NF-e não configurado.');
    }

    setIsEmitting(true);
    
    // Mapeamento dos Itens usando os dados de homologação definidos pelo usuário (Sprint 3E)
    const itens: NfceItem[] = order.items.map((item, index) => ({
      numero_item: (index + 1).toString(),
      codigo_produto: item.product.id.substring(0, 10), // Limitado para código local
      descricao: item.product.name,
      cfop: '5102', // Padrão Sprint 3E
      unidade_comercial: 'UN', // Assumido para simplificação
      quantidade_comercial: item.quantity.toString(),
      valor_unitario_comercial: item.price.toFixed(2),
      valor_bruto: (item.quantity * item.price).toFixed(2),
      icms_origem: '0', // Nacional
      icms_situacao_tributaria: '102', // Simples Nacional
      ncm: '21069090', // Padrão Restaurante Sprint 3E
      pis_situacao_tributaria: '07', // Isento
      cofins_situacao_tributaria: '07' // Isento
    }));

    // Mapeamento de Pagamentos
    const pagamentos: NfcePagamento[] = order.payments.map(p => ({
      forma_pagamento: mapPaymentMethodToSefaz(p.method),
      valor_pagamento: p.amount.toFixed(2)
    }));

    const ref = `pgm-${order.id}`;

    const params: NfceEmissaoParams = {
      natureza_operacao: 'Venda ao Consumidor',
      data_emissao: new Date().toISOString(),
      local_destino: '1', // Operação Interna
      presenca_comprador: order.origin === 'online' ? '4' : '1', // 4 para delivery
      cnpj_emitente: config.cnpj.replace(/\D/g, ''),
      itens,
      pagamentos,
      modalidade_frete: '9' // Sem frete
    };

    try {
      const result = await focusNfeService.emitir(ref, params, config.ambiente, token);
      
      // Salvar log no Supabase
      await supabase.from('nfce_logs').insert([{
        empresa_id: currentEmpresa.id,
        order_id: order.id,
        ref,
        status: result.status,
        ambiente: config.ambiente,
        numero: result.numero,
        serie: result.serie,
        chave: result.chave_nfe,
        xml_url: result.caminho_xml_nota_fiscal,
        danfe_url: result.caminho_danfe,
        error_message: result.mensagem,
        timestamp: new Date().toISOString()
      }]);

      return result;
    } catch (err: any) {
      console.error('Erro ao emitir NFC-e:', err);
      
      // Registrar log de erro
      await supabase.from('nfce_logs').insert([{
        empresa_id: currentEmpresa.id,
        order_id: order.id,
        ref,
        status: 'erro',
        ambiente: config.ambiente,
        error_message: err.message || 'Erro desconhecido',
        timestamp: new Date().toISOString()
      }]);
      
      throw err;
    } finally {
      setIsEmitting(false);
    }
  };

  return {
    fetchConfig,
    saveConfig,
    emitirNFCe,
    isEmitting,
    isLoadingConfig
  };
};
