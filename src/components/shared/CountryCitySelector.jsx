import React, { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES, getCitiesForCountry } from '@/lib/countryCityData';

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

  const cities = useMemo(() => getCitiesForCountry(country), [country]);

  const filteredCities = useMemo(() => {
    if (!citySearch) return cities;
    return cities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()));
  }, [cities, citySearch]);

  const handleCountryChange = (val) => {
    onCountryChange(val);
    onCityChange(''); // reset city when country changes
    setCitySearch('');
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
            {COUNTRIES.map(c => (
              <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City */}
      <div className="space-y-2">
        {showLabels && <Label>City</Label>}
        {cities.length > 0 ? (
          <Select
            value={city || ''}
            onValueChange={(val) => { onCityChange(val); setCitySearch(''); }}
            disabled={!country}
          >
            <SelectTrigger>
              <SelectValue placeholder={country ? 'Select city' : 'Select country first'} />
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
                <div className="px-2 py-1.5 text-xs text-muted-foreground">No cities found</div>
              )}
            </SelectContent>
          </Select>
        ) : (
          <Input
            placeholder="Enter city"
            value={city || ''}
            onChange={e => onCityChange(e.target.value)}
          />
        )}
      </div>
    </div>
  );
}