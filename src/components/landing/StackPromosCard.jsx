import React from 'react';
import { Link } from 'react-router-dom';
import { UserCheck, ShieldCheck, Ticket, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function StackPromosCard() {
  const { t } = useTranslation();

  const steps = [
    { icon: UserCheck, label: t('stack_promos_step1'), code: 'GODATE26' },
    { icon: ShieldCheck, label: t('stack_promos_step2'), code: 'LAUNCH26' },
    { icon: Ticket, label: t('stack_promos_step3'), code: 'FUNDATES' },
  ];

  return (
    <div className="max-w-4xl mx-auto bg-card border border-border rounded-xl p-6 sm:p-8">
      <div className="text-center mb-8">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-accent-foreground mb-3">
          {t('stack_promos_badge')}
        </span>
        <h3 className="font-heading text-2xl sm:text-3xl font-bold mb-2">{t('stack_promos_title')}</h3>
        <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">{t('stack_promos_subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center mb-3">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground mb-2">{step.label}</p>
              <span className="inline-block px-4 py-1 rounded-full border border-border text-sm font-semibold text-foreground mb-2">
                {step.code}
              </span>
              <p className="text-sm font-bold text-primary">{t('stack_promos_reward')}</p>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-8">
        <Link to="/token-guide" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
          {t('stack_promos_view_token_guide')}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}