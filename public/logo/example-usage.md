# Logo Usage Examples

## File Naming Convention
- `faredown-logo.png` - Main logo
- `faredown-logo-white.png` - White version for dark backgrounds  
- `faredown-icon.svg` - Icon only
- `favicon.ico` - Browser favicon

## Code Usage Examples

### Basic Logo
```tsx
<img src="/logo/faredown-logo.png" alt="Faredown Logo" />
```

### Header Logo (Current Implementation)
```tsx
<img 
  src="/logo/faredown-logo.png" 
  alt="Faredown Logo"
  className="h-16 object-contain"
/>
```

### Responsive Logo
```tsx
<img 
  src="/logo/faredown-logo.png" 
  alt="Logo"
  className="h-8 md:h-12 object-contain"
/>
```

## Steps to Replace Current Logo

1. Add your logo file to public/logo/
2. Update Header.tsx:
   - Replace external URL with "/logo/your-file.png"
3. Update other components as needed

## File Size Recommendations
- PNG: Max 200KB for logos
- SVG: Preferred for icons (scalable)
- WEBP: Best compression for photos
