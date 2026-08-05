import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Circle, AlertTriangle, Camera, ShieldCheck, UserCog } from 'lucide-react';

const PHOTO_FIELDS = Array.from({ length: 15 }, (_, i) => `photo_${i + 1}`);

export default function ProfileIncompleteBanner({ profile }) {
  const { t } = useTranslation();

  if (!profile) return null;

  const verifyDone = profile.didit_verification_status === 'Approved';
  const photoDone = PHOTO_FIELDS.some((f) => profile[f]);
  const profileComplete = profile.profile_complete === true;

  // Nothing to do — don't render
  if (verifyDone && photoDone && profileComplete) return null;

  const steps = [
    {
      done: verifyDone,
      icon: ShieldCheck,
      label: t('profile_incomplete_step_verify'),
    },
    {
      done: photoDone,
      icon: Camera,
      label: t('profile_incomplete_step_photo'),
    },
    {
      done: profileComplete,
      icon: UserCog,
      label: t('profile_incomplete_step_complete'),
    },
  ];

  const remainingCount = steps.filter((s) => !s.done).length;

  return (
    <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4">
      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
      <div className="flex-1">
        <p className="font-semibold text-sm">{t('profile_incomplete_title')}</p>
        <p className="text-sm mt-0.5 mb-3">
          {t('profile_incomplete_steps_intro', { count: remainingCount })}
        </p>
        <ul className="space-y-2">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <li key={idx} className="flex items-center gap-2 text-sm">
                {step.done ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
                ) : (
                  <Circle className="w-4 h-4 shrink-0 text-amber-500 fill-amber-100" />
                )}
                <Icon className={`w-4 h-4 shrink-0 ${step.done ? 'text-green-600' : 'text-amber-600'}`} />
                <span className={step.done ? 'text-amber-600/70 line-through' : 'text-amber-900 font-medium'}>
                  {step.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}