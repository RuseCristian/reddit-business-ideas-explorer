// Theme management functionality
export function initThemeToggle(): void {
  const THEME_KEY = 'reddit-scraper-theme';
  const themeToggle = document.getElementById('theme-toggle') as HTMLButtonElement;
  
  // Get saved theme or default to light
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  
  // Apply theme on load
  applyTheme(savedTheme);
  
  // Add click listener
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  function applyTheme(theme: string): void {
    document.documentElement.setAttribute('data-theme', theme);
    
    if (themeToggle) {
      themeToggle.classList.toggle('dark', theme === 'dark');
    }
    
    // Update meta theme color for mobile browsers
    updateThemeColor(theme);
  }
  
  function toggleTheme(): void {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    applyTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
  }
  
  function updateThemeColor(theme: string): void {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (metaThemeColor) {
      metaThemeColor.content = theme === 'dark' ? '#0a0a0a' : '#ffffff';
    }
  }
  
  // Listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', (e) => {
    if (!localStorage.getItem(THEME_KEY)) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
}