import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { currentUser, clearUser, setUser, initializeUser } from '../models/user.model';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // Initialize user from localStorage if not already loaded (handles page refresh)
  initializeUser();
  
  // Check localStorage first
  const storedUser = localStorage.getItem('userData');
  
  // If user data exists in localStorage but currentUser is not set, initialize it
  if (storedUser && !currentUser) {
    try {
      const userData = JSON.parse(storedUser);
      setUser(userData);
    } catch (e) {
      // Invalid data, clear and redirect
      clearUser();
      router.navigate(['/login'], { replaceUrl: true });
      return false;
    }
  }
  
  // Strict authentication check
  if (!currentUser) {
    // Clear any stale data and redirect to login
    clearUser();
    router.navigate(['/login'], { replaceUrl: true });
    return false;
  }
  
  // Additional validation: Check if user data exists in localStorage
  if (!storedUser) {
    // Data inconsistency - clear and redirect
    clearUser();
    router.navigate(['/login'], { replaceUrl: true });
    return false;
  }
  
  return true;
};

