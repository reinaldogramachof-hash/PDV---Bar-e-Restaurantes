import { useCallback, useEffect, useState } from 'react';
import type { Product } from '../types';
import { useBase } from '../store/AppBaseContext';
import {
  createProduct as createProductInSupabase,
  deleteProduct as deleteProductInSupabase,
  listProducts,
  toggleProductActive,
  updateProduct as updateProductInSupabase,
} from '../services/productsSupabaseService';

type CreateProductInput = Omit<Product, 'id' | 'empresaId' | 'createdAt' | 'updatedAt'>;

type UpdateProductInput = Partial<Omit<Product, 'id' | 'empresaId' | 'createdAt' | 'updatedAt'>>;

export interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  createProduct: (data: CreateProductInput) => Promise<void>;
  updateProduct: (id: string, data: UpdateProductInput) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  toggleActive: (id: string, active: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useProducts(): UseProductsReturn {
  const { currentEmpresa } = useBase();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const nextProducts = await listProducts(currentEmpresa.id);
      setProducts(nextProducts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos.');
    } finally {
      setLoading(false);
    }
  }, [currentEmpresa.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createProduct = useCallback(async (data: CreateProductInput) => {
    setError(null);
    const created = await createProductInSupabase(currentEmpresa.id, data);
    setProducts(prev => [...prev, created]);
  }, [currentEmpresa.id]);

  const updateProduct = useCallback(async (id: string, data: UpdateProductInput) => {
    setError(null);
    const updated = await updateProductInSupabase(currentEmpresa.id, id, data);
    setProducts(prev => prev.map(product => (product.id === id ? updated : product)));
  }, [currentEmpresa.id]);

  const deleteProduct = useCallback(async (id: string) => {
    setError(null);
    await deleteProductInSupabase(currentEmpresa.id, id);
    setProducts(prev => prev.filter(product => product.id !== id));
  }, [currentEmpresa.id]);

  const toggleActive = useCallback(async (id: string, active: boolean) => {
    setError(null);
    await toggleProductActive(currentEmpresa.id, id, active);
    setProducts(prev => prev.map(product => (product.id === id ? { ...product, active } : product)));
  }, [currentEmpresa.id]);

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleActive,
    refresh,
  };
}
