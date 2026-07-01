import React from 'react';

/**
 * Renders a single JuicyAds <ins> container element for the given zone ID.
 * The jads.js script (loaded via useJuicyAdsLoader) finds this element
 * by its id and renders the ad creative into it.
 *
 * @param {string} zone - JuicyAds zone/spot ID
 */
export default function JuicyAdsIns({ zone }) {
  if (!zone) return null;
  return (
    <ins
      id={String(zone)}
      className="block"
      style={{ display: 'block', minHeight: '90px' }}
    />
  );
}