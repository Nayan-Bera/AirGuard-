'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, MapPin, Navigation, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { GeoCoordinates, LocationInfo } from '@/types';

interface SearchResultItem {
  name: string;
  state: string;
  country: string;
  coordinates: GeoCoordinates;
}

interface LocationSearchProps {
  currentLocation?: LocationInfo | null;
  onSelectLocation: (location: LocationInfo) => void;
  onRequestGeolocation?: () => Promise<void> | void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactElement;
}

const POPULAR_CITIES: SearchResultItem[] = [
  {
    name: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    coordinates: { latitude: 28.6139, longitude: 77.209 },
  },
  {
    name: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    coordinates: { latitude: 19.076, longitude: 72.8777 },
  },
  {
    name: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    coordinates: { latitude: 12.9716, longitude: 77.5946 },
  },
  {
    name: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
    coordinates: { latitude: 22.5726, longitude: 88.3639 },
  },
  {
    name: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    coordinates: { latitude: 13.0827, longitude: 80.2707 },
  },
  {
    name: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    coordinates: { latitude: 17.385, longitude: 78.4867 },
  },
];

export function LocationSearch({
  currentLocation,
  onSelectLocation,
  onRequestGeolocation,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: LocationSearchProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsSearching(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/location/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        );
        if (!res.ok) {
          throw new Error(`Search failed (${res.status})`);
        }
        const json = await res.json();
        const items: SearchResultItem[] = Array.isArray(json)
          ? json
          : json.results ?? json.locations ?? json.data ?? [];
        setResults(items);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        // Local fallback filter from popular Indian cities if API unavailable
        const fallback = POPULAR_CITIES.filter((c) =>
          `${c.name} ${c.state}`.toLowerCase().includes(trimmed.toLowerCase())
        );
        setResults(fallback);
        if (fallback.length === 0) {
          setError('Could not search locations right now. Try again or pick a city below.');
        }
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleSelect = (item: SearchResultItem) => {
    onSelectLocation({
      coordinates: item.coordinates,
      city: item.name,
      state: item.state,
      country: item.country,
    });
    setOpen(false);
    setQuery('');
  };

  const handleUseMyLocation = async () => {
    setError(null);
    setIsLocating(true);

    try {
      if (onRequestGeolocation) {
        await onRequestGeolocation();
        setOpen(false);
        return;
      }

      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setError('Geolocation is not supported by your browser.');
        return;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000,
        });
      });

      onSelectLocation({
        coordinates: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        city: 'Current Location',
        state: '',
        country: '',
      });
      setOpen(false);
    } catch {
      setError('Location permission denied or unavailable. Please search for your city.');
    } finally {
      setIsLocating(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-1.5">
      <MapPin className="size-3.5 text-primary" />
      <span className="max-w-[160px] truncate">
        {currentLocation?.city || 'Select location'}
      </span>
    </Button>
  );

  const displayedList = query.trim().length >= 2 ? results : POPULAR_CITIES;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? defaultTrigger} />

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Location</DialogTitle>
          <DialogDescription>
            Search any city in India or worldwide, or use your device GPS.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city (e.g., Delhi, Pune, Jaipur)..."
              className="pl-8"
              autoFocus
            />
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full justify-center gap-2"
            onClick={handleUseMyLocation}
            disabled={isLocating}
          >
            {isLocating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Navigation className="size-4 text-primary" />
            )}
            {isLocating ? 'Detecting your location...' : 'Use my location'}
          </Button>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <div className="space-y-1">
            <p className="px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {query.trim().length >= 2 ? 'Search Results' : 'Popular Indian Cities'}
            </p>

            <div className="max-h-60 space-y-1 overflow-y-auto pr-1">
              {isSearching ? (
                <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Searching cities...
                </div>
              ) : displayedList.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No matching cities found for &ldquo;{query}&rdquo;.
                </div>
              ) : (
                displayedList.map((item, idx) => (
                  <button
                    key={`${item.name}-${item.coordinates.latitude}-${idx}`}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MapPin className="size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[item.state, item.country].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                    <span className="ml-2 shrink-0 text-[11px] text-muted-foreground tabular-nums">
                      {item.coordinates.latitude.toFixed(2)}, {item.coordinates.longitude.toFixed(2)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
