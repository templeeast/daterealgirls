import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const STOCK_PROFILES = [
  { id: 's1', display_name: 'Sophia', location_city: 'Miami', photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop&crop=face' },
  { id: 's2', display_name: 'Isabella', location_city: 'Los Angeles', photo: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop&crop=face' },
  { id: 's3', display_name: 'Mia', location_city: 'New York', photo: 'https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=400&h=600&fit=crop&crop=face' },
  { id: 's4', display_name: 'Emma', location_city: 'Chicago', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop&crop=face' },
  { id: 's5', display_name: 'Olivia', location_city: 'Dallas', photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=600&fit=crop&crop=face' },
  { id: 's6', display_name: 'Ava', location_city: 'San Diego', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face' },
  { id: 's7', display_name: 'Luna', location_city: 'Austin', photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=600&fit=crop&crop=face' },
  { id: 's8', display_name: 'Aria', location_city: 'Seattle', photo: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=600&fit=crop&crop=face' },
  { id: 's9', display_name: 'Chloe', location_city: 'Denver', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop&crop=face' },
  { id: 's10', display_name: 'Zoe', location_city: 'Portland', photo: 'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?w=400&h=600&fit=crop&crop=face' },
];

export default function StockProfilesBanner() {
  const [profiles, setProfiles] = useState([]);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    base44.entities.MemberProfile.filter({ gender: 'female', is_active: true, profile_complete: true }, '-created_date', 20)
      .then(data => {
        const real = data.filter(p => p.photo_1).map(p => ({
          id: p.id,
          display_name: p.display_name,
          location_city: p.location_city,
          photo: p.photo_1,
          isReal: true,
        }));
        // Fill with stock photos if fewer than 6 real profiles
        const combined = real.length >= 6 ? real : [...real, ...STOCK_PROFILES.slice(0, Math.max(6, 10 - real.length))];
        setProfiles(combined);
      })
      .catch(() => setProfiles(STOCK_PROFILES));
  }, []);

  const items = [...profiles, ...profiles, ...profiles];

  const handleClick = (p) => {
    if (!isAuthenticated) return;
    if (p.isReal) navigate(`/profile/${p.id}`);
    else navigate('/browse');
  };

  return (
    <section className="py-12 bg-secondary/30 overflow-hidden border-y border-border">
      <div className="text-center mb-6 px-4">
        <h2 className="font-heading text-2xl font-bold mb-1">Meet Our Members</h2>
        <p className="text-muted-foreground text-sm">Verified, real people looking for genuine connections</p>
      </div>
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
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
              <p className="text-white text-sm font-semibold truncate">{p.display_name}</p>
              {p.location_city && (
                <p className="text-white/70 text-xs truncate">{p.location_city}</p>
              )}
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