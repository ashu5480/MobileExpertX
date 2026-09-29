/**
 * Domain models for the MobilExpertX platform.
 * These mirror the shape a real backend would return, so the UI never needs
 * to change when the mock repository is swapped for a live API.
 */

export type ProductCondition = 'new' | 'refurbished' | 'used';

export type ProductCategory =
  | 'flagship'
  | 'mid-range'
  | 'budget'
  | 'foldable'
  | 'refurbished'
  | 'accessory';

export type AccessoryCategory =
  | 'chargers'
  | 'cables'
  | 'power-banks'
  | 'cases'
  | 'screen-protectors'
  | 'earphones'
  | 'wireless-earbuds'
  | 'smartwatches'
  | 'car-chargers'
  | 'mobile-stands'
  | 'adapters'
  | 'other';

export interface Money {
  /** Amount in the minor unit (paise for INR). */
  amount: number;
  currency: 'INR';
}

export interface ColorOption {
  name: string;
  /** Hex used for the generated product visual + swatch chip. */
  hex: string;
  /** Optional two-stop gradient for the 3D / CSS render. */
  gradient?: [string, string];
}

export interface ProductImage {
  /**
   * Remote or local image URL. When empty the UI renders a generated
   * `ProductVisual` placeholder so the layout never breaks.
   */
  url: string;
  alt: string;
  /** Front / back / angle — drives the gallery. */
  view?: 'front' | 'back' | 'angle' | 'detail';
}

export interface ProductSpec {
  label: string;
  value: string;
  group:
    | 'display'
    | 'performance'
    | 'camera'
    | 'battery'
    | 'network'
    | 'body'
    | 'software';
}

export interface ProductReview {
  id: string;
  author: string;
  location: string;
  avatarSeed: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  verified: boolean;
  purchased: string;
  helpful: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  model: string;
  condition: ProductCondition;
  category: ProductCategory;
  /** Price in paise. */
  price: number;
  /** Original MRP in paise, used for the discount badge. */
  mrp: number;
  rating: number;
  reviewCount: number;
  images: ProductImage[];
  colors: ColorOption[];
  storages: string[];
  rams: string[];
  /** Free-form highlight chips shown on the card. */
  highlights: string[];
  description: string;
  specs: ProductSpec[];
  stock: number;
  sku: string;
  warranty: string;
  tags: Array<'new' | 'refurbished' | 'best-seller' | 'deal'>;
  createdAt: string;
  /** Brand colour used for the generated visual + accent glow. */
  accent: string;
  /** Refurbished units only — published battery health percentage. */
  batteryHealth?: number;
  installedOS?: string;
}

export interface AccessoryProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: AccessoryCategory;
  price: number;
  mrp: number;
  rating: number;
  reviewCount: number;
  image: string;
  accent: string;
  description: string;
  stock: number;
  highlights: string[];
  createdAt: string;
  compatibility: string[];
}

export interface RepairService {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  longDescription: string;
  /** Starting price in paise. */
  startingPrice: number;
  turnaround: string;
  icon: string;
  includes: string[];
  popular?: boolean;
  warranty: string;
  devices: string[];
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  avatarSeed: string;
  rating: number;
  review: string;
  purchased: string;
  service: 'purchase' | 'sell' | 'repair' | 'accessories';
}

export interface Coupon {
  code: string;
  type: 'percentage' | 'fixed';
  /** Percentage points for `percentage`, paise for `fixed`. */
  value: number;
  minCartPaise: number;
  maxDiscountPaise?: number;
  description: string;
  expiresAt: string;
  active: boolean;
}

export interface CartLine {
  productId: string;
  /** Selected variant — resolved against the product at render time. */
  variantKey: string;
  quantity: number;
  addedAt: number;
}

export type DeliveryMethodId = 'standard' | 'express' | 'pickup';

export interface DeliveryMethod {
  id: DeliveryMethodId;
  label: string;
  description: string;
  eta: string;
  pricePaise: number;
  freeAbovePaise?: number;
  icon: string;
}

export interface OrderLine {
  productId: string;
  name: string;
  slug: string;
  variantKey: string;
  quantity: number;
  unitPricePaise: number;
  lineTotalPaise: number;
  image: string;
  accent: string;
  /** Whether this line is a phone or an accessory. */
  kind: 'phone' | 'accessory';
}

export interface CustomerInfo {
  fullName: string;
  phone: string;
  email: string;
}

export interface ShippingAddress {
  addressLine: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface OrderTotals {
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  taxPaise: number;
  grandTotalPaise: number;
  couponCode: string | null;
  freeShippingApplied: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: 'pending' | 'confirmed' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'created' | 'authorized' | 'captured' | 'failed' | 'refunded';
  paymentProvider: 'razorpay' | 'stripe' | 'mock';
  paymentReference: string | null;
  customer: CustomerInfo;
  shippingAddress: ShippingAddress;
  deliveryMethod: DeliveryMethodId;
  lines: OrderLine[];
  totals: OrderTotals;
}

export interface RepairBooking {
  id: string;
  reference: string;
  createdAt: string;
  name: string;
  phone: string;
  email?: string;
  brand: string;
  model: string;
  problem: string;
  serviceSlug?: string;
  preferredDate: string;
  preferredTime: string;
  dropoff: 'walk-in' | 'pickup';
  notes?: string;
  estimatedFromPaise: number;
}

export interface SellPhoneRequest {
  id: string;
  reference: string;
  createdAt: string;
  brand: string;
  model: string;
  storage: string;
  condition: string;
  screen: string;
  battery: string;
  body: string;
  accessories: string[];
  hasOriginalBox: boolean;
  purchaseAge: string;
  estimatedValuePaise: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  pickupDate: string;
  pickupTime: string;
  imageCount: number;
  notes?: string;
}

export interface ContactInquiry {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export type ProductSort =
  | 'featured'
  | 'price-asc'
  | 'price-desc'
  | 'newest'
  | 'rating'
  | 'discount';

export interface ProductFilters {
  query?: string;
  categories?: ProductCategory[];
  brands?: string[];
  conditions?: ProductCondition[];
  rams?: string[];
  storages?: string[];
  minPricePaise?: number;
  maxPricePaise?: number;
  inStockOnly?: boolean;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
}
