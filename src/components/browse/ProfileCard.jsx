import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Heart, Shield, Star, Clock, AlertCircle, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import WinkButton from '@/components/profile/WinkButton';

export default function ProfileCard({ profile, onFavorite, isFavorited, myProfile, hasWinked, canInteract, onLockedInteract }) {
  const lookingForLabels = {
    relationship: 'Relationship',
    friendship: 'Friendship',
    casual: 'Casual',
    marriage: 'Marriage',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative bg-card rounded-2xl overflow-hidden border hover:shadow-xl transition-all duration-300"
    >
      {/* Photo */}
      <Link to={`/profile/${profile.id}`}>
        <div className="aspect-[3/4] relative overflow-hidden">
          {profile.photo_1 ? (
            <img
              src={profile.photo_1}
              alt={profile.display_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent flex items-center justify-center">
              <Heart className="w-12 h-12 text-primary/30" />
            </div>
          )}
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {/* Badge: Verified / Un-Verified based on ID verification status */}
          {profile.verification_status === 'verified' ? (
            <div className="absolute top-3 left-3 bg-green-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-full flex items-center gap-1 text-xs font-medium">
              <Shield className="w-3 h-3" />
              Verified
            </div>
          ) : profile.verification_status === 'rejected' ? (
            <div className="absolute top-3 left-3 bg-red-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-full flex items-center gap-1 text-xs font-medium">
              <AlertCircle className="w-3 h-3" />
              Rejected
            </div>
          ) : (
            <div className="absolute top-3 left-3 bg-amber-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-full flex items-center gap-1 text-xs font-medium">
              <Clock className="w-3 h-3" />
              Pending
            </div>
          )}

          {/* Info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className="font-heading text-xl font-semibold">
              {profile.display_name}, {profile.age}
            </h3>
            {(profile.location_city || profile.location_country) && (
              <p className="flex items-center gap-1 text-sm text-white/80 mt-1">
                <MapPin className="w-3 h-3" />
                {[profile.location_city, profile.location_country].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>
      </Link>

      {/* Bottom bar */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {profile.looking_for && (
            <Badge variant="secondary" className="text-xs">
              {lookingForLabels[profile.looking_for] || profile.looking_for}
            </Badge>
          )}
          {profile.interests?.slice(0, 2).map(i => (
            <Badge key={i} variant="outline" className="text-xs">{i}</Badge>
          ))}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {myProfile && !canInteract ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.preventDefault(); onLockedInteract?.(); }}
              title="Verify & unlock to interact"
            >
              <Lock className="w-4 h-4 text-muted-foreground" />
            </Button>
          ) : (
            <>
              {myProfile && (
                <WinkButton
                  myProfile={myProfile}
                  targetProfileId={profile.id}
                  existingWink={hasWinked}
                  size="icon"
                />
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.preventDefault(); onFavorite?.(profile); }}
              >
                <Star className={`w-4 h-4 ${isFavorited ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}