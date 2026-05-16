import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';

export default function ProfilesBelowHero() {
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    base44.entities.MemberProfile.filter({ gender: 'female', is_active: true }, '-created_date', 24)
      .then(data => setProfiles(data.filter(p => p.photo_1)));
  }, []);

  if (profiles.length === 0) return null;

  const items = [...profiles, ...profiles, ...profiles];

  return (
    <section className="py-10 bg-background overflow-hidden border-b border-border">
      <div
        className="flex gap-4 animate-profiles-scroll"
        style={{ width: 'max-content' }}
      >
        {items.map((p, i) => (
          <Link
            to={`/profile/${p.id}`}
            key={`${p.id}-${i}`}
            className="relative flex-shrink-0 w-40 h-52 sm:w-48 sm:h-64 rounded-2xl overflow-hidden border border-border shadow-md hover:shadow-xl transition-shadow group"
          >
            <img
              src={p.photo_1}
              alt={p.display_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
              <p className="text-white text-sm font-semibold truncate">{p.display_name}</p>
              {p.location_city && (
                <p className="text-white/70 text-xs truncate">{p.location_city}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      <style>{`
        @keyframes profiles-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .animate-profiles-scroll {
          animation: profiles-scroll 40s linear infinite;
        }
        .animate-profiles-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}