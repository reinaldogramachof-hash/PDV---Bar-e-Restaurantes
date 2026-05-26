import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AppSettings, Empresa, Permission, Usuario } from '../types';
import { mockSettings } from './mock';
import {
  DEFAULT_EMPRESA_ID,
  buildScopedStorageKey,
  ensureEmpresaId,
  hasRolePermission,
  migrateLegacyCollection,
} from '../domain/saas';

export interface AppBaseContextType {
  currentEmpresa: Empresa;
  currentUser: Usuario;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  hasPermission: (permission: Permission) => boolean;
  settings: AppSettings;
  updateSettings: (settings: AppSettings) => void;
  readGuides: string[];
  markGuideAsRead: (guideId: string) => void;
  toggleGuideRead: (guideId: string) => void;
}

interface AppBaseProviderProps {
  children: React.ReactNode;
  authUser?: Usuario;
  authEmpresa?: Empresa;
}

const parseJSON = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(fallback) && fallback.length > 0) {
      return fallback;
    }
    return parsed;
  } catch {
    return fallback;
  }
};

const parseScopedJSON = <T,>(key: string, empresaId: string, fallback: T, withEmpresa = false): T => {
  const scopedKey = buildScopedStorageKey(key, empresaId);
  const scoped = parseJSON<T | undefined>(scopedKey, undefined);
  if (scoped !== undefined) {
    if (withEmpresa && Array.isArray(scoped)) {
      return migrateLegacyCollection(scoped as Array<Record<string, unknown>>, empresaId).filter(item => item.empresaId === empresaId) as T;
    }
    if (withEmpresa && scoped && typeof scoped === 'object') {
      return ensureEmpresaId(scoped as Record<string, unknown>, empresaId) as T;
    }
    return scoped;
  }

  const legacy = parseJSON(key, fallback);
  if (!withEmpresa) return legacy;

  if (Array.isArray(legacy)) {
    return migrateLegacyCollection(legacy as Array<Record<string, unknown>>, empresaId).filter(item => item.empresaId === empresaId) as T;
  }

  if (legacy && typeof legacy === 'object') {
    return ensureEmpresaId(legacy as Record<string, unknown>, empresaId) as T;
  }

  return legacy;
};

const AppBaseContext = createContext<AppBaseContextType | undefined>(undefined);

export const AppBaseProvider: React.FC<AppBaseProviderProps> = ({ children, authUser, authEmpresa }) => {
  const currentEmpresa: Empresa = authEmpresa ?? {
    id: DEFAULT_EMPRESA_ID,
    empresaId: DEFAULT_EMPRESA_ID,
    name: 'Gestao Gastro Demo',
    document: '00.000.000/0001-00',
    plano: 'gestao',
    licenseStatus: 'active',
  };

  const currentUser: Usuario = authUser ?? {
    id: 'user-master-demo',
    empresaId: DEFAULT_EMPRESA_ID,
    name: 'Administrador Demo',
    email: 'admin@gestaogastro.local',
    role: 'master',
    active: true,
  };

  const [settings, setSettings] = useState<AppSettings>(() => parseScopedJSON('settings', currentEmpresa.id, mockSettings, true));
  const [readGuides, setReadGuides] = useState<string[]>(() => parseScopedJSON('readGuides', currentEmpresa.id, []));
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const th = parseJSON(buildScopedStorageKey('theme', currentEmpresa.id), parseJSON('theme', 'dark'));
    return th === 'dark' || th === 'light' ? th : 'dark';
  });

  useEffect(() => {
    localStorage.setItem(buildScopedStorageKey('settings', currentEmpresa.id), JSON.stringify(settings));
    localStorage.setItem(buildScopedStorageKey('readGuides', currentEmpresa.id), JSON.stringify(readGuides));
    localStorage.setItem(buildScopedStorageKey('theme', currentEmpresa.id), theme);
  }, [settings, readGuides, theme, currentEmpresa.id]);

  const hasPermission = (permission: Permission) => hasRolePermission(currentUser.role, permission);

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(ensureEmpresaId(newSettings, currentEmpresa.id));
  };

  const markGuideAsRead = (guideId: string) => {
    setReadGuides(prev => prev.includes(guideId) ? prev : [...prev, guideId]);
  };

  const toggleGuideRead = (guideId: string) => {
    setReadGuides(prev =>
      prev.includes(guideId) ? prev.filter(id => id !== guideId) : [...prev, guideId]
    );
  };

  return (
    <AppBaseContext.Provider value={{
      currentEmpresa,
      currentUser,
      theme,
      setTheme,
      hasPermission,
      settings,
      updateSettings,
      readGuides,
      markGuideAsRead,
      toggleGuideRead,
    }}>
      {children}
    </AppBaseContext.Provider>
  );
};

export const useBase = () => {
  const context = useContext(AppBaseContext);
  if (!context) throw new Error('useBase must be used within AppBaseProvider');
  return context;
};
