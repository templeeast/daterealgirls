import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import useSiteConfig from '@/hooks/useSiteConfig';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

const STOCK_PROFILES = [
  { id: 's1', display_name: 'Valentina', location_city: 'Miami', photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=600&fit=crop&crop=face', verified: Math.random() > 0.5 },
  { id: 's2', display_name: 'Camila', location_city: 'Los Angeles', photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=600&fit=crop&crop=face', verified: Math.random() > 0.5 },
  { id: 's3', display_name: 'Yuki', location_city: 'New York', photo: 'https://images.unsplash.com/photo-1589571894960-20bbe2828d0a?w=400&h=600&fit=crop&crop=face', verified: Math.random() > 0.5 },
  { id: 's4', display_name: 'Sofia', location_city: 'Chicago', photo: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&h=600&fit=crop&crop=face', verified: Math.random() > 0.5 },
  { id: 's5', display_name: 'Mei', location_city: 'San Francisco', photo: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=600&fit=crop&crop=face', verified: Math.random() > 0.5 },
  { id: 's6', display_name: 'Diana', location_city: 'San Diego', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&crop=face', verified: Math.random() > 0.5 },
  { id: 's7', display_name: 'Lucia', location_city: 'Austin', photo: 'https://images.unsplash.com/photo-1614436163996-25cee5f54290?w=400&h=600&fit=crop&crop=face', verified: Math.random() > 0.5 },
  { id: 's8', display_name: 'Hana', location_city: 'Seattle', photo: 'https://images.unsplash.com/photo-1604004555489-723a93d6ce74?w=400&h=600&fit=crop&crop=face', verified: Math.random() > 0.5 },
  { id: 's9', display_name: 'Elena', location_city: 'Dallas', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop&crop=face', verified: Math.random() > 0.5 },
  { id: 's10', display_name: 'Isabella', location_city: 'Houston', photo: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=600&fit=crop&crop=face', verified: Math.random() > 0.5 },
  { id: 's11', display_name: 'Natalia', location_city: 'Phoenix', photo: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=400&h=600&fit=crop&crop=face', verified: Math.random() > 0.5 },
  { id: 's12', display_name: 'Akemi', location_city: 'Portland', photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&h=600&fit=crop&crop=face', verified: Math.random() > 0.5 },
  { id: 's13', display_name: 'Rosa', location_city: 'Denver', photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=600&fit=crop&crop=face', verified: Math.random() > 0.5 },
  { id: 's14', display_name: 'Christine', location_city: 'Boston', photo: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400&h=600&fit=crop&crop=face', verified: Math.random() > 0.5 },
  { id: 's15', display_name: 'Gabriela', location_city: 'Miami', photo: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=600&fit=crop&crop=face', verified: Math.random() > 0.5 },
];

export default function StockProfilesBanner() {
  const [profiles, setProfiles] = useState([]);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { config } = useSiteConfig();
  const { t } = useTranslation();

  useEffect(() => {
    const filterQuery = { gender: 'female', is_active: true, profile_complete: true, is_suspended: false };
    base44.entities.MemberProfile.filter(filterQuery, '-created_date', 20)
      .then(data => {
        const real = data.filter(p => p.photo_1).map(p => ({
          id: p.id,
          display_name: p.display_name,
          location_city: p.location_city,
          photo: p.photo_1,
          verified: p.verification_status === 'verified',
          isReal: true,
        }));
        // Fill with stock photos if fewer than 6 real profiles
        const combined = real.length >= 6 ? real : [...real, ...STOCK_PROFILES.slice(0, Math.max(6, 10 - real.length))];
        setProfiles(combined);
      })
      .catch(() => setProfiles(STOCK_PROFILES));
  }, [config.banner_show_women_only]);

  const items = [...profiles, ...profiles, ...profiles];

  const handleClick = (p) => {
    if (!isAuthenticated) return;
    if (p.isReal) navigate(`/profile/${p.id}`);
    else navigate('/browse');
  };

  return (
    <section className="py-12 bg-secondary/30 overflow-hidden border-y border-border">
      <div
        className="flex gap-4 stock-banner-scroll"
        style={{ width: 'max-content' }}
      >
        {items.map((p, i) => (
          <button
            key={`${p.id}-${i}`}
            onClick={() => handleClick(p)}
            className="relative flex-shrink-0 w-36 h-48 sm:w-44 sm:h-60 rounded-2xl overflow-hidden border border-border shadow-md hover:shadow-xl transition-shadow group focus:outline-none"
          >
            <img
              src={p.photo}
              alt={p.display_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
              <p className="text-white text-sm font-semibold truncate mb-1">{p.display_name}</p>
              <div className="flex items-center justify-between">
                 {p.location_city && (
                   <p className="text-white/70 text-xs truncate">{p.location_city}</p>
                 )}
               </div>
            </div>
          </button>
        ))}
      </div>

      <style>{`
        @keyframes stock-banner-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .stock-banner-scroll {
          animation: stock-banner-scroll 50s linear infinite;
        }
        .stock-banner-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}