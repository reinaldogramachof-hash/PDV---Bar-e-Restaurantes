import QRCode from 'qrcode';
import { Combo, Product } from '../types';

export function getMenuUrl(empresaId: string): string {
  return `${window.location.origin}/cardapio/${empresaId}`;
}

export async function generateQRCode(empresaId: string, accentColor?: string): Promise<string> {
  return QRCode.toDataURL(getMenuUrl(empresaId), {
    width: 400,
    margin: 2,
    color: { dark: accentColor || '#0F0F11', light: '#FAFAFA' },
  });
}

export function downloadQR(dataUrl: string, empresaName: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `cardapio-qr-${empresaName.toLowerCase().replace(/\s+/g, '-')}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function getMenuProducts(products: Product[], combos: Combo[] = []): Record<string, Product[]> {
  const visibleProducts = products.filter(product => product.menuDigital?.visible && product.active !== false);
  const visibleCombos: Product[] = combos
    .filter(combo => combo.active && combo.menuDigital?.visible)
    .map(combo => ({
      id: combo.id,
      empresaId: combo.empresaId,
      name: combo.name,
      description: combo.description || combo.items.map(item => `${item.qty} item`).join(', '),
      price: combo.comboPrice,
      category: 'Combos',
      image: combo.imageBase64,
      active: combo.active,
      menuDigital: {
        visible: true,
        description: combo.description,
        imageBase64: combo.imageBase64,
        highlight: combo.menuDigital?.highlight ?? true,
        highlightLabel: combo.menuDigital?.highlightLabel || 'Combo',
      },
    }));

  const visible = [...visibleProducts, ...visibleCombos];
  return visible.reduce((acc, product) => {
    const category = product.category || 'Outros';
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);
}
