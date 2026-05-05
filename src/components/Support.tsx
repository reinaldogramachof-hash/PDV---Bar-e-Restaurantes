import React from 'react';
import { useApp } from '../store/AppContext';
import { 
  LifeBuoy, 
  MessageCircle, 
  Mail, 
  Phone, 
  ExternalLink, 
  Globe,
  Instagram,
  Facebook
} from 'lucide-react';
import { motion } from 'motion/react';

export const Support: React.FC = () => {
  const { theme } = useApp();
  const isDark = theme === 'dark';

  const contactMethods = [
    {
      title: 'WhatsApp',
      value: '(81) 98765-4321',
      sub: 'Atendimento imediato',
      icon: MessageCircle,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      link: 'https://wa.me/5581987654321'
    },
    {
      title: 'E-mail',
      value: 'suporte@plena.com.br',
      sub: 'Tempo de resposta: 2h',
      icon: Mail,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      link: 'mailto:suporte@plena.com.br'
    },
    {
      title: 'Telefone',
      value: '0800 123 4567',
      sub: 'Seg a Sex, 08h às 18h',
      icon: Phone,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      link: 'tel:08001234567'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
      {/* Header section */}
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 rounded-3xl bg-[#E85D75]/10 text-[#E85D75] mb-4">
          <LifeBuoy className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter uppercase">Central de Suporte</h1>
        <p className="text-sm font-bold opacity-40 uppercase tracking-[0.2em] max-w-lg mx-auto">
          Estamos aqui para ajudar você a tirar o máximo proveito do Bar Manager Pro.
        </p>
      </div>

      {/* Contact Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {contactMethods.map((method, i) => (
          <motion.a
            key={i}
            href={method.link}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`group p-8 rounded-[2.5rem] border transition-all hover:scale-[1.02] active:scale-95
              ${isDark ? 'bg-[#1C1C1E] border-[#2C2C2E] hover:border-[#E85D75]/40' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/20 hover:border-[#E85D75]/40'}`}
          >
            <div className={`w-14 h-14 rounded-2xl ${method.bg} ${method.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <method.icon className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest opacity-40 mb-1">{method.title}</h3>
            <p className="text-xl font-black tracking-tight mb-2">{method.value}</p>
            <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest">{method.sub}</p>
          </motion.a>
        ))}
      </div>

      {/* Website and Socials Card */}
      <div className={`p-10 rounded-[3rem] border overflow-hidden relative
        ${isDark ? 'bg-[#1C1C1E] border-[#2C2C2E]' : 'bg-white border-gray-100 shadow-2xl shadow-gray-200/30'}`}>
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#E85D75]/5 blur-[100px] -mr-32 -mt-32" />
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
          <div className="space-y-6 flex-1 text-center md:text-left">
            <div>
              <h2 className="text-2xl font-black tracking-tighter uppercase mb-2">Plena Informática</h2>
              <p className="text-sm font-medium opacity-60 leading-relaxed max-w-md">
                Desenvolvemos soluções inteligentes para o seu negócio. Siga-nos nas redes sociais e fique por dentro das novidades.
              </p>
            </div>
            
            <div className="flex items-center justify-center md:justify-start gap-4">
              <a href="#" className={`p-3 rounded-2xl transition-all hover:bg-[#E85D75] hover:text-white ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}><Instagram className="w-5 h-5" /></a>
              <a href="#" className={`p-3 rounded-2xl transition-all hover:bg-[#E85D75] hover:text-white ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}><Facebook className="w-5 h-5" /></a>
              <a href="https://www.plenainformatica.com.br" target="_blank" className={`p-3 rounded-2xl transition-all hover:bg-[#E85D75] hover:text-white ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}><Globe className="w-5 h-5" /></a>
            </div>
          </div>

          <div className="flex-shrink-0">
            <a 
              href="https://www.plenainformatica.com.br" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-10 py-6 bg-[#E85D75] text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-[#E85D75]/40 hover:scale-105 active:scale-95 transition-all"
            >
              Visitar Nosso Site
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>

      {/* Footer Text */}
      <div className="text-center opacity-30 py-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Bar Manager Pro - Versão 1.0.0</p>
        <p className="text-[8px] font-bold uppercase tracking-[0.2em] mt-2">© 2026 Plena Informática. Todos os direitos reservados.</p>
      </div>
    </div>
  );
}
