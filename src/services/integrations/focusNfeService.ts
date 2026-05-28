import { NfceEmissaoParams, NfceResult } from '../../types';

export const focusNfeService = {
  getBaseUrl(ambiente: 'homologacao' | 'producao'): string {
    return ambiente === 'producao' 
      ? 'https://api.focusnfe.com.br/v2/nfce' 
      : 'https://homologacao.focusnfe.com.br/v2/nfce';
  },

  getHeaders(token: string): Record<string, string> {
    const encodedToken = btoa(token + ':');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${encodedToken}`
    };
  },

  async emitir(ref: string, params: NfceEmissaoParams, ambiente: 'homologacao' | 'producao', token: string): Promise<NfceResult> {
    const url = `${this.getBaseUrl(ambiente)}?ref=${ref}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(params),
    });

    const data = await response.json();
    
    if (!response.ok) {
      if (data.erros) {
        throw new Error(JSON.stringify(data.erros));
      } else if (data.mensagem) {
        throw new Error(data.mensagem);
      }
      throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
    }

    return data as NfceResult;
  },

  async consultar(ref: string, ambiente: 'homologacao' | 'producao', token: string): Promise<NfceResult> {
    const url = `${this.getBaseUrl(ambiente)}/${ref}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.erros) {
        throw new Error(JSON.stringify(data.erros));
      } else if (data.mensagem) {
        throw new Error(data.mensagem);
      }
      throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
    }

    return data as NfceResult;
  },

  async cancelar(ref: string, justificativa: string, ambiente: 'homologacao' | 'producao', token: string): Promise<NfceResult> {
    const url = `${this.getBaseUrl(ambiente)}/${ref}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(token),
      body: JSON.stringify({ justificativa }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.erros) {
        throw new Error(JSON.stringify(data.erros));
      } else if (data.mensagem) {
        throw new Error(data.mensagem);
      }
      throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
    }

    return data as NfceResult;
  }
};
