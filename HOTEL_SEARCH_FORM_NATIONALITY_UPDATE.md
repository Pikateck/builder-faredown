# HotelSearchForm Nationality Integration Guide

## Overview

This guide shows exactly how to add nationality selection to `client/components/HotelSearchForm.tsx`.

**Goal:** Add a nationality dropdown that matches the existing design and passes `guestNationality` to hotel search.

---

## Step 1: Add Imports

**At the top of the file (around lines 1-33), add:**

```typescript
import { getNationalities, getDefaultNationality, type Nationality } from '@/services/nationalitiesService';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
```

---

## Step 2: Add State Variables

**After the existing state declarations (around line 106), add:**

```typescript
// Nationality state
const [nationality, setNationality] = useState<string>('IN');
const [nationalities, setNationalities] = useState<Nationality[]>([]);
const [isNationalityLoading, setIsNationalityLoading] = useState(true);
```

---

## Step 3: Load Nationalities on Mount

**Add this useEffect after the existing mobile detection useEffect (around line 127), add:**

```typescript
// Load nationalities on mount
useEffect(() => {
  const loadNationalities = async () => {
    try {
      setIsNationalityLoading(true);
      
      // Get auth context for user's saved nationality
      const user = useAuth && useAuth()?.user;
      
      // Fetch nationalities from API
      const data = await getNationalities();
      setNationalities(data);
      
      // Set default based on user profile or fallback to IN
      const defaultNat = getDefaultNationality(user);
      setNationality(defaultNat);
      
      console.log(`✅ Loaded ${data.length} nationalities, default: ${defaultNat}`);
    } catch (error) {
      console.error('❌ Error loading nationalities:', error);
      // Fallback to minimal list if API fails
      setNationalities([
        { isoCode: 'IN', countryName: 'India' },
        { isoCode: 'AE', countryName: 'United Arab Emirates' },
        { isoCode: 'GB', countryName: 'United Kingdom' },
        { isoCode: 'US', countryName: 'United States' },
      ]);
      setNationality('IN');
    } finally {
      setIsNationalityLoading(false);
    }
  };

  loadNationalities();
}, []);
```

---

## Step 4: Update handleSearch Function

**In the handleSearch function (around line 346), add nationality to URL params:**

```typescript
const handleSearch = () => {
  // ... existing validation code ...

  try {
    // Update SearchContext with the search parameters
    const fullLocationName = selectedResult?.location || destination;
    const code = destinationCode || (selectedResult?.code as string) || "";

    updateSearchParams({
      destination: code || destination,
      destinationName: fullLocationName,
      checkIn: checkInDate.toISOString(),
      checkOut: checkOutDate.toISOString(),
      departureDate: checkInDate.toISOString(),
      returnDate: checkOutDate.toISOString(),
      guests: {
        adults: guests.adults,
        children: guests.children,
      },
      passengers: {
        adults: guests.adults,
        children: guests.children,
        infants: 0,
      },
      rooms: guests.rooms,
      guestNationality: nationality, // ← ADD THIS
      module: "hotels",
      tripType: "round-trip",
      searchTimestamp: new Date().toISOString(),
    });

    const urlSearchParams = new URLSearchParams({
      checkIn: checkInDate.toISOString(),
      checkOut: checkOutDate.toISOString(),
      adults: guests.adults.toString(),
      children: guests.children.toString(),
      rooms: guests.rooms.toString(),
      guestNationality: nationality, // ← ADD THIS
      searchType: "live",
      searchId: Date.now().toString(),
    });

    // ... rest of handleSearch function ...
  }
};
```

---

## Step 5: Add Nationality Dropdown to Form

**Find the form rendering section (around line 600-700), add nationality field between the guests selector and search button:**

```tsx
{/* Search Form Fields */}
<div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
  
  {/* Existing Destination Field */}
  <div className="relative">
    {/* ... existing destination popover ... */}
  </div>

  {/* Existing Date Fields */}
  <div className="relative">
    {/* ... existing calendar popover ... */}
  </div>

  {/* Existing Guests Field */}
  <div className="relative">
    {/* ... existing guests popover ... */}
  </div>

  {/* NEW: Nationality Field */}
  <div className="relative">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Guest Nationality
    </label>
    <Select
      value={nationality}
      onValueChange={setNationality}
      disabled={isNationalityLoading}
    >
      <SelectTrigger className="w-full h-12 px-4 rounded-lg border border-gray-200 bg-white hover:border-sky-400 transition-all">
        <SelectValue placeholder="Select nationality" />
      </SelectTrigger>
      <SelectContent className="max-h-[300px] overflow-y-auto">
        {nationalities.map((n) => (
          <SelectItem key={n.isoCode} value={n.isoCode}>
            {n.countryName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>

  {/* Existing Search Button */}
  <div className="flex items-end">
    <Button
      onClick={handleSearch}
      className="w-full h-12 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700"
    >
      <Search className="w-4 h-4 mr-2" />
      Search Hotels
    </Button>
  </div>
</div>
```

---

## Step 6: Mobile Layout Update

**For mobile layout (around line 800-900), add nationality field in the collapsed view:**

```tsx
{/* Mobile View */}
{isMobile && (
  <div className="flex flex-col gap-3">
    {/* Existing mobile fields */}
    <div>{/* ... destination ... */}</div>
    <div>{/* ... dates ... */}</div>
    <div>{/* ... guests ... */}</div>
    
    {/* NEW: Nationality for mobile */}
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Nationality
      </label>
      <Select
        value={nationality}
        onValueChange={setNationality}
        disabled={isNationalityLoading}
      >
        <SelectTrigger className="w-full h-12">
          <SelectValue placeholder="Select nationality" />
        </SelectTrigger>
        <SelectContent>
          {nationalities.map((n) => (
            <SelectItem key={n.isoCode} value={n.isoCode}>
              {n.countryName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {/* Search button */}
    <Button onClick={handleSearch}>{/* ... */}</Button>
  </div>
)}
```

---

## Step 7: Add to Initial Props (Optional)

**If the component accepts initial props, add nationality:**

```typescript
interface HotelSearchFormProps {
  className?: string;
  variant?: "compact" | "full";
  onSearch?: (searchData: any) => void;
  initialDestination?: string;
  initialDestinationCode?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: { adults: number; children: number; rooms: number };
  initialNationality?: string; // ← ADD THIS
}

export function HotelSearchForm({
  className = "",
  variant = "full",
  onSearch,
  initialDestination,
  initialDestinationCode,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
  initialNationality, // ← ADD THIS
}: HotelSearchFormProps) {
  // ...
  
  // Update nationality state initialization
  const [nationality, setNationality] = useState<string>(initialNationality || 'IN');
  
  // ...
}
```

---

## Step 8: Update SearchContext Types (Optional)

**File:** `client/contexts/SearchContext.tsx`

**Add nationality to search params type:**

```typescript
export interface SearchParams {
  destination?: string;
  destinationName?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: {
    adults: number;
    children: number;
  };
  rooms?: number;
  guestNationality?: string; // ← ADD THIS
  module?: string;
  // ... other fields
}
```

---

## Complete Example (Simplified)

Here's a minimal example showing the key parts together:

```tsx
import { useState, useEffect } from 'react';
import { getNationalities, getDefaultNationality, type Nationality } from '@/services/nationalitiesService';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function HotelSearchForm() {
  // Existing state
  const [destination, setDestination] = useState('');
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [checkOutDate, setCheckOutDate] = useState<Date>();
  const [guests, setGuests] = useState({ adults: 2, children: 0, rooms: 1 });

  // NEW: Nationality state
  const [nationality, setNationality] = useState<string>('IN');
  const [nationalities, setNationalities] = useState<Nationality[]>([]);

  // Load nationalities on mount
  useEffect(() => {
    const loadNationalities = async () => {
      const user = useAuth()?.user;
      const data = await getNationalities();
      setNationalities(data);
      setNationality(getDefaultNationality(user));
    };
    loadNationalities();
  }, []);

  const handleSearch = () => {
    const searchParams = {
      destination,
      checkIn: checkInDate?.toISOString(),
      checkOut: checkOutDate?.toISOString(),
      adults: guests.adults,
      children: guests.children,
      rooms: guests.rooms,
      guestNationality: nationality, // ← Include in search
    };

    // Navigate or call API...
    navigate(`/hotel-results?${new URLSearchParams(searchParams)}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {/* Destination */}
      <div>...</div>
      
      {/* Dates */}
      <div>...</div>
      
      {/* Guests */}
      <div>...</div>
      
      {/* NEW: Nationality */}
      <div>
        <label>Guest Nationality</label>
        <Select value={nationality} onValueChange={setNationality}>
          <SelectTrigger>
            <SelectValue placeholder="Select nationality" />
          </SelectTrigger>
          <SelectContent>
            {nationalities.map(n => (
              <SelectItem key={n.isoCode} value={n.isoCode}>
                {n.countryName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Search Button */}
      <Button onClick={handleSearch}>Search</Button>
    </div>
  );
}
```

---

## Testing Checklist

After making these changes:

- [ ] Nationality dropdown appears in search form
- [ ] Dropdown is populated with countries (IN at top)
- [ ] Default nationality is IN for anonymous users
- [ ] Logged-in users see their saved nationality (if set)
- [ ] Search URL includes `guestNationality` parameter
- [ ] Hotel search API receives nationality in request
- [ ] TBO searches work with nationality='IN'
- [ ] Mobile view shows nationality field
- [ ] Dropdown is scrollable (many countries)
- [ ] No console errors related to nationality

---

## Troubleshooting

**Issue:** Dropdown is empty
- Check `/api/meta/nationalities` endpoint
- Check browser console for errors
- Verify nationalities service import

**Issue:** Default not working
- Check `AuthContext` for user object
- Verify `nationality_iso` column in database
- Check service fallback logic

**Issue:** Search not including nationality
- Verify `handleSearch` includes nationality
- Check URL params in browser DevTools
- Verify backend logs show nationality

---

## Design Notes

**Styling:** Match existing form inputs (same height, border, hover states)

**Responsiveness:** 
- Desktop: 5 columns (destination | dates | guests | nationality | button)
- Mobile: Stacked vertical layout

**Accessibility:**
- Label text: "Guest Nationality"
- Placeholder: "Select nationality"
- Keyboard navigation: Works with Select component

**UX:**
- Pre-select user's saved nationality (if logged in)
- Default to India (IN) for anonymous users
- Allow override on every search
- Persist selection in URL for sharing

---

## Next Steps

1. Make the changes outlined above
2. Test locally with `npm run dev`
3. Verify nationality appears in search form
4. Test search with different nationalities
5. Deploy to staging
6. Test end-to-end with TBO
7. Monitor logs for nationality resolution
8. Deploy to production
