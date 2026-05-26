import { supabase } from '../lib/supabase';
import type { MenuDigitalConfig, Product, RecipeItem } from '../types';

interface ProductRow {
  id: string;
  empresa_id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  recipe: RecipeItem[] | null;
  image: string | null;
  active: boolean | null;
  menu_digital: MenuDigitalConfig | null;
  created_at: string;
  updated_at: string;
}

type CreateProductInput = Omit<Product, 'id' | 'empresaId' | 'createdAt' | 'updatedAt'>;

interface ProductInsertRow {
  empresa_id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  recipe: RecipeItem[] | null;
  image: string | null;
  active: boolean;
  menu_digital: MenuDigitalConfig | null;
}

interface ProductUpdateRow {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  recipe?: RecipeItem[] | null;
  image?: string | null;
  active?: boolean;
  menu_digital?: MenuDigitalConfig | null;
  updated_at?: string;
}

const toProduct = (row: ProductRow): Product => ({
  id: row.id,
  empresaId: row.empresa_id,
  name: row.name,
  description: row.description,
  price: row.price,
  category: row.category,
  recipe: row.recipe ?? undefined,
  image: row.image ?? undefined,
  active: row.active ?? undefined,
  menuDigital: row.menu_digital ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toInsertRow = (empresaId: string, data: CreateProductInput): ProductInsertRow => ({
  empresa_id: empresaId,
  name: data.name,
  description: data.description,
  price: data.price,
  category: data.category,
  recipe: data.recipe ?? null,
  image: data.image ?? null,
  active: data.active ?? true,
  menu_digital: data.menuDigital ?? null,
});

const toUpdateRow = (data: Partial<Product>): ProductUpdateRow => {
  const payload: ProductUpdateRow = { updated_at: new Date().toISOString() };

  if (data.name !== undefined) payload.name = data.name;
  if (data.description !== undefined) payload.description = data.description;
  if (data.price !== undefined) payload.price = data.price;
  if (data.category !== undefined) payload.category = data.category;
  if (data.recipe !== undefined) payload.recipe = data.recipe;
  if (data.image !== undefined) payload.image = data.image;
  if (data.active !== undefined) payload.active = data.active;
  if (data.menuDigital !== undefined) payload.menu_digital = data.menuDigital;

  return payload;
};

const throwSupabaseError = (message: string, error: { message: string } | null) => {
  if (error) {
    throw new Error(`${message}: ${error.message}`);
  }
};

export async function listProducts(empresaId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('category', { ascending: true })
    .order('name', { ascending: true })
    .returns<ProductRow[]>();

  throwSupabaseError('Erro ao listar produtos', error);

  return (data ?? []).map(toProduct);
}

export async function getProduct(empresaId: string, id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('id', id)
    .maybeSingle<ProductRow>();

  throwSupabaseError('Erro ao buscar produto', error);

  return data ? toProduct(data) : null;
}

export async function createProduct(empresaId: string, data: CreateProductInput): Promise<Product> {
  const payload = toInsertRow(empresaId, data);

  const { data: created, error } = await supabase
    .from('products')
    .insert(payload)
    .select('*')
    .single<ProductRow>();

  throwSupabaseError('Erro ao criar produto', error);

  if (!created) {
    throw new Error('Erro ao criar produto: resposta vazia do Supabase.');
  }

  return toProduct(created);
}

export async function updateProduct(empresaId: string, id: string, data: Partial<Product>): Promise<Product> {
  const payload = toUpdateRow(data);

  const { data: updated, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id)
    .eq('empresa_id', empresaId)
    .select('*')
    .maybeSingle<ProductRow>();

  throwSupabaseError('Erro ao atualizar produto', error);

  if (!updated) {
    throw new Error('Produto nao encontrado para atualizacao na empresa informada.');
  }

  return toProduct(updated);
}

export async function deleteProduct(empresaId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('empresa_id', empresaId);

  throwSupabaseError('Erro ao excluir produto', error);
}

export async function toggleProductActive(empresaId: string, id: string, active: boolean): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('empresa_id', empresaId);

  throwSupabaseError('Erro ao atualizar status do produto', error);
}
