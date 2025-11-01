import { atom } from 'nanostores';

// Font scale values: 0.875 (small), 1.0 (normal), 1.125 (large), 1.25 (extra large)
export const fontScale = atom<number>(1.0);

// Initialize from localStorage if available
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('font-scale');
  if (saved) {
    const scale = parseFloat(saved);
    if (!isNaN(scale) && scale >= 0.875 && scale <= 1.25) {
      fontScale.set(scale);
    }
  }

  // Save to localStorage whenever it changes
  fontScale.subscribe((scale) => {
    localStorage.setItem('font-scale', scale.toString());
    // Apply to CSS variable
    document.documentElement.style.setProperty('--font-scale', scale.toString());
  });

  // Apply initial value immediately
  document.documentElement.style.setProperty(
    '--font-scale',
    fontScale.get().toString()
  );
}
