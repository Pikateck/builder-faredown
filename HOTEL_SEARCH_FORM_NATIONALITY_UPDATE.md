# Hotel Search Form - Nationality Field Integration

## Summary

This document describes the nationality dropdown implementation in `client/components/HotelSearchForm.tsx`.

---

## Implementation

### 1. Imports

```typescript
import {
  getNationalities,
  getDefaultNationality,
  type Nationality,
} from '@/services/nationalitiesService';
import { useAuth } from '@/contexts/AuthContext';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
```

### 2. State

```typescript
// Get user context
const { user } = useAuth() || { user: null };

// Nationality state
const [nationality, setNationality] = useState<string>('IN');
const [nationalities, setNationalities] = useState<Nationality[]>([]);
const [isNationalityLoading, setIsNationalityLoading] = useState(true);
```

### 3. Load Nationalities

```typescript
useEffect(() => {
  const loadNationalities = async () => {
    try {
      setIsNationalityLoading(true);
      
      const data = await getNationalities();
      setNationalities(data);
      
      // Set default based on user profile
      const defaultNat = getDefaultNationality(user);
      setNationality(defaultNat);
      
      console.log(`✅ Loaded ${data.length} nationalities`);
    } catch (error) {
      console.error('❌ Error loading nationalities:', error);
      // Fallback list
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
}, [user]);
```

### 4. UI Component

**Located below Guests & Rooms field:**

```tsx
<div className="relative">
  <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
    Guest Nationality
  </label>
  <Select
    value={nationality}
    onValueChange={setNationality}
    disabled={isNationalityLoading}
  >
    <SelectTrigger className="w-full h-10 sm:h-12 justify-start text-left font-medium bg-white border-2 border-blue-400 hover:border-blue-500 rounded text-xs sm:text-sm px-2 sm:px-3">
      <Globe className="mr-2 h-4 w-4 flex-shrink-0" />
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
```

### 5. Include in Search

```typescript
const handleSearch = () => {
  // Update SearchContext
  updateSearchParams({
    destination,
    checkIn: checkInDate.toISOString(),
    checkOut: checkOutDate.toISOString(),
    adults: guests.adults,
    children: guests.children,
    rooms: guests.rooms,
    guestNationality: nationality, // ← Add this
    module: "hotels",
  });

  // URL parameters
  const urlParams = new URLSearchParams({
    checkIn: checkInDate.toISOString(),
    checkOut: checkOutDate.toISOString(),
    adults: guests.adults.toString(),
    children: guests.children.toString(),
    rooms: guests.rooms.toString(),
    guestNationality: nationality, // ← Add this
  });

  navigate(`/hotel-results?${urlParams}`);
};
```

---

## Features

✅ **Floating label** - "Guest Nationality" label floats above field  
✅ **Globe icon** - Visual indicator in dropdown trigger  
✅ **Priority sorting** - India first, then popular countries, then alphabetical  
✅ **User defaults** - Logged-in users see their saved nationality  
✅ **Anonymous fallback** - Defaults to `IN` for anonymous users  
✅ **Caching** - Nationalities cached after first load  
✅ **Error handling** - Fallback to top countries if API fails  
✅ **Responsive** - Works on mobile and desktop  
✅ **Accessibility** - Proper ARIA labels and keyboard navigation  

---

## Layout

The nationality field is positioned **below the Guests & Rooms field** in a vertical stack:

```
┌─────────────────────────┐
│  Guests & Rooms         │
│  👥 2 adults, 0...     │
└─────────────────────────┘
┌─────────────────────────┐
│  Guest Nationality      │
│  🌐 India              │
└─────────────────────────┘
```

Both fields share a container:

```tsx
<div className="flex-1 lg:max-w-[280px] flex flex-col gap-2">
  {/* Guests & Rooms */}
  <div className="relative">...</div>
  
  {/* Nationality */}
  <div className="relative">...</div>
</div>
```

---

## Testing Checklist

- [ ] Dropdown populates with countries
- [ ] India (`IN`) appears first
- [ ] Anonymous users default to `IN`
- [ ] Logged-in users see their saved nationality
- [ ] Selection persists during search
- [ ] `guestNationality` appears in URL params
- [ ] Backend receives nationality in request
- [ ] Mobile view works correctly
- [ ] Loading state shows properly
- [ ] Fallback works when API fails

---

**Status:** ✅ Implemented  
**Date:** 2025-04-15
