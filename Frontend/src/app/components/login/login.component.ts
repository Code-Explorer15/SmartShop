import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { setUser, currentUser } from '../../models/user.model';
// Removed AuthService import - using frontend-only authentication

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  phoneLength: number; // Expected phone number length (without country code)
  phoneFormat?: string; // Format pattern like 'XXX-XXX-XXXX' or 'XXXX-XXXX'
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;
  selectedCountry: Country;
  showPassword: boolean = false;
  showCountryDropdown: boolean = false;
  private navigationSubscription?: Subscription;
  
  // Static user list for frontend authentication
  staticUsers = [
    {
      fullName: 'BHARATHKUMAR(ADMIN)',
      countryCode: '+1',
      mobileNumber: '8102931752',
      password: 'admin'
    },
    {
      fullName: 'Sarah',
      countryCode: '+1',
      mobileNumber: '9895069519',
      password: 'password123'
    },
    {
      fullName: 'Lance',
      countryCode: '+1',
      mobileNumber: '1234567890',
      password: 'user123'
    },
    {
      fullName: 'Arpitha ',
      countryCode: '+1',
      mobileNumber: '9898989898',
      password: 'test123'
    },
    {
      fullName: 'Charlette Tang',
      countryCode: '+1',
      mobileNumber: '2424242424',
      password: 'demo123'
    }
  ];
  
  countries: Country[] = [
    { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', phoneLength: 10, phoneFormat: '(XXX)-XXX-XXXX' },
    { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', phoneLength: 10, phoneFormat: 'XXXX-XXXXXX' },
    { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', phoneLength: 10, phoneFormat: 'XXXXX-XXXXX' },
    { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', phoneLength: 10, phoneFormat: '(XXX)-XXX-XXXX' },
    { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', phoneLength: 9, phoneFormat: 'XXXX-XXXXX' },
    { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', phoneLength: 11, phoneFormat: 'XXXX-XXXXXXX' },
    { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', phoneLength: 9, phoneFormat: 'XX-XX-XX-XX-XX' },
    { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', phoneLength: 10, phoneFormat: 'XXX-XXXXXXX' },
    { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', phoneLength: 9, phoneFormat: 'XXX-XXX-XXX' },
    { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷', phoneLength: 11, phoneFormat: '(XX)-XXXXX-XXXX' },
    { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽', phoneLength: 10, phoneFormat: 'XXX-XXX-XXXX' },
    { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', phoneLength: 10, phoneFormat: 'XX-XXXX-XXXX' },
    { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳', phoneLength: 11, phoneFormat: 'XXX-XXXX-XXXX' },
    { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺', phoneLength: 10, phoneFormat: '(XXX)-XXX-XX-XX' },
    { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷', phoneLength: 10, phoneFormat: 'XXX-XXXX-XXXX' },
    { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', phoneLength: 9, phoneFormat: 'XXX-XXX-XXX' },
    { code: 'AE', name: 'UAE', dialCode: '+971', flag: '🇦🇪', phoneLength: 9, phoneFormat: 'XX-XXX-XXXX' },
    { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', phoneLength: 9, phoneFormat: 'XX-XXX-XXXX' },
    { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', phoneLength: 10, phoneFormat: 'XXX-XXX-XXXX' },
    { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬', phoneLength: 10, phoneFormat: 'XXX-XXX-XXXX' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    // Default to first country (US)
    this.selectedCountry = this.countries[0];
    
    this.loginForm = this.fb.group({
      countryCode: [this.selectedCountry.dialCode, [Validators.required]],
      mobileNumber: ['', [Validators.required]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });

    // Update validation when country changes
    this.updatePhoneValidation();

    // Format mobile number as user types
    this.loginForm.get('mobileNumber')?.valueChanges.subscribe(value => {
      if (value) {
        const formatted = this.formatPhoneNumber(value);
        if (formatted !== value) {
          this.loginForm.get('mobileNumber')?.setValue(formatted, { emitEvent: false });
        }
      }
    });
  }

  ngOnInit() {
    // If already logged in, redirect to home
    if (currentUser) {
      this.router.navigate(['/home'], { replaceUrl: true });
      return;
    }

    // Prevent browser back/forward navigation on login page
    // Replace current history entry to prevent going back
    window.history.replaceState(null, '', '/login');
    
    // Listen to navigation events and prevent back navigation
    this.navigationSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      // If user tries to navigate away from login without being authenticated, keep them on login
      if (url !== '/login' && url !== '/signup' && url !== '/forgot-password' && !currentUser) {
        this.router.navigate(['/login'], { replaceUrl: true });
      }
    });

    // Disable browser back button functionality on login page
    window.addEventListener('popstate', this.preventBackNavigation);
  }

  ngOnDestroy() {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
    window.removeEventListener('popstate', this.preventBackNavigation);
  }

  private preventBackNavigation = (event: PopStateEvent) => {
    // If on login page, prevent back navigation
    if (this.router.url === '/login' || this.router.url === '/') {
      window.history.pushState(null, '', '/login');
    }
  }

  updatePhoneValidation() {
    const phoneControl = this.loginForm.get('mobileNumber');
    if (phoneControl) {
      // Validate that the phone number has the correct number of digits
      phoneControl.setValidators([
        Validators.required,
        (control) => {
          if (!control.value) return null;
          const digits = control.value.replace(/\D/g, '');
          if (digits.length !== this.selectedCountry.phoneLength) {
            return { pattern: true };
          }
          return null;
        }
      ]);
      phoneControl.updateValueAndValidity();
    }
  }

  formatPhoneNumber(value: string): string {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Limit to selected country's phone length
    const limitedDigits = digits.slice(0, this.selectedCountry.phoneLength);
    
    if (limitedDigits.length === 0) return '';
    
    // Format based on country format pattern
    const format = this.selectedCountry.phoneFormat || '(XXX)-XXX-XXXX';
    
    if (format === '(XXX)-XXX-XXXX') {
      // US/Canada format
      if (limitedDigits.length <= 3) return `(${limitedDigits}`;
      if (limitedDigits.length <= 6) return `(${limitedDigits.slice(0, 3)})-${limitedDigits.slice(3)}`;
      return `(${limitedDigits.slice(0, 3)})-${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;
    } else if (format === 'XXXXX-XXXXX') {
      // India format
      if (limitedDigits.length <= 5) return limitedDigits;
      return `${limitedDigits.slice(0, 5)}-${limitedDigits.slice(5)}`;
    } else if (format === 'XXX-XXX-XXXX') {
      // General format
      if (limitedDigits.length <= 3) return limitedDigits;
      if (limitedDigits.length <= 6) return `${limitedDigits.slice(0, 3)}-${limitedDigits.slice(3)}`;
      return `${limitedDigits.slice(0, 3)}-${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;
    } else if (format === 'XXXX-XXXXX') {
      // Australia format
      if (limitedDigits.length <= 4) return limitedDigits;
      return `${limitedDigits.slice(0, 4)}-${limitedDigits.slice(4)}`;
    } else if (format === 'XX-XX-XX-XX-XX') {
      // France format
      let formatted = '';
      for (let i = 0; i < limitedDigits.length; i += 2) {
        if (i > 0) formatted += '-';
        formatted += limitedDigits.slice(i, i + 2);
      }
      return formatted;
    }
    
    // Default: just return digits
    return limitedDigits;
  }

  onCountryChange(country: Country) {
    this.selectedCountry = country;
    this.loginForm.patchValue({ countryCode: country.dialCode });
    this.showCountryDropdown = false;
    // Clear and update phone validation
    this.loginForm.patchValue({ mobileNumber: '' });
    this.updatePhoneValidation();
  }

  closeDropdown(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.country-selector') && !target.closest('.country-dropdown')) {
      this.showCountryDropdown = false;
    }
  }

  toggleCountryDropdown(event: Event) {
    event.stopPropagation();
    this.showCountryDropdown = !this.showCountryDropdown;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      // Extract only digits from formatted phone number
      const phoneDigits = this.loginForm.value.mobileNumber.replace(/\D/g, '');
      const countryCode = this.loginForm.value.countryCode;
      const password = this.loginForm.value.password;
      
      // Verify credentials against static user list
      const user = this.staticUsers.find(
        u => u.countryCode === countryCode && 
             u.mobileNumber === phoneDigits && 
             u.password === password
      );
      
      if (user) {
        // Store user details in user variable (including password)
        const userData = {
          fullName: user.fullName,
          countryCode: user.countryCode,
          mobileNumber: user.mobileNumber,
          mobile: `${user.countryCode} ${user.mobileNumber}`,
          password: user.password
        };
        console.log('Login - Storing user data with password:', userData.password ? 'Yes' : 'No');
        setUser(userData);
        
        this.isLoading = false;
        // Navigate to home with replaceUrl to prevent back navigation to login
        this.router.navigate(['/home'], { replaceUrl: true });
      } else {
        this.isLoading = false;
        this.errorMessage = 'Invalid mobile number or password.';
      }
    }
  }

}

