import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  phoneLength: number;
  phoneFormat?: string;
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  signupForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;
  selectedCountry: Country;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  showCountryDropdown: boolean = false;
  
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
    private authService: AuthService,
    private router: Router
  ) {
    // Default to first country (US)
    this.selectedCountry = this.countries[0];
    
    this.signupForm = this.fb.group({
      fullName: ['', [Validators.required]],
      countryCode: [this.selectedCountry.dialCode, [Validators.required]],
      mobileNumber: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    // Update validation when country changes
    this.updatePhoneValidation();

    // Format mobile number as user types
    this.signupForm.get('mobileNumber')?.valueChanges.subscribe(value => {
      if (value) {
        const formatted = this.formatPhoneNumber(value);
        if (formatted !== value) {
          this.signupForm.get('mobileNumber')?.setValue(formatted, { emitEvent: false });
        }
      }
    });
  }

  updatePhoneValidation() {
    const phoneControl = this.signupForm.get('mobileNumber');
    if (phoneControl) {
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
    const digits = value.replace(/\D/g, '');
    const limitedDigits = digits.slice(0, this.selectedCountry.phoneLength);
    
    if (limitedDigits.length === 0) return '';
    
    const format = this.selectedCountry.phoneFormat || '(XXX)-XXX-XXXX';
    
    if (format === '(XXX)-XXX-XXXX') {
      if (limitedDigits.length <= 3) return `(${limitedDigits}`;
      if (limitedDigits.length <= 6) return `(${limitedDigits.slice(0, 3)})-${limitedDigits.slice(3)}`;
      return `(${limitedDigits.slice(0, 3)})-${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;
    } else if (format === 'XXXXX-XXXXX') {
      if (limitedDigits.length <= 5) return limitedDigits;
      return `${limitedDigits.slice(0, 5)}-${limitedDigits.slice(5)}`;
    } else if (format === 'XXX-XXX-XXXX') {
      if (limitedDigits.length <= 3) return limitedDigits;
      if (limitedDigits.length <= 6) return `${limitedDigits.slice(0, 3)}-${limitedDigits.slice(3)}`;
      return `${limitedDigits.slice(0, 3)}-${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;
    } else if (format === 'XXXX-XXXXX') {
      if (limitedDigits.length <= 4) return limitedDigits;
      return `${limitedDigits.slice(0, 4)}-${limitedDigits.slice(4)}`;
    } else if (format === 'XX-XX-XX-XX-XX') {
      let formatted = '';
      for (let i = 0; i < limitedDigits.length; i += 2) {
        if (i > 0) formatted += '-';
        formatted += limitedDigits.slice(i, i + 2);
      }
      return formatted;
    }
    
    return limitedDigits;
  }

  onCountryChange(country: Country) {
    this.selectedCountry = country;
    this.signupForm.patchValue({ countryCode: country.dialCode });
    this.showCountryDropdown = false;
    this.signupForm.patchValue({ mobileNumber: '' });
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

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    
    return null;
  }

  onSubmit() {
    if (this.signupForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      // Extract only digits from formatted phone number
      const phoneDigits = this.signupForm.value.mobileNumber.replace(/\D/g, '');
      
      const registerData = {
        fullName: this.signupForm.value.fullName,
        countryCode: this.signupForm.value.countryCode,
        mobileNumber: phoneDigits,
        password: this.signupForm.value.password,
        confirmPassword: this.signupForm.value.confirmPassword
      };
      
      this.authService.register(registerData).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            // Store token if needed
            if (response.token) {
              localStorage.setItem('token', response.token);
            }
            // Navigate to login
            this.router.navigate(['/login']);
          } else {
            this.errorMessage = response.message;
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'An error occurred during registration';
        }
      });
    }
  }
}

