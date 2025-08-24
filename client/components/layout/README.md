# Global Layout System

This directory contains the global layout components that ensure consistent header, search panel, and footer across all pages.

## Components

### `Layout.tsx`
The main layout wrapper component that provides consistent structure across all pages.

**Props:**
- `children`: React.ReactNode - The page content
- `showSearch?: boolean` - Whether to show the search panel (default: true)
- `showMobileNav?: boolean` - Whether to show mobile bottom navigation (default: true)
- `className?: string` - Additional CSS classes for the main content area

**Usage:**
```tsx
import { Layout } from "@/components/layout/Layout";

export default function MyPage() {
  return (
    <Layout>
      {/* Your page content here */}
      <section className="py-20">
        <h1>Page Content</h1>
      </section>
    </Layout>
  );
}
```

**Hide Search Panel (for pages like Help Center):**
```tsx
<Layout showSearch={false} showMobileNav={false}>
  {/* Content for pages that don't need search */}
</Layout>
```

### `Header.tsx`
Unified header component with:
- Mobile hamburger menu with overlay
- Desktop navigation bar
- Currency selector
- User account dropdown
- Language selector
- Responsive design

### `SearchPanel.tsx`
Smart search panel that:
- Detects current tab/page from URL
- Shows appropriate search form (flights, hotels, sightseeing, transfers)
- Displays relevant titles and subtitles
- Works on both mobile and desktop

### `Footer.tsx`
Consistent footer with:
- Logo and tagline
- Service links (Flights, Hotels, etc.)
- Social media icons
- Certifications (TAAI, TAAFI, IATA)
- Copyright information

### `MobileBottomNav.tsx`
Mobile bottom navigation bar with:
- Tab switching (Flights, Hotels, Sightseeing, Transfers, Account)
- Active state indicators
- Touch-friendly targets

## Key Features

### 🔄 **Automatic Scroll-to-Top**
The Layout component automatically scrolls to the top when navigating between pages using the `useScrollToTop` hook.

### 📱 **Mobile-First Design**
All components are designed mobile-first with responsive breakpoints for desktop.

### 🎨 **Consistent Branding**
- Primary Blue: `#003580`
- Secondary Blue: `#0071c2` 
- Accent Yellow: `#febb02` with hover: `#e6a602`

### 🧭 **Smart Navigation**
The header automatically detects the current page/tab and highlights the active navigation item.

## Migration Guide

### Before (Old Pattern):
```tsx
// ❌ Old way - duplicated header/footer in each page
export default function MyPage() {
  const navigate = useNavigate();
  // ... lots of header state and logic
  
  return (
    <div className="min-h-screen">
      <header>/* complex header logic */</header>
      <main>/* page content */</main>
      <footer>/* footer */</footer>
    </div>
  );
}
```

### After (New Pattern):
```tsx
// ✅ New way - clean and consistent
import { Layout } from "@/components/layout/Layout";

export default function MyPage() {
  return (
    <Layout>
      {/* Just your page content */}
      <section className="py-20">
        <h1>My Page</h1>
      </section>
    </Layout>
  );
}
```

## Benefits

1. **Consistency**: Header, search, and footer look identical across all pages
2. **DRY Principle**: No code duplication for layout components
3. **Maintainability**: Changes to header/footer update everywhere automatically
4. **Performance**: Shared components reduce bundle size
5. **UX**: Smooth navigation with scroll-to-top behavior

## Examples

See `FlightsSimple.tsx` for a complete example of how to use the Layout system for a service page.
