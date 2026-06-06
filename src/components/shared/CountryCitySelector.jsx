import React, { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES, getCitiesForCountry } from '@/lib/countryCityData';
import { base44 } from '@/api/base44Client';
import { PlusCircle } from 'lucide-react';

const ADD_NEW_VALUE = '__add_new__';

/**
 * Reusable country + city selector combo.
 * Props:
 *   country {string} - current country value
 *   city {string} - current city value
 *   onCountryChange {fn} - called with new country string
 *   onCityChange {fn} - called with new city string
 *   showLabels {boolean} - whether to show labels (default true)
 *   layout {string} - 'grid' (default) or 'stacked'
 */
export default function CountryCitySelector({
  country,
  city,
  onCountryChange,
  onCityChange,
  showLabels = true,
  layout = 'grid',
}) {
  const [citySearch, setCitySearch] = useState('');
  const [customCityMode, setCustomCityMode] = useState(false);
  const [customCityInput, setCustomCityInput] = useState('');

  const cities = useMemo(() => getCitiesForCountry(country), [country]);

  const filteredCities = useMemo(() => {
    if (!citySearch) return cities;
    return cities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()));
  }, [cities, citySearch]);

  const handleCountryChange = (val) => {
    onCountryChange(val);
    onCityChange('');
    setCitySearch('');
    setCustomCityMode(false);
    setCustomCityInput('');
  };

  const handleCitySelect = (val) => {
    if (val === ADD_NEW_VALUE) {
      setCustomCityMode(true);
      onCityChange('');
      setCitySearch('');
    } else {
      onCityChange(val);
      setCitySearch('');
    }
  };

  const handleCustomCityConfirm = async () => {
    const trimmed = customCityInput.trim();
    if (!trimmed) return;

    // Save new city for admin review
    const countryObj = COUNTRIES.find(c => c.name === country);
    try {
      const me = await base44.auth.me();
      await base44.entities.City.create({
        name: trimmed,
        country: country || '',
        country_code: countryObj?.code || '',
        needs_review: true,
        reviewed: false,
        submitted_by_user_id: me?.id || '',
      });
    } catch {
      // Non-blocking: city submission failed but still let user proceed
    }

    onCityChange(trimmed);
    setCustomCityMode(false);
    setCustomCityInput('');
  };

  const containerClass = layout === 'grid'
    ? 'grid grid-cols-2 gap-4'
    : 'space-y-4';

  return (
    <div className={containerClass}>
      {/* Country */}
      <div className="space-y-2">
        {showLabels && <Label>Country</Label>}
        <Select value={country || ''} onValueChange={handleCountryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {[
              ...COUNTRIES.filter(c => c.code === 'US'),
              ...COUNTRIES.filter(c => c.code !== 'US').sort((a, b) => a.name.localeCompare(b.name)),
            ].map(c => (
              <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City */}
      <div className="space-y-2">
        {showLabels && <Label>City</Label>}

        {/* No country selected or no cities in DB — plain text input */}
        {!country ? (
          <Input
            placeholder="Enter city"
            value={city || ''}
            onChange={e => onCityChange(e.target.value)}
          />
        ) : customCityMode ? (
          /* Custom city entry mode */
          <div className="flex gap-2">
            <Input
              placeholder="Type your city..."
              value={customCityInput}
              onChange={e => setCustomCityInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); handleCustomCityConfirm(); }
                if (e.key === 'Escape') { setCustomCityMode(false); setCustomCityInput(''); }
              }}
              autoFocus
            />
            <button
              type="button"
              onClick={handleCustomCityConfirm}
              className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm whitespace-nowrap"
            >
              Add
            </button>
          </div>
        ) : cities.length > 0 ? (
          /* Dropdown with search + "Add new" option */
          <Select
            value={city || ''}
            onValueChange={handleCitySelect}
            disabled={!country}
          >
            <SelectTrigger>
              <SelectValue placeholder={country ? (city || 'Select city') : 'Select country first'} />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              <div className="px-2 pb-1 sticky top-0 bg-popover z-10">
                <Input
                  placeholder="Search city..."
                  value={citySearch}
                  onChange={e => setCitySearch(e.target.value)}
                  className="h-7 text-xs"
                  onClick={e => e.stopPropagation()}
                  onKeyDown={e => e.stopPropagation()}
                />
              </div>
              {filteredCities.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
              {filteredCities.length === 0 && (
                <div className="px-2 py-1 text-xs text-muted-foreground">No cities found</div>
              )}
              <SelectItem value={ADD_NEW_VALUE}>
                <span className="flex items-center gap-1 text-primary">
                  <PlusCircle className="w-3.5 h-3.5" /> Enter a different city
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        ) : (
          /* Country has no city list — plain text with "submit new" behavior */
          <div className="flex gap-2">
            <Input
              placeholder="Enter city"
              value={customCityInput || city || ''}
              onChange={e => {
                setCustomCityInput(e.target.value);
                onCityChange(e.target.value);
              }}
              onBlur={async () => {
                const trimmed = (customCityInput || city || '').trim();
                if (!trimmed) return;
                const countryObj = COUNTRIES.find(c => c.name === country);
                try {
                  const me = await base44.auth.me();
                  await base44.entities.City.create({
                    name: trimmed,
                    country: country || '',
                    country_code: countryObj?.code || '',
                    needs_review: true,
                    reviewed: false,
                    submitted_by_user_id: me?.id || '',
                  });
                } catch {
                  // Non-blocking
                }
              }}
            />
          </div>
        )}

        {/* Show confirmed custom city as a note */}
        {!customCityMode && city && !cities.includes(city) && country && (
          <p className="text-xs text-muted-foreground">
            "{city}" will be reviewed by our team.{' '}
            <button type="button" className="underline" onClick={() => { setCustomCityMode(true); setCustomCityInput(city); }}>
              Change
            </button>
          </p>
        )}
      </div>
    </div>
  );
}