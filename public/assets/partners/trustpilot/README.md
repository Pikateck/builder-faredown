# Trustpilot Assets Integration

This directory contains Trustpilot brand assets for the Faredown platform integration.

## Official Asset Sources

All Trustpilot logos and brand assets should be sourced from the official Brandfetch page:
**https://brandfetch.com/trustpilot.com**

## Current Files

### Placeholder Assets (TO BE REPLACED)
- `trustpilot-wordmark-dark.svg` - Placeholder wordmark (replace with official SVG)
- `trustpilot-mark.svg` - Placeholder mark/icon (replace with official SVG)

## Integration Requirements

### Asset Specifications
- **Format**: SVG (vector format for retina-crisp display)
- **Source**: Official Brandfetch assets only (no screenshots or recreations)
- **Coloring**: Do NOT recolor Trustpilot brand assets
- **Scaling**: Scale proportionally to maintain brand integrity

### Usage in Code
The assets are integrated in `client/components/UnifiedLandingPage.tsx`:

```jsx
<img 
  src="/assets/partners/trustpilot/trustpilot-wordmark-dark.svg" 
  alt="Trustpilot rating" 
  className="h-6 w-auto"
/>
```

### Accessibility Requirements
- Alt text: "Trustpilot rating"
- ARIA label on rating link
- Keyboard focus visible (implemented with focus:ring-2)

## Future Trustpilot Widget Integration

A placeholder is prepared for the official Trustpilot embed widget:

```html
<div class="trustpilot-widget" 
     data-locale="en-US"
     data-template-id="PLACEHOLDER_TEMPLATE_ID"
     data-businessunit-id="YOUR_BUSINESS_UNIT_ID"
     data-style-width="100%" 
     data-style-height="24" 
     data-theme="light"></div>
<script async src="https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"></script>
```

## Replacement Instructions

1. Visit https://brandfetch.com/trustpilot.com
2. Download official SVG assets:
   - Trustpilot wordmark (dark version)
   - Trustpilot mark/icon
3. Replace placeholder files in this directory
4. Maintain exact filenames for seamless integration
5. Verify assets display correctly across all screen sizes

## Brand Compliance

- ✅ Use official Trustpilot brand colors
- ✅ Maintain proper aspect ratios
- ✅ Ensure high contrast and accessibility
- ❌ Do not modify or recolor brand assets
- ❌ Do not use unofficial recreations or screenshots
