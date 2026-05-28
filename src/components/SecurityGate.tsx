import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Key, X, ShieldAlert, Check, Lock } from 'lucide-react';
import { useApp } from '../store/AppContext';

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

interface SecurityGateProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
}

export const SecurityGate: React.FC<SecurityGateProps> = ({ isOpen, onClose, onSuccess, title = 'Ação Protegida' }) => {
  const { collaborators, theme } = useApp();
  const isDark = theme === 'dark';
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

  useEffect(() => {
    if (!isOpen) { setPassword(''); setError(false); setErrorMsg(''); setSuccess(false); }
  }, [isOpen]);

  useEffect(() => {
    if (isLocked) {
      timerRef.current = setInterval(() => {
        const remaining = Math.ceil((lockedUntil! - Date.now()) / 1000);
        if (remaining <= 0) { setLockedUntil(null); setAttempts(0); setCountdown(0); clearInterval(timerRef.current!); }
        else setCountdown(remaining);
      }, 500);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isLocked, lockedUntil]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || success) return;
    const isAuthorized = collaborators.some(
      c => c.password === password && (c.permissions === 'admin' || c.permissions === 'staff')
    );
    if (isAuthorized) {
      setSuccess(true);
      setAttempts(0);
      setTimeout(() => { onSuccess(); onClose(); setPassword(''); setSuccess(false); }, 600);
    } else {
      const next = attempts + 1;
      setAttempts(next);
      setError(true);
      setPassword('');
      if (next >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_SECONDS * 1000);
        setCountdown(LOCKOUT_SECONDS);
        setErrorMsg(`Muitas tentativas. Aguarde ${LOCKOUT_SECONDS}s.`);
      } else {
        setErrorMsg(`Senha incorreta. ${MAX_ATTEMPTS - next} tentativa(s) restante(s).`);
      }
      setTimeout(() => setError(false), 900);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={isLocked ? undefined : onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }}
            className={`relative w-full max-w-sm rounded-panel shadow-2xl overflow-hidden border ${isDark ? 'bg-surface border-border' : 'bg-surface-light border-border-light'}`}
          >
            <div className="p-6 text-center space-y-5">
              <div className="flex justify-center">
                <div className={`w-16 h-16 rounded-panel flex items-center justify-center transition-all duration-500 ${
                  success ? 'bg-success/10 text-success scale-110' :
                  isLocked ? 'bg-danger/10 text-danger' :
                  error ? 'bg-danger/10 text-danger' :
                  'bg-accent/10 text-accent'
                }`}>
                  {success ? <Check className="w-8 h-8" /> : isLocked ? <Lock className="w-8 h-8" /> : error ? <ShieldAlert className="w-8 h-8" /> : <Key className="w-8 h-8" />}
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">{title}</h3>
                {isLocked ? (
                  <p className="text-xs text-danger">Bloqueado por {countdown}s</p>
                ) : errorMsg ? (
                  <p className="text-xs text-danger">{errorMsg}</p>
                ) : (
                  <p className="text-xs text-muted">Insira sua senha de autorização</p>
                )}
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  autoFocus type="password" inputMode="numeric"
                  value={password} onChange={e => setPassword(e.target.value)}
                  disabled={isLocked || success} placeholder="••••"
                  className={`w-full h-12 text-center text-2xl tracking-[0.5em] rounded-control border outline-none transition-all ${
                    isDark ? 'bg-elevated border-border focus:border-accent' : 'bg-elevated-light border-border-light focus:border-accent'
                  } ${error ? 'border-danger' : ''} ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
                />
                <div className="flex gap-3">
                  <button type="button" onClick={onClose}
                    className={`flex-1 h-10 rounded-control text-xs font-medium transition-all ${isDark ? 'bg-elevated hover:bg-border' : 'bg-elevated-light hover:bg-border-light'}`}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={isLocked || success}
                    className="flex-[2] h-10 rounded-control bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                    Confirmar
                  </button>
                </div>
              </form>
            </div>
            {!isLocked && (
              <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-control opacity-30 hover:opacity-100 transition-opacity">
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
