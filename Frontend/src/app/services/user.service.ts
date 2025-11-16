import { Injectable } from '@angular/core';

export interface User {
  fullName: string;
  countryCode: string;
  mobileNumber: string;
  mobile: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private currentUser: User | null = null;

  setUser(user: User): void {
    this.currentUser = user;
  }

  getUser(): User | null {
    return this.currentUser;
  }

  clearUser(): void {
    this.currentUser = null;
  }
}

