import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { currentUser, clearUser } from './models/user.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <div class="app-container">
      <!-- Splash Screen -->
      <div class="splash-screen" [class.fade-out]="showSplash === false">
        <div class="splash-content">
          <img src="assets/smartshop_updated_logo.png" alt="SmartShop Logo" class="splash-logo" />
        </div>
      </div>
      
      <!-- Main Content -->
      <div class="main-content" [class.fade-in]="showSplash === false">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      position: relative;
      width: 100%;
      height: 100vh;
      overflow: hidden;
    }

    .splash-screen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #3b6d59;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      opacity: 1;
      transition: opacity 0.8s ease-out;
    }

    .splash-screen.fade-out {
      opacity: 0;
      pointer-events: none;
    }

    .splash-content {
      display: flex;
      align-items: center;
      justify-content: center;
      animation: logoFadeIn 1.5s ease-in-out;
    }

    .splash-logo {
      max-width: 600px;
      width: 100%;
      height: auto;
      animation: logoScale 1.5s ease-in-out;
    }

    @keyframes logoFadeIn {
      0% {
        opacity: 0;
        transform: scale(0.8);
      }
      50% {
        opacity: 1;
        transform: scale(1.05);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes logoScale {
      0% {
        transform: scale(0.8);
      }
      50% {
        transform: scale(1.05);
      }
      100% {
        transform: scale(1);
      }
    }

    .main-content {
      opacity: 0;
      transition: opacity 0.8s ease-in;
    }

    .main-content.fade-in {
      opacity: 1;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'SmartShop';
  private navigationSubscription?: Subscription;
  private isInitialLoad = true;
  showSplash: boolean = true;
  private popstateHandler?: () => void;

  constructor(private router: Router) {}

  ngOnInit() {
    // Check if we should show splash screen
    const currentUrl = this.router.url;
    
    // If on home page and user is authenticated, don't show splash and don't redirect
    if (currentUrl === '/home') {
      const storedUser = localStorage.getItem('userData');
      if (storedUser) {
        // User is authenticated, stay on home page - just reload it
        // Ensure splash screen is not shown
        this.showSplash = false;
        sessionStorage.setItem('splashShown', 'true'); // Mark splash as shown to prevent it
        sessionStorage.setItem('isHomeRefresh', 'true'); // Mark as home refresh to prevent redirect
        // Initialize routing immediately for navigation handling
        this.setupNavigationListener();
        return;
      }
    }
    
    // Only show splash screen on initial app launch (when appInitialized is not set)
    const appInitialized = sessionStorage.getItem('appInitialized');
    const splashShown = sessionStorage.getItem('splashShown');
    
    // Show splash only on first app launch (not on refresh)
    if (!appInitialized && !splashShown && (currentUrl === '/login' || currentUrl === '/')) {
      this.showSplashScreen();
    } else {
      // Don't show splash on refresh
      this.showSplash = false;
      this.initializeRouting();
    }

    // Initialize routing immediately for navigation handling
    this.setupNavigationListener();
  }

  showSplashScreen() {
    // Check if this is a home page refresh - if so, don't show splash
    const isHomeRefresh = sessionStorage.getItem('isHomeRefresh');
    if (isHomeRefresh) {
      this.showSplash = false;
      sessionStorage.removeItem('isHomeRefresh');
      return;
    }
    
    this.showSplash = true;
    sessionStorage.setItem('splashShown', 'true');
    
    // Show splash screen for 2.5 seconds, then transition to login
    setTimeout(() => {
      this.showSplash = false;
      
      // Check again if this is a home page refresh before redirecting
      const stillHomeRefresh = sessionStorage.getItem('isHomeRefresh');
      if (stillHomeRefresh) {
        sessionStorage.removeItem('isHomeRefresh');
        return; // Don't redirect to login
      }
      
      // After fade out animation completes, redirect to login
      setTimeout(() => {
        clearUser();
        this.router.navigate(['/login'], { replaceUrl: true });
        this.initializeRouting();
      }, 800); // Wait for fade-out animation to complete
    }, 2500);
  }

  initializeRouting() {
    // Check if this is a home page refresh - if so, don't redirect
    const isHomeRefresh = sessionStorage.getItem('isHomeRefresh');
    if (isHomeRefresh) {
      sessionStorage.removeItem('isHomeRefresh');
      return; // Don't redirect, stay on home page
    }
    
    // Detect hot reload - if sessionStorage doesn't have app initialized flag, it's a fresh start or hot reload
    const appInitialized = sessionStorage.getItem('appInitialized');
    
    if (!appInitialized) {
      // Fresh start or hot reload - set the flag but don't redirect if on home page
      const currentUrl = this.router.url;
      if (currentUrl === '/home') {
        const storedUser = localStorage.getItem('userData');
        if (storedUser) {
          // User is authenticated and on home, just set flag and stay
          sessionStorage.setItem('appInitialized', 'true');
          this.isInitialLoad = false;
          return;
        }
      }
      // Not on home or not authenticated - redirect to login
      clearUser();
      sessionStorage.setItem('appInitialized', 'true');
      // Don't navigate here as splash screen will handle it
      this.isInitialLoad = false;
      return;
    }

    // Always start from login page - strict routing
    const currentUrl = this.router.url;
    
    // If on home page and authenticated, don't redirect
    if (currentUrl === '/home') {
      const storedUser = localStorage.getItem('userData');
      if (storedUser) {
        return; // Stay on home page
      }
    }
    
    const isPublicRoute = currentUrl === '/login' || currentUrl === '/signup' || currentUrl === '/forgot-password';
    
    // Strict rule: If not authenticated, always redirect to login
    if (!currentUser) {
      if (!isPublicRoute && currentUrl !== '/') {
        this.router.navigate(['/login'], { replaceUrl: true });
      }
    }
  }

  setupNavigationListener() {
    // Listen to navigation events to ensure proper routing
    this.navigationSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      
      // Check if this is a logout navigation (don't show splash on logout)
      const isLogoutNavigation = sessionStorage.getItem('isLogoutNavigation');
      
      // If navigating back to login page (but not from logout), show splash screen again
      // But don't show splash if navigating to home page
      if ((url === '/login' || url === '/') && !isLogoutNavigation) {
        sessionStorage.removeItem('splashShown');
        this.showSplashScreen();
        return;
      }
      
      // If navigating to home page and user is authenticated, don't show splash
      if (url === '/home') {
        const storedUser = localStorage.getItem('userData');
        if (storedUser) {
          this.showSplash = false;
          sessionStorage.setItem('splashShown', 'true');
          return;
        }
      }
      
      // Clear logout flag after handling
      if (isLogoutNavigation) {
        sessionStorage.removeItem('isLogoutNavigation');
      }
      
      // Strict routing: If not authenticated and trying to access protected route, redirect to login
      if (!currentUser && url !== '/login' && url !== '/signup' && url !== '/forgot-password' && url !== '/') {
        this.router.navigate(['/login'], { replaceUrl: true });
      }
    });

    // Listen to browser back/forward button
    this.popstateHandler = () => {
      const currentUrl = this.router.url;
      const isLogoutNavigation = sessionStorage.getItem('isLogoutNavigation');
      
      if ((currentUrl === '/login' || currentUrl === '/') && !isLogoutNavigation) {
        sessionStorage.removeItem('splashShown');
        this.showSplashScreen();
      }
      
      // Clear logout flag after handling
      if (isLogoutNavigation) {
        sessionStorage.removeItem('isLogoutNavigation');
      }
    };
    window.addEventListener('popstate', this.popstateHandler);
  }

  ngOnDestroy() {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
    if (this.popstateHandler) {
      window.removeEventListener('popstate', this.popstateHandler);
    }
  }
}

