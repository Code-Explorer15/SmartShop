export interface User {
  fullName: string;
  countryCode: string;
  mobileNumber: string;
  mobile: string;
  password: string;
}

// Global user variable
export let currentUser: User | null = null;

// Initialize from localStorage if available
export function initializeUser(): void {
  const storedUser = localStorage.getItem('userData');
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
  }
}

// Set user and save to localStorage (including password)
export function setUser(user: User): void {
  currentUser = user;
  // Save everything including password to localStorage
  localStorage.setItem('userData', JSON.stringify(user));
  console.log('setUser called - Password stored:', user.password ? 'Yes' : 'No');
}

// Clear user and remove from localStorage
export function clearUser(): void {
  currentUser = null;
  localStorage.removeItem('userData');
}

// Initialize on module load
initializeUser();

