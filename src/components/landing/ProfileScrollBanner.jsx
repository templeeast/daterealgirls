import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function ProfileScrollBanner() {
  const [profiles, setProfiles] = useState([]);
  const trackRef = useRef(null);

  useEffect(() => {
    base44.entities.MemberProfile.filter({ gender: 'female', is_active: true }, '-created_date', 20)
      .then(data => setProfiles(data.filter(p => p.photo_1)));
  }, []);

  if (profiles.length === 0) return null;

  // Duplicate for seamless infinite scroll
  const items = [...profiles, ...profiles, ...profiles];

  return (
    <div className="w-full overflow-hidden mt-8 mb-2">
      <div
        ref={trackRef}
        className="flex gap-4 animate-scroll-banner"
        style={{ width: 'max-content' }}
      >
        {items.map((p, i) => (
          <div
            key={`${p.id}-${i}`}
            className="relative flex-shrink-0 w-28 h-36 sm:w-36 sm:h-44 rounded-2xl overflow-hidden border-2 border-white/30 shadow-lg"
          >
            <img
              src={p.photo_1}
              alt={p.display_name}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
              <p className="text-white text-xs font-semibold truncate">{p.display_name}</p>
              <p className="text-white/70 text-[10px] truncate">{p.location_city}</p>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes scroll-banner {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .animate-scroll-banner {
          animation: scroll-banner 30s linear infinite;
        }
        .animate-scroll-banner:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}