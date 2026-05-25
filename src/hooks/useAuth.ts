import { useEffect, useState, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Usuario, Empresa } from '../types'

export interface AuthState {
  session: Session | null
  user: Usuario | null
  empresa: Empresa | null
  loading: boolean
  error: string | null
}

export interface AuthActions {
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

interface ProfileRow {
  id: string
  empresa_id: string
  name: string
  role: string
  active: boolean
  created_at: string
  updated_at: string
  empresa: {
    id: string
    name: string
    document: string
    plano: string
    license_status: string
    created_at: string
    updated_at: string
  }
}

export function useAuth(): AuthState & AuthActions {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    empresa: null,
    loading: true,
    error: null,
  })

  const loadProfile = useCallback(async (session: Session) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, empresa:empresas(*)')
      .eq('id', session.user.id)
      .single<ProfileRow>()

    if (error || !data) {
      setState({ session, user: null, empresa: null, loading: false, error: 'Perfil não encontrado. Contate o suporte.' })
      return
    }

    const user: Usuario = {
      id: session.user.id,
      empresaId: data.empresa_id,
      name: data.name,
      email: session.user.email ?? '',
      role: data.role as Usuario['role'],
      active: data.active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    const empresa: Empresa = {
      id: data.empresa.id,
      name: data.empresa.name,
      document: data.empresa.document,
      plano: data.empresa.plano as Empresa['plano'],
      licenseStatus: data.empresa.license_status as Empresa['licenseStatus'],
      empresaId: data.empresa.id,
      createdAt: data.empresa.created_at,
      updatedAt: data.empresa.updated_at,
    }

    setState({ session, user, empresa, loading: false, error: null })
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadProfile(session)
      } else {
        setState(s => ({ ...s, loading: false }))
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadProfile(session)
      } else {
        setState({ session: null, user: null, empresa: null, loading: false, error: null })
      }
    })

    return () => subscription.unsubscribe()
  }, [loadProfile])

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? error.message : null
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  return { ...state, signIn, signOut }
}
