import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { LicenseCheckResult } from '../services/licenseService';

interface LicenseBannerProps {
  license: LicenseCheckResult;
}

const DISMISS_KEY = 'gestao-gastro:license-banner-dismissed';

const formatDate = (date?: string) =>
  date ? new Intl.DateTimeFormat('pt-BR').format(new Date(date)) : 'em breve';

export const LicenseBanner: React.FC<LicenseBannerProps> = ({ license }) => {
  const [dismissed, setDismissed] = React.useState(() => sessionStorage.getItem(DISMISS_KEY) === 'true');

  if (dismissed || license.status === 'suspended' || license.daysRemaining > 30) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  };

  return (
    <div className="flex items-center gap-3 border-b border-warning/20 bg-warning/10 px-6 py-3 text-warning">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold">
          Licenca vence em {license.daysRemaining} dia{license.daysRemaining === 1 ? '' : 's'}
        </p>
        <p className="text-xs text-warning/80">
          Plano {license.plan}. Expiracao: {formatDate(license.expiresAt)}. Contate a Plena para renovar.
        </p>
      </div>
      <a
        href="https://wa.me/5512992191018"
        target="_blank"
        rel="noopener noreferrer"
        className="hidden h-10 items-center rounded-control bg-warning px-4 text-xs font-medium text-white hover:brightness-110 sm:inline-flex"
      >
        Contato Plena
      </a>
      <button
        onClick={handleDismiss}
        className="flex h-8 w-8 items-center justify-center rounded-control hover:bg-warning/10"
        aria-label="Dispensar aviso de licenca"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
