import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { currentUser, clearUser, setUser } from '../../models/user.model';

interface StorePrice {
  store: string;
  price: number;
  distance: number;
}

interface GroceryItem {
  id: number;
  name: string;
  image: string;
  category: string;
  price: number;
  categoryTag: string;
  size?: string;
  storePrices: StorePrice[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  searchQuery: string = '';
  selectedCategory: string = 'All';
  showFilterDropdown: boolean = false;
  locationZipcode: string = '';
  isLocationLoading: boolean = false;
  selectedSort: string = '';
  showSidebar: boolean = false; // Toggle sidebar visibility
  selectedStores: { [key: string]: boolean } = {};
  isFilterActive: boolean = false;
  showZipcodePopup: boolean = false;
  zipcodeInput: string = '';
  selectedProduct: GroceryItem | null = null;
  showPriceComparison: boolean = false;
  selectedStore: StorePrice | null = null;
  showStoreDetails: boolean = false;
  showAddToListConfirmation: boolean = false;
  myListCount: number = 0;
  addedProducts: Set<string> = new Set(); // Track added products (productId-store combination)
  showMyList: boolean = false; // Toggle between product grid and my list view
  myListItems: any[] = []; // Store list items with full details
  showRemoveConfirmation: boolean = false; // Show remove confirmation message
  showReceipts: boolean = false; // Toggle between product grid and receipts view
  receipts: any[] = []; // Store uploaded receipts
  showDeleteReceiptConfirmation: boolean = false; // Show delete receipt confirmation popup
  showDeleteReceiptSuccess: boolean = false; // Show delete receipt success message
  receiptToDelete: number | null = null; // Store receipt ID to delete
  showMembershipSaveConfirmation: boolean = false; // Show membership save confirmation popup
  showCamera: boolean = false; // Toggle camera view
  videoStream: MediaStream | null = null; // Camera stream
  userName: string = ''; // Logged in user name
  showProfile: boolean = false; // Toggle between product grid and profile view
  userMobile: string = ''; // User mobile number
  showChangePassword: boolean = false; // Toggle change password form
  changePasswordForm!: FormGroup;
  showCurrentPassword: boolean = false;
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;
  changePasswordError: string = '';
  showMyMemberships: boolean = false; // Toggle my memberships form
  selectedMembershipStore: string = ''; // Selected store for membership
  membershipForm!: FormGroup;
  savedMemberships: any[] = []; // Store saved memberships
  
  stores: string[] = ['Walmart', 'Kroger', 'Aldi', "Busch's", "Meijer's", 'Costco'];
  storeDistances: { [key: string]: number } = {}; // Store consistent distances for each store
  private navigationSubscription?: Subscription;

  constructor(
    private router: Router,
    private fb: FormBuilder
  ) {
    // Listen to browser back/forward navigation and redirect to login
    this.navigationSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // If user navigates away and comes back without being logged in, redirect to login
      if (!currentUser) {
        this.router.navigate(['/login'], { replaceUrl: true });
      }
    });
  }

  categories: string[] = [
    'All Products',
    'Fruits',
    'Vegetables',
    'Drinks & Beverages',
    'Pantry',
    'Dairy & Eggs',
    'Bakery',
    'Meat & Seafood',
    'Kitchen Utensils'
  ];

  originalGroceryItems: GroceryItem[] = []; // Backup of original grocery items
  groceryItems: GroceryItem[] = [
    { 
      id: 1, 
      name: 'Fresh Red Apples', 
      image: '🍎', 
      category: 'Fruits', 
      price: 2.74, 
      categoryTag: 'Fruits',
      size: '2 lb',
      storePrices: [
        { store: 'Costco', price: 2.74, distance: 1.4 },
        { store: 'Walmart', price: 2.94, distance: 2.5 },
        { store: 'Aldi', price: 3.49, distance: 4.4 },
        { store: "Meijer's", price: 3.99, distance: 3.1 },
        { store: 'Kroger', price: 4.99, distance: 4.2 }
      ]
    },
    { 
      id: 2, 
      name: 'Organic Vegetables Mix', 
      image: '🥬', 
      category: 'Vegetables', 
      price: 3.84, 
      categoryTag: 'Vegetables',
      size: '1 Pack',
      storePrices: [
        { store: 'Costco', price: 3.84, distance: 1.4 },
        { store: 'Walmart', price: 4.84, distance: 2.5 },
        { store: 'Aldi', price: 5.29, distance: 4.4 },
        { store: "Meijer's", price: 6.99, distance: 3.1 }
      ]
    },
    { 
      id: 3, 
      name: 'Fresh Orange Juice', 
      image: '🧃', 
      category: 'Drinks', 
      price: 3.02, 
      categoryTag: 'Drinks',
      size: '32 fl oz',
      storePrices: [
        { store: 'Costco', price: 3.02, distance: 1.4 },
        { store: 'Walmart', price: 4.02, distance: 2.5 },
        { store: 'Aldi', price: 4.54, distance: 4.4 },
        { store: "Meijer's", price: 5.49, distance: 3.1 },
        { store: 'Kroger', price: 6.49, distance: 4.2 }
      ]
    },
    { 
      id: 4, 
      name: 'Artisan Sourdough Bread', 
      image: '🍞', 
      category: 'Bakery', 
      price: 2.19, 
      categoryTag: 'Bakery',
      size: '1 loaf',
      storePrices: [
        { store: 'Costco', price: 5.19, distance: 1.4 },
        { store: 'Walmart', price: 2.19, distance: 2.5 },
        { store: 'Aldi', price: 3.59, distance: 4.4 },
        { store: "Meijer's", price: 4.99, distance: 3.1 },
        { store: 'Kroger', price: 3.79, distance: 4.2 }
      ]
    },
    { 
      id: 5, 
      name: 'Organic Whole Milk', 
      image: '🥛', 
      category: 'Dairy', 
      price: 2.47, 
      categoryTag: 'Dairy',
      size: '48 fl oz',
      storePrices: [
        { store: 'Costco', price: 2.47, distance: 1.4 },
        { store: 'Walmart', price: 2.67, distance: 2.5 },
        { store: 'Aldi', price: 3.84, distance: 4.4 },
        { store: "Meijer's", price: 4.29, distance: 3.1 },
        { store: 'Kroger', price: 4.59, distance: 4.2 }
      ]
    },
    { 
      id: 6, 
      name: 'Italian Pasta Collection', 
      image: '🍝', 
      category: 'Pantry', 
      price: 4.39, 
      categoryTag: 'Pantry',
      size: '16 oz',
      storePrices: [
        { store: 'Walmart', price: 4.39, distance: 2.5 },
        { store: 'Aldi', price: 6.89, distance: 4.4 },
        { store: "Meijer's", price: 7.49, distance: 3.1 },
        { store: 'Kroger', price: 7.79, distance: 4.2 }
      ]
    },
    { 
      id: 7, 
      name: 'Bananas (1 lb)', 
      image: '🍌', 
      category: 'Fruits', 
      price: 1.09, 
      categoryTag: 'Fruits',
      size: '1 lb',
      storePrices: [
        { store: 'Costco', price: 1.09, distance: 1.4 },
        { store: 'Walmart', price: 1.19, distance: 2.5 },
        { store: 'Aldi', price: 1.69, distance: 4.4 },
        { store: 'Kroger', price: 1.89, distance: 4.2 }
      ]
    },
    { 
      id: 8, 
      name: 'Fresh Spinach', 
      image: '🥬', 
      category: 'Vegetables', 
      price: 1.92, 
      categoryTag: 'Vegetables',
      size: '10 oz',
      storePrices: [
        { store: 'Costco', price: 1.92, distance: 1.4 },
        { store: 'Walmart', price: 2.12, distance: 2.5 },
        { store: 'Aldi', price: 2.94, distance: 4.4 },
        { store: "Meijer's", price: 3.29, distance: 3.1 },
        { store: 'Kroger', price: 3.39, distance: 4.2 }
      ]
    },
    { 
      id: 9, 
      name: 'Fresh Strawberries', 
      image: '🍓', 
      category: 'Fruits', 
      price: 3.29, 
      categoryTag: 'Fruits',
      size: '1 lb',
      storePrices: [
        { store: 'Costco', price: 3.29, distance: 1.4 },
        { store: 'Walmart', price: 3.49, distance: 2.5 },
        { store: 'Aldi', price: 5.19, distance: 4.4 },
        { store: 'Kroger', price: 5.79, distance: 4.2 }
      ]
    },
    { 
      id: 10, 
      name: 'Carrots Bundle', 
      image: '🥕', 
      category: 'Vegetables', 
      price: 1.64, 
      categoryTag: 'Vegetables',
      size: '1 lb',
      storePrices: [
        { store: 'Costco', price: 1.64, distance: 1.4 },
        { store: 'Walmart', price: 1.74, distance: 2.5 },
        { store: 'Aldi', price: 2.59, distance: 4.4 },
        { store: "Meijer's", price: 2.89, distance: 3.1 },
        { store: 'Kroger', price: 2.99, distance: 4.2 }
      ]
    },
    { 
      id: 11, 
      name: 'Sparkling Water', 
      image: '💧', 
      category: 'Drinks', 
      price: 2.19, 
      categoryTag: 'Drinks',
      size: '33.8 fl oz',
      storePrices: [
        { store: 'Walmart', price: 2.19, distance: 2.5 },
        { store: 'Aldi', price: 3.49, distance: 4.4 },
        { store: "Meijer's", price: 3.79, distance: 3.1 },
        { store: 'Kroger', price: 3.89, distance: 4.2 }
      ]
    },
    { 
      id: 12, 
      name: 'Whole Wheat Bread', 
      image: '🍞', 
      category: 'Bakery', 
      price: 2.19, 
      categoryTag: 'Bakery',
      size: '1 loaf',
      storePrices: [
        { store: 'Costco', price: 5.19, distance: 1.4 },
        { store: 'Walmart', price: 2.19, distance: 2.5 },
        { store: 'Aldi', price: 3.89, distance: 4.4 },
        { store: "Meijer's", price: 4.99, distance: 3.1 },
        { store: 'Kroger', price: 3.79, distance: 4.2 }
      ]
    },
    { 
      id: 13, 
      name: 'Free Range Eggs', 
      image: '🥚', 
      category: 'Dairy', 
      price: 3.29, 
      categoryTag: 'Dairy',
      size: '12 count',
      storePrices: [
        { store: 'Costco', price: 3.29, distance: 1.4 },
        { store: 'Walmart', price: 3.49, distance: 2.5 },
        { store: 'Aldi', price: 5.19, distance: 4.4 },
        { store: "Meijer's", price: 5.79, distance: 3.1 },
        { store: 'Kroger', price: 5.89, distance: 4.2 }
      ]
    },
    { 
      id: 14, 
      name: 'Premium Rice', 
      image: '🍚', 
      category: 'Pantry', 
      price: 4.94, 
      categoryTag: 'Pantry',
      size: '5 lb',
      storePrices: [
        { store: 'Costco', price: 4.94, distance: 1.4 },
        { store: 'Walmart', price: 5.14, distance: 2.5 },
        { store: 'Aldi', price: 7.89, distance: 4.4 },
        { store: 'Kroger', price: 8.79, distance: 4.2 }
      ]
    },
    { 
      id: 15, 
      name: 'Fresh Tomatoes', 
      image: '🍅', 
      category: 'Vegetables', 
      price: 2.47, 
      categoryTag: 'Vegetables',
      size: '1 lb',
      storePrices: [
        { store: 'Costco', price: 2.47, distance: 1.4 },
        { store: 'Walmart', price: 2.67, distance: 2.5 },
        { store: 'Aldi', price: 3.94, distance: 4.4 },
        { store: "Meijer's", price: 4.29, distance: 3.1 },
        { store: 'Kroger', price: 4.39, distance: 4.2 }
      ]
    },
    { 
      id: 16, 
      name: 'Organic Oranges', 
      image: '🍊', 
      category: 'Fruits', 
      price: 2.19, 
      categoryTag: 'Fruits',
      size: '1 lb',
      storePrices: [
        { store: 'Walmart', price: 2.19, distance: 2.5 },
        { store: 'Aldi', price: 3.49, distance: 4.4 },
        { store: "Meijer's", price: 3.79, distance: 3.1 },
        { store: 'Kroger', price: 3.89, distance: 4.2 }
      ]
    },
    { 
      id: 17, 
      name: 'Fresh Salmon Fillet', 
      image: '🐟', 
      category: 'Meat', 
      price: 8.99, 
      categoryTag: 'Meat & Seafood',
      size: '1 lb',
      storePrices: [
        { store: 'Costco', price: 8.99, distance: 1.4 },
        { store: 'Walmart', price: 9.99, distance: 2.5 },
        { store: 'Aldi', price: 11.49, distance: 4.4 },
        { store: "Meijer's", price: 12.99, distance: 3.1 },
        { store: 'Kroger', price: 13.49, distance: 4.2 }
      ]
    },
    { 
      id: 18, 
      name: 'Ground Beef', 
      image: '🥩', 
      category: 'Meat', 
      price: 4.99, 
      categoryTag: 'Meat & Seafood',
      size: '1 lb',
      storePrices: [
        { store: 'Costco', price: 4.99, distance: 1.4 },
        { store: 'Walmart', price: 5.49, distance: 2.5 },
        { store: 'Aldi', price: 6.99, distance: 4.4 },
        { store: "Meijer's", price: 7.49, distance: 3.1 },
        { store: 'Kroger', price: 7.99, distance: 4.2 }
      ]
    },
    { 
      id: 19, 
      name: 'Chicken Breast', 
      image: '🍗', 
      category: 'Meat', 
      price: 3.99, 
      categoryTag: 'Meat & Seafood',
      size: '1 lb',
      storePrices: [
        { store: 'Costco', price: 3.99, distance: 1.4 },
        { store: 'Walmart', price: 4.49, distance: 2.5 },
        { store: 'Aldi', price: 5.99, distance: 4.4 },
        { store: "Meijer's", price: 6.49, distance: 3.1 },
        { store: 'Kroger', price: 6.99, distance: 4.2 }
      ]
    },
    { 
      id: 20, 
      name: 'Fresh Shrimp', 
      image: '🦐', 
      category: 'Meat', 
      price: 7.49, 
      categoryTag: 'Meat & Seafood',
      size: '1 lb',
      storePrices: [
        { store: 'Walmart', price: 7.49, distance: 2.5 },
        { store: 'Aldi', price: 8.99, distance: 4.4 },
        { store: "Meijer's", price: 9.99, distance: 3.1 },
        { store: 'Kroger', price: 10.49, distance: 4.2 }
      ]
    },
    { 
      id: 21, 
      name: 'Pork Chops', 
      image: '🥓', 
      category: 'Meat', 
      price: 5.49, 
      categoryTag: 'Meat & Seafood',
      size: '1 lb',
      storePrices: [
        { store: 'Costco', price: 5.49, distance: 1.4 },
        { store: 'Walmart', price: 6.49, distance: 2.5 },
        { store: 'Aldi', price: 7.99, distance: 4.4 },
        { store: "Meijer's", price: 8.49, distance: 3.1 },
        { store: 'Kroger', price: 8.99, distance: 4.2 }
      ]
    },
    { 
      id: 22, 
      name: 'Tuna Steaks', 
      image: '🐟', 
      category: 'Meat', 
      price: 9.99, 
      categoryTag: 'Meat & Seafood',
      size: '1 lb',
      storePrices: [
        { store: 'Costco', price: 9.99, distance: 1.4 },
        { store: 'Walmart', price: 11.49, distance: 2.5 },
        { store: 'Aldi', price: 12.99, distance: 4.4 },
        { store: 'Kroger', price: 13.99, distance: 4.2 }
      ]
    },
    { 
      id: 23, 
      name: 'Cooking Knife Set', 
      image: '🔪', 
      category: 'Utensils', 
      price: 24.99, 
      categoryTag: 'Kitchen Utensils',
      size: '5 pieces',
      storePrices: [
        { store: 'Walmart', price: 24.99, distance: 2.5 },
        { store: 'Aldi', price: 29.99, distance: 4.4 },
        { store: "Meijer's", price: 34.99, distance: 3.1 },
        { store: 'Kroger', price: 32.99, distance: 4.2 }
      ]
    },
    { 
      id: 24, 
      name: 'Non-Stick Frying Pan', 
      image: '🍳', 
      category: 'Utensils', 
      price: 19.99, 
      categoryTag: 'Kitchen Utensils',
      size: '10 inch',
      storePrices: [
        { store: 'Costco', price: 19.99, distance: 1.4 },
        { store: 'Walmart', price: 22.99, distance: 2.5 },
        { store: 'Aldi', price: 27.99, distance: 4.4 },
        { store: "Meijer's", price: 29.99, distance: 3.1 },
        { store: 'Kroger', price: 28.99, distance: 4.2 }
      ]
    },
    { 
      id: 25, 
      name: 'Cutting Board Set', 
      image: '🪵', 
      category: 'Utensils', 
      price: 14.99, 
      categoryTag: 'Kitchen Utensils',
      size: '3 pieces',
      storePrices: [
        { store: 'Walmart', price: 14.99, distance: 2.5 },
        { store: 'Aldi', price: 18.99, distance: 4.4 },
        { store: "Meijer's", price: 19.99, distance: 3.1 },
        { store: 'Kroger', price: 21.99, distance: 4.2 }
      ]
    },
    { 
      id: 26, 
      name: 'Mixing Bowl Set', 
      image: '🥣', 
      category: 'Utensils', 
      price: 16.99, 
      categoryTag: 'Kitchen Utensils',
      size: '5 pieces',
      storePrices: [
        { store: 'Costco', price: 16.99, distance: 1.4 },
        { store: 'Walmart', price: 19.99, distance: 2.5 },
        { store: 'Aldi', price: 24.99, distance: 4.4 },
        { store: 'Kroger', price: 26.99, distance: 4.2 }
      ]
    },
    { 
      id: 27, 
      name: 'Spatula Set', 
      image: '🥄', 
      category: 'Utensils', 
      price: 9.99, 
      categoryTag: 'Kitchen Utensils',
      size: '3 pieces',
      storePrices: [
        { store: 'Walmart', price: 9.99, distance: 2.5 },
        { store: 'Aldi', price: 12.99, distance: 4.4 },
        { store: "Meijer's", price: 13.99, distance: 3.1 },
        { store: 'Kroger', price: 14.99, distance: 4.2 }
      ]
    },
    { 
      id: 28, 
      name: 'Fresh Grapes', 
      image: '🍇', 
      category: 'Fruits', 
      price: 3.49, 
      categoryTag: 'Fruits',
      size: '1 lb',
      storePrices: [
        { store: 'Costco', price: 3.49, distance: 1.4 },
        { store: 'Walmart', price: 3.99, distance: 2.5 },
        { store: 'Aldi', price: 4.49, distance: 4.4 },
        { store: "Meijer's", price: 4.99, distance: 3.1 },
        { store: 'Kroger', price: 5.29, distance: 4.2 }
      ]
    },
    { 
      id: 29, 
      name: 'Blueberries', 
      image: '🫐', 
      category: 'Fruits', 
      price: 4.99, 
      categoryTag: 'Fruits',
      size: '6 oz',
      storePrices: [
        { store: 'Costco', price: 4.99, distance: 1.4 },
        { store: 'Walmart', price: 5.49, distance: 2.5 },
        { store: 'Aldi', price: 6.99, distance: 4.4 },
        { store: "Meijer's", price: 7.49, distance: 3.1 },
        { store: 'Kroger', price: 7.99, distance: 4.2 }
      ]
    },
    { 
      id: 30, 
      name: 'Fresh Pineapple', 
      image: '🍍', 
      category: 'Fruits', 
      price: 2.99, 
      categoryTag: 'Fruits',
      size: '1 each',
      storePrices: [
        { store: 'Costco', price: 2.99, distance: 1.4 },
        { store: 'Walmart', price: 3.49, distance: 2.5 },
        { store: 'Aldi', price: 3.99, distance: 4.4 },
        { store: "Meijer's", price: 4.49, distance: 3.1 },
        { store: 'Kroger', price: 4.79, distance: 4.2 }
      ]
    },
    { 
      id: 31, 
      name: 'Fresh Broccoli', 
      image: '🥦', 
      category: 'Vegetables', 
      price: 1.99, 
      categoryTag: 'Vegetables',
      size: '1 lb',
      storePrices: [
        { store: 'Costco', price: 1.99, distance: 1.4 },
        { store: 'Walmart', price: 2.29, distance: 2.5 },
        { store: 'Aldi', price: 2.79, distance: 4.4 },
        { store: "Meijer's", price: 3.09, distance: 3.1 },
        { store: 'Kroger', price: 3.29, distance: 4.2 }
      ]
    },
    { 
      id: 32, 
      name: 'Bell Peppers', 
      image: '🫑', 
      category: 'Vegetables', 
      price: 2.49, 
      categoryTag: 'Vegetables',
      size: '3 pack',
      storePrices: [
        { store: 'Costco', price: 2.49, distance: 1.4 },
        { store: 'Walmart', price: 2.99, distance: 2.5 },
        { store: 'Aldi', price: 3.49, distance: 4.4 },
        { store: "Meijer's", price: 3.99, distance: 3.1 },
        { store: 'Kroger', price: 4.19, distance: 4.2 }
      ]
    },
    { 
      id: 33, 
      name: 'Cauliflower', 
      image: '🥬', 
      category: 'Vegetables', 
      price: 2.79, 
      categoryTag: 'Vegetables',
      size: '1 head',
      storePrices: [
        { store: 'Costco', price: 2.79, distance: 1.4 },
        { store: 'Walmart', price: 3.29, distance: 2.5 },
        { store: 'Aldi', price: 3.79, distance: 4.4 },
        { store: "Meijer's", price: 4.29, distance: 3.1 },
        { store: 'Kroger', price: 4.49, distance: 4.2 }
      ]
    },
    { 
      id: 34, 
      name: 'Chicken Wings', 
      image: '🍗', 
      category: 'Meat', 
      price: 4.99, 
      categoryTag: 'Meat & Seafood',
      size: '2 lb',
      storePrices: [
        { store: 'Costco', price: 4.99, distance: 1.4 },
        { store: 'Walmart', price: 5.99, distance: 2.5 },
        { store: 'Aldi', price: 6.99, distance: 4.4 },
        { store: "Meijer's", price: 7.49, distance: 3.1 },
        { store: 'Kroger', price: 7.99, distance: 4.2 }
      ]
    },
    { 
      id: 35, 
      name: 'Chicken Thighs', 
      image: '🍗', 
      category: 'Meat', 
      price: 3.49, 
      categoryTag: 'Meat & Seafood',
      size: '1 lb',
      storePrices: [
        { store: 'Costco', price: 3.49, distance: 1.4 },
        { store: 'Walmart', price: 3.99, distance: 2.5 },
        { store: 'Aldi', price: 4.99, distance: 4.4 },
        { store: "Meijer's", price: 5.49, distance: 3.1 },
        { store: 'Kroger', price: 5.99, distance: 4.2 }
      ]
    },
    { 
      id: 36, 
      name: 'Organic Chicken Breast', 
      image: '🍗', 
      category: 'Meat', 
      price: 5.99, 
      categoryTag: 'Meat & Seafood',
      size: '1 lb',
      storePrices: [
        { store: 'Costco', price: 5.99, distance: 1.4 },
        { store: 'Walmart', price: 6.99, distance: 2.5 },
        { store: 'Aldi', price: 7.99, distance: 4.4 },
        { store: "Meijer's", price: 8.49, distance: 3.1 },
        { store: 'Kroger', price: 8.99, distance: 4.2 }
      ]
    },
    { 
      id: 37, 
      name: 'Fresh Crabs', 
      image: '🦀', 
      category: 'Meat', 
      price: 12.99, 
      categoryTag: 'Meat & Seafood',
      size: '1 lb',
      storePrices: [
        { store: 'Costco', price: 12.99, distance: 1.4 },
        { store: 'Walmart', price: 14.99, distance: 2.5 },
        { store: 'Aldi', price: 16.99, distance: 4.4 },
        { store: "Meijer's", price: 17.99, distance: 3.1 },
        { store: 'Kroger', price: 18.99, distance: 4.2 }
      ]
    },
    { 
      id: 38, 
      name: 'Fresh Mushrooms', 
      image: '🍄', 
      category: 'Vegetables', 
      price: 2.99, 
      categoryTag: 'Vegetables',
      size: '8 oz',
      storePrices: [
        { store: 'Costco', price: 2.99, distance: 1.4 },
        { store: 'Walmart', price: 3.49, distance: 2.5 },
        { store: 'Aldi', price: 3.99, distance: 4.4 },
        { store: "Meijer's", price: 4.49, distance: 3.1 },
        { store: 'Kroger', price: 4.79, distance: 4.2 }
      ]
    },
    { 
      id: 39, 
      name: 'Fresh Cucumber', 
      image: '🥒', 
      category: 'Vegetables', 
      price: 1.49, 
      categoryTag: 'Vegetables',
      size: '1 lb',
      storePrices: [
        { store: 'Costco', price: 1.49, distance: 1.4 },
        { store: 'Walmart', price: 1.79, distance: 2.5 },
        { store: 'Aldi', price: 2.19, distance: 4.4 },
        { store: "Meijer's", price: 2.49, distance: 3.1 },
        { store: 'Kroger', price: 2.69, distance: 4.2 }
      ]
    },
    { 
      id: 40, 
      name: 'Yellow Onions', 
      image: '🧅', 
      category: 'Vegetables', 
      price: 1.29, 
      categoryTag: 'Vegetables',
      size: '3 lb',
      storePrices: [
        { store: 'Costco', price: 1.29, distance: 1.4 },
        { store: 'Walmart', price: 1.59, distance: 2.5 },
        { store: 'Aldi', price: 1.99, distance: 4.4 },
        { store: "Meijer's", price: 2.29, distance: 3.1 },
        { store: 'Kroger', price: 2.49, distance: 4.2 }
      ]
    },
    { 
      id: 41, 
      name: 'Russet Potatoes', 
      image: '🥔', 
      category: 'Vegetables', 
      price: 2.99, 
      categoryTag: 'Vegetables',
      size: '5 lb',
      storePrices: [
        { store: 'Costco', price: 2.99, distance: 1.4 },
        { store: 'Walmart', price: 3.49, distance: 2.5 },
        { store: 'Aldi', price: 3.99, distance: 4.4 },
        { store: "Meijer's", price: 4.49, distance: 3.1 },
        { store: 'Kroger', price: 4.79, distance: 4.2 }
      ]
    },
    { 
      id: 42, 
      name: 'Fresh Avocado', 
      image: '🥑', 
      category: 'Fruits', 
      price: 1.99, 
      categoryTag: 'Fruits',
      size: '1 each',
      storePrices: [
        { store: 'Costco', price: 1.99, distance: 1.4 },
        { store: 'Walmart', price: 2.29, distance: 2.5 },
        { store: 'Aldi', price: 2.79, distance: 4.4 },
        { store: "Meijer's", price: 3.09, distance: 3.1 },
        { store: 'Kroger', price: 3.29, distance: 4.2 }
      ]
    },
    { 
      id: 43, 
      name: 'Jasmine Rice Bag', 
      image: '🍚', 
      category: 'Pantry', 
      price: 6.99, 
      categoryTag: 'Pantry',
      size: '10 lb',
      storePrices: [
        { store: 'Costco', price: 6.99, distance: 1.4 },
        { store: 'Walmart', price: 7.99, distance: 2.5 },
        { store: 'Aldi', price: 8.99, distance: 4.4 },
        { store: "Meijer's", price: 9.49, distance: 3.1 },
        { store: 'Kroger', price: 9.99, distance: 4.2 }
      ]
    },
    { 
      id: 44, 
      name: 'Instant Noodles Pack', 
      image: '🍜', 
      category: 'Pantry', 
      price: 3.99, 
      categoryTag: 'Pantry',
      size: '12 pack',
      storePrices: [
        { store: 'Costco', price: 3.99, distance: 1.4 },
        { store: 'Walmart', price: 4.49, distance: 2.5 },
        { store: 'Aldi', price: 4.99, distance: 4.4 },
        { store: "Meijer's", price: 5.49, distance: 3.1 },
        { store: 'Kroger', price: 5.99, distance: 4.2 }
      ]
    },
    { 
      id: 45, 
      name: 'All-Purpose Flour', 
      image: '🌾', 
      category: 'Pantry', 
      price: 2.99, 
      categoryTag: 'Pantry',
      size: '5 lb',
      storePrices: [
        { store: 'Costco', price: 2.99, distance: 1.4 },
        { store: 'Walmart', price: 3.49, distance: 2.5 },
        { store: 'Aldi', price: 3.99, distance: 4.4 },
        { store: "Meijer's", price: 4.29, distance: 3.1 },
        { store: 'Kroger', price: 4.49, distance: 4.2 }
      ]
    },
    { 
      id: 46, 
      name: 'Olive Oil', 
      image: '🫒', 
      category: 'Pantry', 
      price: 7.99, 
      categoryTag: 'Pantry',
      size: '33.8 fl oz',
      storePrices: [
        { store: 'Costco', price: 7.99, distance: 1.4 },
        { store: 'Walmart', price: 8.99, distance: 2.5 },
        { store: 'Aldi', price: 9.99, distance: 4.4 },
        { store: "Meijer's", price: 10.49, distance: 3.1 },
        { store: 'Kroger', price: 10.99, distance: 4.2 }
      ]
    },
    { 
      id: 47, 
      name: 'Canned Beans', 
      image: '🥫', 
      category: 'Pantry', 
      price: 1.49, 
      categoryTag: 'Pantry',
      size: '15 oz',
      storePrices: [
        { store: 'Costco', price: 1.49, distance: 1.4 },
        { store: 'Walmart', price: 1.79, distance: 2.5 },
        { store: 'Aldi', price: 1.99, distance: 4.4 },
        { store: "Meijer's", price: 2.29, distance: 3.1 },
        { store: 'Kroger', price: 2.49, distance: 4.2 }
      ]
    },
    { 
      id: 48, 
      name: 'Royal Sona Masoori Rice Bag', 
      image: '🍚', 
      category: 'Pantry', 
      price: 12.99, 
      categoryTag: 'Pantry',
      size: '25 lb',
      storePrices: [
        { store: 'Costco', price: 12.99, distance: 1.4 },
        { store: 'Walmart', price: 14.99, distance: 2.5 },
        { store: 'Aldi', price: 15.99, distance: 4.4 },
        { store: "Meijer's", price: 16.99, distance: 3.1 },
        { store: 'Kroger', price: 17.99, distance: 4.2 }
      ]
    },
    { 
      id: 49, 
      name: 'Premium Beer 6-Pack', 
      image: '🍺', 
      category: 'Drinks', 
      price: 8.99, 
      categoryTag: 'Drinks',
      size: '6 bottles',
      storePrices: [
        { store: 'Costco', price: 8.99, distance: 1.4 },
        { store: 'Walmart', price: 9.99, distance: 2.5 },
        { store: 'Aldi', price: 10.99, distance: 4.4 },
        { store: "Meijer's", price: 11.49, distance: 3.1 },
        { store: 'Kroger', price: 11.99, distance: 4.2 }
      ]
    },
    { 
      id: 50, 
      name: 'Red Wine Bottle', 
      image: '🍷', 
      category: 'Drinks', 
      price: 12.99, 
      categoryTag: 'Drinks',
      size: '750 ml',
      storePrices: [
        { store: 'Costco', price: 12.99, distance: 1.4 },
        { store: 'Walmart', price: 14.99, distance: 2.5 },
        { store: 'Aldi', price: 15.99, distance: 4.4 },
        { store: "Meijer's", price: 16.99, distance: 3.1 },
        { store: 'Kroger', price: 17.99, distance: 4.2 }
      ]
    },
    { 
      id: 51, 
      name: 'White Wine Bottle', 
      image: '🥂', 
      category: 'Drinks', 
      price: 11.99, 
      categoryTag: 'Drinks',
      size: '750 ml',
      storePrices: [
        { store: 'Costco', price: 11.99, distance: 1.4 },
        { store: 'Walmart', price: 13.99, distance: 2.5 },
        { store: 'Aldi', price: 14.99, distance: 4.4 },
        { store: "Meijer's", price: 15.99, distance: 3.1 },
        { store: 'Kroger', price: 16.99, distance: 4.2 }
      ]
    },
    { 
      id: 52, 
      name: 'Premium Whiskey', 
      image: '🥃', 
      category: 'Drinks', 
      price: 24.99, 
      categoryTag: 'Drinks',
      size: '750 ml',
      storePrices: [
        { store: 'Costco', price: 24.99, distance: 1.4 },
        { store: 'Walmart', price: 27.99, distance: 2.5 },
        { store: 'Aldi', price: 29.99, distance: 4.4 },
        { store: "Meijer's", price: 31.99, distance: 3.1 },
        { store: 'Kroger', price: 32.99, distance: 4.2 }
      ]
    },
    { 
      id: 53, 
      name: 'Tequila Bottle', 
      image: '🍸', 
      category: 'Drinks', 
      price: 19.99, 
      categoryTag: 'Drinks',
      size: '750 ml',
      storePrices: [
        { store: 'Costco', price: 19.99, distance: 1.4 },
        { store: 'Walmart', price: 22.99, distance: 2.5 },
        { store: 'Aldi', price: 24.99, distance: 4.4 },
        { store: "Meijer's", price: 26.99, distance: 3.1 },
        { store: 'Kroger', price: 27.99, distance: 4.2 }
      ]
    },
    { 
      id: 54, 
      name: 'Vodka Bottle', 
      image: '🍸', 
      category: 'Drinks', 
      price: 16.99, 
      categoryTag: 'Drinks',
      size: '750 ml',
      storePrices: [
        { store: 'Costco', price: 16.99, distance: 1.4 },
        { store: 'Walmart', price: 18.99, distance: 2.5 },
        { store: 'Aldi', price: 19.99, distance: 4.4 },
        { store: "Meijer's", price: 21.99, distance: 3.1 },
        { store: 'Kroger', price: 22.99, distance: 4.2 }
      ]
    },
    { 
      id: 55, 
      name: 'Rum Bottle', 
      image: '🥃', 
      category: 'Drinks', 
      price: 17.99, 
      categoryTag: 'Drinks',
      size: '750 ml',
      storePrices: [
        { store: 'Costco', price: 17.99, distance: 1.4 },
        { store: 'Walmart', price: 19.99, distance: 2.5 },
        { store: 'Aldi', price: 21.99, distance: 4.4 },
        { store: "Meijer's", price: 22.99, distance: 3.1 },
        { store: 'Kroger', price: 23.99, distance: 4.2 }
      ]
    },
    { 
      id: 56, 
      name: 'Gin Bottle', 
      image: '🍸', 
      category: 'Drinks', 
      price: 18.99, 
      categoryTag: 'Drinks',
      size: '750 ml',
      storePrices: [
        { store: 'Costco', price: 18.99, distance: 1.4 },
        { store: 'Walmart', price: 20.99, distance: 2.5 },
        { store: 'Aldi', price: 22.99, distance: 4.4 },
        { store: "Meijer's", price: 23.99, distance: 3.1 },
        { store: 'Kroger', price: 24.99, distance: 4.2 }
      ]
    },
    { 
      id: 57, 
      name: 'Champagne Bottle', 
      image: '🍾', 
      category: 'Drinks', 
      price: 19.99, 
      categoryTag: 'Drinks',
      size: '750 ml',
      storePrices: [
        { store: 'Costco', price: 19.99, distance: 1.4 },
        { store: 'Walmart', price: 22.99, distance: 2.5 },
        { store: 'Aldi', price: 24.99, distance: 4.4 },
        { store: "Meijer's", price: 25.99, distance: 3.1 },
        { store: 'Kroger', price: 26.99, distance: 4.2 }
      ]
    },
    { 
      id: 58, 
      name: 'Craft Beer 12-Pack', 
      image: '🍺', 
      category: 'Drinks', 
      price: 15.99, 
      categoryTag: 'Drinks',
      size: '12 bottles',
      storePrices: [
        { store: 'Costco', price: 15.99, distance: 1.4 },
        { store: 'Walmart', price: 17.99, distance: 2.5 },
        { store: 'Aldi', price: 18.99, distance: 4.4 },
        { store: "Meijer's", price: 19.99, distance: 3.1 },
        { store: 'Kroger', price: 20.99, distance: 4.2 }
      ]
    },
    { 
      id: 59, 
      name: 'Chocolate Chip Cookies', 
      image: '🍪', 
      category: 'Bakery', 
      price: 3.99, 
      categoryTag: 'Bakery',
      size: '1 pack',
      storePrices: [
        { store: 'Costco', price: 3.99, distance: 1.4 },
        { store: 'Walmart', price: 4.49, distance: 2.5 },
        { store: 'Aldi', price: 4.99, distance: 4.4 },
        { store: "Meijer's", price: 5.49, distance: 3.1 },
        { store: 'Kroger', price: 5.99, distance: 4.2 }
      ]
    },
    { 
      id: 60, 
      name: 'Fresh Croissants', 
      image: '🥐', 
      category: 'Bakery', 
      price: 4.99, 
      categoryTag: 'Bakery',
      size: '6 pieces',
      storePrices: [
        { store: 'Costco', price: 4.99, distance: 1.4 },
        { store: 'Walmart', price: 5.99, distance: 2.5 },
        { store: 'Aldi', price: 6.49, distance: 4.4 },
        { store: "Meijer's", price: 6.99, distance: 3.1 },
        { store: 'Kroger', price: 7.49, distance: 4.2 }
      ]
    }
  ];

  filteredItems: GroceryItem[] = [];

  ngOnInit() {
    // Check localStorage first to initialize user if needed
    const storedUser = localStorage.getItem('userData');
    if (storedUser && !currentUser) {
      // Initialize user from localStorage if not already loaded
      const userData = JSON.parse(storedUser);
      setUser(userData);
    }
    
    // Strict guard check - redirect to login if user is not logged in (handles hot reload)
    // Also check localStorage for data consistency
    if (!currentUser || !storedUser) {
      // Clear any stale data and redirect to login
      clearUser();
      this.router.navigate(['/login'], { replaceUrl: true });
      return;
    }

    this.selectedCategory = 'All Products';
    // Create backup of original grocery items
    this.originalGroceryItems = JSON.parse(JSON.stringify(this.groceryItems));
    // Initialize store distances randomly (consistent across all products)
    this.initializeStoreDistances();
    this.filteredItems = this.groceryItems;
    this.requestLocationAccess();
    // Get user details from user variable
    if (currentUser) {
      this.userName = currentUser.fullName;
      this.userMobile = currentUser.mobile;
    }
    // Load receipts
    this.loadReceipts();
    // Load my list items
    this.loadMyListItems();
    // Initialize change password form
    this.initializeChangePasswordForm();
    // Initialize membership form
    this.initializeMembershipForm();
    // Load saved memberships
    this.loadSavedMemberships();
  }

  initializeChangePasswordForm() {
    // Get user details from currentUser variable only
    const userName = currentUser ? currentUser.fullName : '';
    const userMobile = currentUser ? currentUser.mobile : '';
    // Check if password exists in currentUser variable
    const userPassword = currentUser && currentUser.password ? currentUser.password : '';
    
    console.log('initializeChangePasswordForm - userPassword from variable:', userPassword);

    this.changePasswordForm = this.fb.group({
      fullName: [userName, [Validators.required]],
      mobileNumber: [userMobile, [Validators.required]],
      currentPassword: [userPassword, [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
    
    // Force set the password value if it exists in the variable
    if (userPassword) {
      setTimeout(() => {
        this.changePasswordForm.get('currentPassword')?.setValue(userPassword, { emitEvent: false });
      }, 0);
    }
  }

  initializeMembershipForm() {
    this.membershipForm = this.fb.group({
      store: ['', [Validators.required]],
      membershipNumber: [''],
      email: [''],
      phone: [''],
      cardNumber: [''],
      expiryDate: [''],
      cvv: ['']
    });
  }

  saveMembership() {
    if (this.membershipForm.valid && this.selectedMembershipStore) {
      const formValue = this.membershipForm.value;
      const membershipData = {
        id: Date.now(),
        store: this.selectedMembershipStore,
        ...formValue,
        savedDate: new Date().toISOString()
      };
      
      // Check if membership for this store already exists
      const existingIndex = this.savedMemberships.findIndex(m => m.store === this.selectedMembershipStore);
      if (existingIndex >= 0) {
        // Update existing membership
        this.savedMemberships[existingIndex] = membershipData;
      } else {
        // Add new membership
        this.savedMemberships.push(membershipData);
      }
      
      // Save to localStorage
      localStorage.setItem('savedMemberships', JSON.stringify(this.savedMemberships));
      
      // Show in-app confirmation popup
      this.showMembershipSaveConfirmation = true;
      this.membershipForm.reset();
      this.selectedMembershipStore = '';
      this.loadSavedMemberships();
    } else {
      this.membershipForm.markAllAsTouched();
    }
  }

  loadSavedMemberships() {
    const stored = localStorage.getItem('savedMemberships');
    if (stored) {
      this.savedMemberships = JSON.parse(stored);
    } else {
      this.savedMemberships = [];
    }
  }

  hasMembershipForStore(storeName: string): boolean {
    return this.savedMemberships.some(m => m.store === storeName);
  }

  deleteMembership(membershipId: number) {
    this.savedMemberships = this.savedMemberships.filter(m => m.id !== membershipId);
    localStorage.setItem('savedMemberships', JSON.stringify(this.savedMemberships));
  }

  editMembership(membership: any) {
    this.selectedMembershipStore = membership.store;
    this.membershipForm.patchValue({
      store: membership.store,
      membershipNumber: membership.membershipNumber || '',
      email: membership.email || '',
      phone: membership.phone || '',
      cardNumber: membership.cardNumber || '',
      expiryDate: membership.expiryDate || '',
      cvv: membership.cvv || ''
    });
  }

  openMyMemberships() {
    this.showMyMemberships = true;
    this.selectedMembershipStore = '';
    this.membershipForm.reset();
    this.loadSavedMemberships();
  }

  closeMyMemberships() {
    this.showMyMemberships = false;
    this.selectedMembershipStore = '';
    this.membershipForm.reset();
  }

  closeMembershipSaveConfirmation() {
    this.showMembershipSaveConfirmation = false;
  }

  onStoreSelected() {
    const selectedStore = this.membershipForm.get('store')?.value;
    this.selectedMembershipStore = selectedStore || '';
    // Reset other fields when store changes
    this.membershipForm.patchValue({
      membershipNumber: '',
      email: '',
      phone: '',
      cardNumber: '',
      expiryDate: '',
      cvv: ''
    });
  }

  getMembershipFields(): string[] {
    // Return fields based on selected store
    if (!this.selectedMembershipStore) {
      return [];
    }
    
    // Store-specific fields
    const storeFields: { [key: string]: string[] } = {
      'Costco': ['membershipNumber', 'email', 'phone'],
      "Meijer's": ['membershipNumber', 'email', 'phone', 'cardNumber'],
      'Kroger': ['membershipNumber', 'email', 'phone'],
      'Walmart': ['email', 'phone'],
      'Aldi': ['email', 'phone'],
      "Busch's": ['membershipNumber', 'email', 'phone']
    };
    
    return storeFields[this.selectedMembershipStore] || ['email', 'phone'];
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  isChangePasswordFormValid(): boolean {
    if (!this.changePasswordForm) return false;
    
    const fullName = this.changePasswordForm.get('fullName')?.value;
    const mobileNumber = this.changePasswordForm.get('mobileNumber')?.value;
    const newPassword = this.changePasswordForm.get('newPassword')?.value;
    const confirmPassword = this.changePasswordForm.get('confirmPassword')?.value;
    
    // Check if any field has changed
    const nameChanged = currentUser && fullName !== currentUser.fullName;
    const mobileChanged = currentUser && mobileNumber !== currentUser.mobile;
    const passwordChanged = newPassword && confirmPassword && newPassword === confirmPassword && newPassword.length >= 6;
    
    // Button should be enabled if:
    // 1. Name or mobile is changed (form valid for those fields)
    // 2. OR password is being changed (new password and confirm password match and are valid)
    if (nameChanged || mobileChanged) {
      // If name or mobile changed, basic validation needed
      return fullName && mobileNumber;
    }
    
    if (passwordChanged) {
      // If password is being changed, ensure form is valid
      return this.changePasswordForm.valid && newPassword === confirmPassword;
    }
    
    return false;
  }

  openChangePassword() {
    this.showChangePassword = true;
    // Console log to check what data is available in user variable
    console.log('Change Password clicked - User variable data:', currentUser);
    if (currentUser) {
      console.log('Full Name:', currentUser.fullName);
      console.log('Mobile:', currentUser.mobile);
      console.log('Password:', currentUser.password ? 'Password exists' : 'Password NOT found');
    } else {
      console.log('currentUser is null');
    }
    
    // Re-initialize form with current user details from user variable
    this.initializeChangePasswordForm();
    // Ensure password is displayed from user variable - check if password exists
    if (currentUser && currentUser.password) {
      // Use setTimeout to ensure form is rendered
      setTimeout(() => {
        if (currentUser && currentUser.password && this.changePasswordForm) {
          this.changePasswordForm.get('currentPassword')?.setValue(currentUser.password, { emitEvent: false });
        }
      }, 0);
    }
  }

  closeChangePassword() {
    this.showChangePassword = false;
    this.changePasswordForm.reset();
    this.changePasswordError = '';
    // Re-initialize form
    this.initializeChangePasswordForm();
  }

  toggleCurrentPasswordVisibility() {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPasswordVisibility() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmitChangePassword() {
    if (this.isChangePasswordFormValid()) {
      // Update user details in the variable (including password)
      if (currentUser) {
        const formValue = this.changePasswordForm.getRawValue();
        const mobileDigits = formValue.mobileNumber.replace(/\D/g, ''); // Extract digits only
        
        // Update the user variable directly (in memory)
        currentUser.fullName = formValue.fullName;
        currentUser.mobileNumber = mobileDigits;
        currentUser.mobile = formValue.mobileNumber;
        if (formValue.newPassword) {
          currentUser.password = formValue.newPassword;
        }
        
        // Save to localStorage including password (to persist in user variable)
        localStorage.setItem('userData', JSON.stringify(currentUser));
        
        // Update displayed user info immediately
        this.userName = currentUser.fullName;
        this.userMobile = currentUser.mobile;
      }
      
      this.changePasswordError = '';
      alert('Profile updated successfully!');
      this.closeChangePassword();
    } else {
      this.changePasswordForm.markAllAsTouched();
    }
  }

  requestLocationAccess() {
    this.isLocationLoading = true;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Get zipcode from coordinates using reverse geocoding
          this.getZipcodeFromCoordinates(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          // User denied location access or error occurred
          this.locationZipcode = '------';
          this.isLocationLoading = false;
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      this.locationZipcode = '------';
      this.isLocationLoading = false;
    }
  }

  getZipcodeFromCoordinates(lat: number, lng: number) {
    // Using a free reverse geocoding API
    fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        // Try to extract postal code
        if (data.postcode) {
          this.locationZipcode = data.postcode;
        } else if (data.postalCode) {
          this.locationZipcode = data.postalCode;
        } else {
          this.locationZipcode = '------';
        }
        this.isLocationLoading = false;
        // Filter stores based on new zipcode
        this.filterStoresByZipcode();
      })
      .catch(error => {
        console.error('Error getting zipcode:', error);
        this.locationZipcode = '------';
        this.isLocationLoading = false;
      });
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
    this.showMyList = false; // Close my list when selecting category
    this.showReceipts = false; // Close receipts when selecting category
    this.showProfile = false; // Close profile when selecting category
    this.closePriceComparison(); // Close price comparison when selecting category
    this.filterItems();
    // Close sidebar when category is selected
    this.showSidebar = false;
  }


  filterItems() {
    // Start with all products
    let items = [...this.groceryItems];
    
    // Apply category filter - should work independently of sort
    if (this.selectedCategory && this.selectedCategory !== 'All' && this.selectedCategory !== 'All Products') {
      // Map category names to item categories for filtering
      const categoryMap: { [key: string]: string } = {
        'All Products': 'All',
        'Fruits': 'Fruits',
        'Vegetables': 'Vegetables',
        'Drinks & Beverages': 'Drinks',
        'Pantry': 'Pantry',
        'Dairy & Eggs': 'Dairy',
        'Bakery': 'Bakery',
        'Meat & Seafood': 'Meat',
        'Kitchen Utensils': 'Utensils'
      };
      
      const mappedCategory = categoryMap[this.selectedCategory] || this.selectedCategory;
      if (mappedCategory !== 'All') {
        items = items.filter(item => item.category === mappedCategory);
      }
    }
    
    // Apply search filter
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      items = items.filter(item =>
        item.name.toLowerCase().includes(this.searchQuery.toLowerCase().trim())
      );
    }

    // Apply store filter - only show products that have prices from selected stores
    const selectedStoreNames = Object.keys(this.selectedStores).filter(store => this.selectedStores[store]);
    if (selectedStoreNames.length > 0) {
      items = items.filter(item => {
        // Check if product has at least one store price from selected stores
        return item.storePrices && item.storePrices.some(sp => selectedStoreNames.includes(sp.store));
      });
    }

    // Apply sorting (applies to all filtered items)
    if (this.selectedSort === 'name-asc') {
      items = [...items].sort((a, b) => a.name.localeCompare(b.name));
    } else if (this.selectedSort === 'name-desc') {
      items = [...items].sort((a, b) => b.name.localeCompare(a.name));
    }

    this.filteredItems = items;
  }

  getProductCount(): number {
    if (this.selectedCategory === 'All Products' || this.selectedCategory === 'All') {
      // Return total count of all products
      return this.groceryItems.length;
    } else {
      // Return count of filtered items for the selected category
      return this.filteredItems.length;
    }
  }

  toggleSidebar() {
    this.showSidebar = !this.showSidebar;
  }

  onSearchChange() {
    this.filterItems();
  }

  toggleFilterDropdown(event: Event) {
    event.stopPropagation();
    this.showFilterDropdown = !this.showFilterDropdown;
  }

  closeFilterDropdown() {
    this.showFilterDropdown = false;
  }

  toggleStore(store: string) {
    this.selectedStores[store] = !this.selectedStores[store];
  }

  applyFilter() {
    this.isFilterActive = this.selectedSort !== '' || Object.values(this.selectedStores).some(selected => selected);
    this.filterItems();
    this.closeFilterDropdown();
    
    // If price comparison is open, refresh it with filtered stores
    if (this.showPriceComparison && this.selectedProduct) {
      this.refreshPriceComparison();
    }
  }
  
  refreshPriceComparison() {
    if (!this.selectedProduct) return;
    
    // Filter store prices based on selected stores
    const selectedStoreNames = Object.keys(this.selectedStores).filter(store => this.selectedStores[store]);
    let filteredStorePrices = [...this.selectedProduct.storePrices];
    
    // Get original product to restore full store prices list
    const originalProduct = this.groceryItems.find(p => p.id === this.selectedProduct!.id);
    if (originalProduct) {
      filteredStorePrices = [...originalProduct.storePrices];
      
      if (selectedStoreNames.length > 0) {
        // Only show stores that are selected in the filter
        filteredStorePrices = filteredStorePrices.filter(sp => selectedStoreNames.includes(sp.store));
      }
      
      // Sort store prices by price in ascending order
      this.selectedProduct.storePrices = filteredStorePrices.sort((a, b) => a.price - b.price);
    }
  }

  clearFilter() {
    this.selectedSort = '';
    this.selectedStores = {};
    this.isFilterActive = false;
    this.searchQuery = '';
    this.selectedCategory = 'All Products';
    this.closePriceComparison(); // Close price comparison when clearing filters
    this.filterItems();
    this.closeFilterDropdown();
  }

  navigateToHomeOrReload(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    // Check if we're on the home page (not showing My List, Receipts, or Profile)
    const isOnHomePage = !this.showMyList && !this.showReceipts && !this.showProfile && !this.showPriceComparison && !this.showStoreDetails;
    
    if (isOnHomePage) {
      // Reload the page if already on home page
      window.location.reload();
    } else {
      // Navigate to home page if on another page
      this.navigateHome(event);
    }
  }

  navigateHome(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    // Close all views and show product grid
    this.showMyList = false;
    this.showReceipts = false;
    this.showProfile = false;
    this.showPriceComparison = false;
    this.showStoreDetails = false;
    this.clearFilter(); // Clear filters
    this.filterItems(); // Refresh the product list
  }

  openZipcodePopup() {
    this.zipcodeInput = this.locationZipcode || '';
    this.showZipcodePopup = true;
  }

  closeZipcodePopup() {
    this.showZipcodePopup = false;
    this.zipcodeInput = '';
  }

  initializeStoreDistances() {
    // Assign random distances to each store (consistent across all products)
    // Lower price stores should get lower distances, but we'll assign randomly within ranges
    const distanceRanges = [
      { min: 0.5, max: 3.0 },   // Range for first store (lowest price typically)
      { min: 2.0, max: 5.0 },   // Range for second store
      { min: 3.5, max: 7.0 },   // Range for third store
      { min: 5.0, max: 9.0 },   // Range for fourth store
      { min: 6.5, max: 11.0 }, // Range for fifth store
      { min: 8.0, max: 13.0 }   // Range for sixth store
    ];
    
    // Shuffle stores to assign random distances
    const shuffledStores = [...this.stores].sort(() => Math.random() - 0.5);
    
    shuffledStores.forEach((store, index) => {
      const range = distanceRanges[index] || { min: 8.0, max: 15.0 };
      const randomDistance = Math.random() * (range.max - range.min) + range.min;
      this.storeDistances[store] = Math.round(randomDistance * 10) / 10; // Round to 1 decimal place
    });
  }

  saveZipcode() {
    if (this.zipcodeInput.length === 5 || this.zipcodeInput.length === 6) {
      this.locationZipcode = this.zipcodeInput;
      this.closeZipcodePopup();
      // Re-initialize store distances for new zipcode
      this.initializeStoreDistances();
      // Filter stores based on new zipcode
      this.filterStoresByZipcode();
    }
  }

  // Calculate distance between two coordinates using Haversine formula
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Get coordinates for a zipcode
  getZipcodeCoordinates(zipcode: string): { lat: number, lng: number } {
    // Zipcode to coordinates mapping (for Michigan area)
    const zipcodeCoords: { [key: string]: { lat: number, lng: number } } = {
      '48335': { lat: 42.4853, lng: -83.3764 }, // Farmington Hills (default)
      '48152': { lat: 42.3964, lng: -83.3523 }, // Livonia (Costco)
      '48375': { lat: 42.4806, lng: -83.4756 }, // Novi (Walmart)
      '48334': { lat: 42.5281, lng: -83.3775 }, // Farmington Hills (Aldi)
      '48167': { lat: 42.4311, lng: -83.4831 }, // Northville (Meijer)
      '48331': { lat: 42.5036, lng: -83.3528 }, // Farmington Hills (Kroger)
      '48322': { lat: 42.5689, lng: -83.3775 }  // West Bloomfield (Whole Foods)
    };
    
    // Return coordinates for the zipcode, or default to 48335 if not found
    return zipcodeCoords[zipcode] || zipcodeCoords['48335'];
  }

  // Filter stores based on zipcode (up to 15 miles)
  filterStoresByZipcode() {
    if (!this.locationZipcode || this.locationZipcode === '------') {
      // Restore original data if no zipcode
      if (this.originalGroceryItems.length > 0) {
        this.groceryItems = JSON.parse(JSON.stringify(this.originalGroceryItems));
        this.filterItems();
      }
      return;
    }

    // Restore from original first
    if (this.originalGroceryItems.length > 0) {
      this.groceryItems = JSON.parse(JSON.stringify(this.originalGroceryItems));
    }

    const userCoords = this.getZipcodeCoordinates(this.locationZipcode);
    const maxDistance = 15; // 15 miles

    // Update distances and filter stores in grocery items based on zipcode
    this.groceryItems.forEach(item => {
      if (item.storePrices) {
        // Use consistent store distances (assigned at initialization)
        item.storePrices.forEach(storePrice => {
          if (this.storeDistances[storePrice.store]) {
            storePrice.distance = this.storeDistances[storePrice.store];
          }
        });

        // Filter out stores beyond 15 miles
        item.storePrices = item.storePrices.filter(sp => {
          const storeDetails = this.getStoreDetails(sp.store);
          if (storeDetails && storeDetails.coordinates) {
            const distance = this.calculateDistance(
              userCoords.lat,
              userCoords.lng,
              storeDetails.coordinates.lat,
              storeDetails.coordinates.lng
            );
            return distance <= maxDistance;
          }
          return true; // Keep store if no coordinates available
        });

        // Update product price to lowest available price
        if (item.storePrices.length > 0) {
          item.price = Math.min(...item.storePrices.map(sp => sp.price));
        }
      }
    });

    // Refresh filtered items
    this.filterItems();
  }

  onZipcodeInput(event: any) {
    const value = event.target.value.replace(/\D/g, '');
    if (value.length <= 6) {
      this.zipcodeInput = value;
    }
  }

  viewProduct(productId: number) {
    const product = this.groceryItems.find(p => p.id === productId);
    if (product) {
      this.selectedProduct = { ...product };
      
      // Load saved memberships to check membership status
      this.loadSavedMemberships();
      
      // Filter store prices based on selected stores
      const selectedStoreNames = Object.keys(this.selectedStores).filter(store => this.selectedStores[store]);
      let filteredStorePrices = [...product.storePrices];
      
      if (selectedStoreNames.length > 0) {
        // Only show stores that are selected in the filter
        filteredStorePrices = filteredStorePrices.filter(sp => selectedStoreNames.includes(sp.store));
      }
      
      // Sort store prices by price in ascending order
      filteredStorePrices = filteredStorePrices.sort((a, b) => a.price - b.price);
      
      // Use consistent store distances (assigned at app initialization)
      filteredStorePrices.forEach((storePrice) => {
        if (this.storeDistances[storePrice.store]) {
          storePrice.distance = this.storeDistances[storePrice.store];
        }
      });
      
      this.selectedProduct.storePrices = filteredStorePrices;
      this.showPriceComparison = true;
    }
  }

  closePriceComparison() {
    this.showPriceComparison = false;
    this.selectedProduct = null;
    this.showStoreDetails = false;
    this.selectedStore = null;
  }

  viewStore(storePrice: StorePrice) {
    this.selectedStore = storePrice;
    this.showStoreDetails = true;
  }

  closeStoreDetails() {
    this.showStoreDetails = false;
    this.selectedStore = null;
  }

  getStoreDetails(storeName: string): any {
    const storeDetails: { [key: string]: any } = {
      'Costco': {
        name: 'Costco Wholesale',
        logo: 'assets/Store Images/Costco_Logo.jpeg',
        address: '20000 Haggerty Rd, Livonia, MI 48152',
        zipcode: '48152',
        phone: '+1 890 700 2342',
        rating: 4.7,
        membershipRequired: true,
        website: 'https://www.costco.com',
        coordinates: { lat: 42.3964, lng: -83.3523 }
      },
      'Walmart': {
        name: 'Walmart',
        logo: 'assets/Store Images/Walmart_Logo.png',
        address: '26090 Ingersol Dr, Novi, MI 48375',
        zipcode: '48375',
        phone: '+1 890 700 2343',
        rating: 4.3,
        membershipRequired: false,
        website: 'https://www.walmart.com',
        coordinates: { lat: 42.4806, lng: -83.4756 }
      },
      'Aldi': {
        name: 'Aldi',
        logo: 'assets/Store Images/Aldie_Logo.png',
        address: '30790 Orchard Lake Rd, Farmington Hills, MI 48334',
        zipcode: '48334',
        phone: '+1 890 700 2344',
        rating: 4.5,
        membershipRequired: false,
        website: 'https://www.aldi.us',
        coordinates: { lat: 42.5281, lng: -83.3775 }
      },
      "Meijer's": {
        name: "Meijer's",
        logo: 'assets/Store Images/Meijer\'s_Logo.png',
        address: '20401 Haggerty Rd, Northville, MI 48167',
        zipcode: '48167',
        phone: '+1 890 700 2345',
        rating: 4.4,
        membershipRequired: false,
        website: 'https://www.meijer.com',
        coordinates: { lat: 42.4311, lng: -83.4831 }
      },
      'Kroger': {
        name: 'Kroger',
        logo: 'assets/Store Images/Kroger_Logo.png',
        address: '37550 W 12 Mile Rd, Farmington Hills, MI 48331',
        zipcode: '48331',
        phone: '+1 890 700 2346',
        rating: 4.2,
        membershipRequired: false,
        website: 'https://www.kroger.com',
        coordinates: { lat: 42.5036, lng: -83.3528 }
      },
      "Busch's": {
        name: "Busch's",
        logo: 'assets/Store Images/Busch\'s_Logo.png',
        address: '24445 Drake Rd, Farmington Hills, MI 48335',
        zipcode: '48335',
        phone: '+1 890 700 2347',
        rating: 4.1,
        membershipRequired: false,
        website: 'https://www.buschs.com',
        coordinates: { lat: 42.4853, lng: -83.3764 }
      },
      'Whole Foods': {
        name: 'Whole Foods Market',
        logo: 'assets/Store Images/WholeFoods_Logo.png',
        address: '7350 Orchard Lake Rd, West Bloomfield Township, MI 48322',
        zipcode: '48322',
        phone: '+1 890 700 2348',
        rating: 4.6,
        membershipRequired: false,
        website: 'https://www.wholefoodsmarket.com',
        coordinates: { lat: 42.5689, lng: -83.3775 }
      }
    };
    return storeDetails[storeName] || {};
  }

  openDirections(address: string) {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  }

  openWebsite(url: string) {
    window.open(url, '_blank');
  }

  getFullStars(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0).map((_, i) => i + 1);
  }

  hasHalfStar(rating: number): boolean {
    return rating % 1 >= 0.5;
  }

  addToList() {
    if (this.selectedProduct && this.selectedStore) {
      const productKey = `${this.selectedProduct.id}-${this.selectedStore.store}`;
      
      // Check if this product from this store is already added
      if (this.addedProducts.has(productKey)) {
        return; // Already added, do nothing
      }
      
      // Check if this product (from any store) is already added
      const productAddedFromAnyStore = Array.from(this.addedProducts).some(key => 
        key.startsWith(`${this.selectedProduct!.id}-`)
      );
      
      if (productAddedFromAnyStore) {
        return; // Product already added from another store
      }
      
      // Add to list with full details
      const listItem = {
        id: this.myListItems.length + 1,
        productId: this.selectedProduct.id,
        productName: this.selectedProduct.name,
        productImage: this.selectedProduct.image,
        productSize: this.selectedProduct.size,
        store: this.selectedStore.store,
        price: this.selectedStore.price,
        distance: this.selectedStore.distance,
        quantity: 1
      };
      
      this.myListItems.push(listItem);
      this.addedProducts.add(productKey);
      this.saveMyListItems(); // Save to localStorage
      this.showAddToListConfirmation = true;
      this.showStoreDetails = false;
    }
  }

  navigateToMyList() {
    this.showMyList = true;
    this.showReceipts = false;
    this.showProfile = false; // Ensure profile view is closed
    this.showPriceComparison = false;
    this.showStoreDetails = false;
    this.loadMyListItems();
  }

  loadMyListItems() {
    // Load my list items from localStorage
    const storedItems = localStorage.getItem('myListItems');
    if (storedItems) {
      this.myListItems = JSON.parse(storedItems);
      this.myListCount = this.myListItems.length;
      // Rebuild addedProducts set from stored items
      this.addedProducts.clear();
      this.myListItems.forEach(item => {
        const productKey = `${item.productId}-${item.store}`;
        this.addedProducts.add(productKey);
      });
    } else {
      this.myListItems = [];
      this.myListCount = 0;
    }
  }

  saveMyListItems() {
    // Save my list items to localStorage
    localStorage.setItem('myListItems', JSON.stringify(this.myListItems));
    this.myListCount = this.myListItems.length;
  }

  removeFromList(itemId: number) {
    const item = this.myListItems.find(i => i.id === itemId);
    if (item) {
      // Remove from list
      this.myListItems = this.myListItems.filter(i => i.id !== itemId);
      
      // Remove from addedProducts set
      const productKey = `${item.productId}-${item.store}`;
      this.addedProducts.delete(productKey);
      
      // Save to localStorage
      this.saveMyListItems();
      
      // Show confirmation message
      this.showRemoveConfirmation = true;
      setTimeout(() => {
        this.showRemoveConfirmation = false;
      }, 3000);
    }
  }

  updateQuantity(itemId: number, change: number) {
    const item = this.myListItems.find(i => i.id === itemId);
    if (item) {
      const newQuantity = item.quantity + change;
      if (newQuantity <= 0) {
        // Remove item when quantity reaches 0
        this.removeFromList(itemId);
      } else {
        item.quantity = newQuantity;
        this.saveMyListItems(); // Save to localStorage
      }
    }
  }

  getTotalCartValue(): number {
    return this.myListItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getStoreLogo(storeName: string): string {
    const storeDetails = this.getStoreDetails(storeName);
    return storeDetails.logo || '';
  }

  logout() {
    // Clear user variable
    clearUser();
    // Set flag to prevent splash screen from showing on logout
    sessionStorage.setItem('isLogoutNavigation', 'true');
    // Navigate to login and replace history to prevent back navigation
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  navigateToReceipts() {
    this.showReceipts = true;
    this.showPriceComparison = false;
    this.showStoreDetails = false;
    this.showMyList = false;
    this.showProfile = false;
    this.loadReceipts();
  }

  navigateToProfile() {
    this.showProfile = true;
    this.showReceipts = false;
    this.showPriceComparison = false;
    this.showStoreDetails = false;
    this.showMyList = false;
  }


  loadReceipts() {
    // Load receipts from localStorage
    const storedReceipts = localStorage.getItem('receipts');
    if (storedReceipts) {
      this.receipts = JSON.parse(storedReceipts);
    } else {
      this.receipts = [];
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const receipt = {
          id: Date.now(),
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          fileData: e.target.result, // Base64 encoded file
          uploadDate: new Date().toISOString(),
          uploadDateFormatted: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        };
        
        this.receipts.push(receipt);
        // Save to localStorage
        localStorage.setItem('receipts', JSON.stringify(this.receipts));
        
        // Reset file input
        event.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  }

  deleteReceipt(receiptId: number) {
    // Show confirmation popup
    this.receiptToDelete = receiptId;
    this.showDeleteReceiptConfirmation = true;
  }

  confirmDeleteReceipt() {
    if (this.receiptToDelete !== null) {
      this.receipts = this.receipts.filter(r => r.id !== this.receiptToDelete);
      localStorage.setItem('receipts', JSON.stringify(this.receipts));
      this.showDeleteReceiptConfirmation = false;
      this.receiptToDelete = null;
      
      // Show green success message
      this.showDeleteReceiptSuccess = true;
      setTimeout(() => {
        this.showDeleteReceiptSuccess = false;
      }, 3000);
    }
  }

  cancelDeleteReceipt() {
    this.showDeleteReceiptConfirmation = false;
    this.receiptToDelete = null;
  }

  downloadReceipt(receipt: any) {
    const link = document.createElement('a');
    link.href = receipt.fileData;
    link.download = receipt.fileName;
    link.click();
  }

  viewReceipt(receipt: any) {
    // Open receipt in new window
    const newWindow = window.open();
    if (newWindow) {
      if (receipt.fileType && receipt.fileType.startsWith('image/')) {
        newWindow.document.write(`
          <html>
            <head><title>${receipt.fileName}</title></head>
            <body style="margin:0; padding:20px;">
              <img src="${receipt.fileData}" style="max-width:100%; height:auto;" />
            </body>
          </html>
        `);
      } else if (receipt.fileType === 'application/pdf') {
        newWindow.document.write(`
          <html>
            <head><title>${receipt.fileName}</title></head>
            <body style="margin:0; padding:20px;">
              <iframe src="${receipt.fileData}" style="width:100%; height:100vh; border:none;"></iframe>
            </body>
          </html>
        `);
      } else {
        // For other file types, try to download
        this.downloadReceipt(receipt);
      }
    }
  }

  async scanReceipt() {
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Use back camera if available
        } 
      });
      
      // Store the stream and show camera view
      this.videoStream = stream;
      this.showCamera = true;
      
      // Set video source after view is rendered
      setTimeout(() => {
        const video = document.getElementById('camera-video') as HTMLVideoElement;
        if (video && this.videoStream) {
          video.srcObject = this.videoStream;
        }
      }, 0);
    } catch (error: any) {
      // Handle camera access denied or error
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        alert('Camera access denied. Please allow camera access to scan receipts.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        alert('No camera found on this device.');
      } else {
        alert('Error accessing camera: ' + error.message);
      }
      console.error('Error accessing camera:', error);
    }
  }

  stopCamera() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
    this.showCamera = false;
  }

  capturePhoto() {
    // Capture photo from video stream
    if (this.videoStream) {
      const video = document.getElementById('camera-video') as HTMLVideoElement;
      if (video) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              // Create a file from the blob
              const file = new File([blob], `receipt_scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
              // Simulate file input change event
              const event = {
                target: {
                  files: [file]
                }
              } as any;
              this.onFileSelected(event);
              // Stop camera after capture
              this.stopCamera();
            }
          }, 'image/jpeg');
        }
      }
    }
  }

  getReceiptDisplayName(receipt: any): string {
    // Extract date from filename or use upload date
    const date = new Date(receipt.uploadDate);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const month = monthNames[date.getMonth()];
    const day = date.getDate().toString().padStart(2, '0');
    return `${month} ${day}`;
  }

  isProductAdded(productId: number, storeName: string): boolean {
    if (!productId || !storeName) return false;
    const productKey = `${productId}-${storeName}`;
    // Check if this exact product-store combination is added
    if (this.addedProducts.has(productKey)) {
      return true;
    }
    // Check if this product is added from any store
    return Array.from(this.addedProducts).some(key => key.startsWith(`${productId}-`));
  }

  closeConfirmation() {
    this.showAddToListConfirmation = false;
  }

  viewList() {
    this.closeConfirmation();
    this.navigateToMyList();
  }

  goToHomeFromConfirmation() {
    this.closeConfirmation();
    this.closePriceComparison();
    this.navigateHome();
  }

  getPriceColor(price: number): string {
    if (!this.selectedProduct || !this.selectedProduct.storePrices.length) return '';
    
    const sortedPrices = [...this.selectedProduct.storePrices].sort((a, b) => a.price - b.price);
    const lowestPrice = sortedPrices[0].price;
    const highestPrice = sortedPrices[sortedPrices.length - 1].price;

    // Low price is green, highest is red, middle prices are yellow
    if (Math.abs(price - lowestPrice) < 0.01) {
      return 'green';
    } else if (Math.abs(price - highestPrice) < 0.01) {
      return 'red';
    } else {
      return 'yellow';
    }
  }

  ngOnDestroy() {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
    // Stop camera stream if active
    this.stopCamera();
  }
}

