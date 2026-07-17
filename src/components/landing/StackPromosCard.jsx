import React from 'react';
import { Link } from 'react-router-dom';
import { UserCheck, ShieldCheck, Ticket, ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function StackPromosCard() {
  const { t } = useTranslation();

  const steps = [
    { icon: UserCheck, label: t('stack_promos_step1'), code: 'GODATE26' },
    { icon: ShieldCheck, label: t('stack_promos_step2'), code: 'LAUNCH26' },
    { icon: Ticket, label: t('stack_promos_step3'), code: 'FUNDATES' },
  ];

  return (
    <div className="max-w-4xl mx-auto relative overflow-hidden rounded-2xl border-2 border-primary/20 shadow-xl shadow-primary/5"
      style={{ background: 'linear-gradient(135deg, hsl(346 77% 99%) 0%, hsl(0 0% 100%) 50%, hsl(346 77% 97%) 100%)' }}
    >
      {/* Decorative sparkles */}
      <div className="absolute top-6 right-6 text-primary/15 pointer-events-none">
        <Sparkles className="w-20 h-20" />
      </div>
      <div className="absolute bottom-8 left-6 text-primary/10 pointer-events-none">
        <Sparkles className="w-12 h-12" />
      </div>

      <div className="relative p-6 sm:p-10">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 text-primary-foreground"
            style={{ background: 'linear-gradient(135deg, hsl(346 77% 52%) 0%, hsl(346 77% 45%) 100%)', boxShadow: '0 4px 12px hsl(346 77% 52% / 0.3)' }}
          >
            <Sparkles className="w-3 h-3" />
            {t('stack_promos_badge')}
          </span>
          <h3 className="font-heading text-2xl sm:text-4xl font-bold mb-3 text-foreground">{t('stack_promos_title')}</h3>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">{t('stack_promos_subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex flex-col items-center text-center bg-card/80 backdrop-blur-sm rounded-xl p-5 border border-primary/10 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 hover:-translate-y-0.5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'hsl(346 77% 95%)' }}>
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <p className="text-sm font-semibold text-foreground mb-3">{step.label}</p>
                <span className="inline-block px-4 py-1.5 rounded-lg text-sm font-bold mb-3 text-primary"
                  style={{ background: 'hsl(346 77% 97%)', border: '1.5px dashed hsl(346 77% 60% / 0.4)' }}
                >
                  {step.code}
                </span>
                <p className="text-base font-extrabold text-primary flex items-center gap-1">
                  {t('stack_promos_reward')}
                </p>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Link to="/token-guide" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:gap-2.5 transition-all"
            style={{ transition: 'gap 0.2s ease' }}
          >
            {t('stack_promos_view_token_guide')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}