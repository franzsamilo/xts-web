/**
 * Shared client-facing types. The API returns Firestore-shaped objects with
 * Date fields serialised to ISO strings, so client code should consume these
 * variants instead of the server-side interfaces in `lib/orders.ts`,
 * `lib/products.ts`, etc. (which use Firestore Timestamps and admin SDK types).
 */

import type { OrderItem, OrderPaymentStatus, StatusHistoryEntry } from '@/lib/orders';
import type { ApplicationStatus, ApplicationType } from '@/lib/applications';

export interface ProductDTO {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  description: string;
  tag: string;
  imageUrls?: string[];
  specifications?: { key: string; value: string }[];
  rating?: number | null;
  totalSold?: number;
  sellerId?: string;
}

export interface OrderDTO {
  id: string;
  items: OrderItem[];
  total: number;
  status: string;
  statusHistory?: StatusHistoryEntry[];
  customerName: string;
  customerEmail: string;
  deliveryMethod: 'standard' | 'pickup';
  pickupPointId?: string;
  pickupPointName?: string;
  paymentMethod?: 'cod' | 'gcash';
  paymentStatus?: OrderPaymentStatus;
  paymongoLinkId?: string;
  paymongoPaymentId?: string;
  paidAt?: string;
  paymentFailureReason?: string | null;
  stockRestoredAt?: string;
  createdAt: string;
}

export interface ConsultationDTO {
  id: string;
  expertName: string;
  expertTitle: string;
  expertPrice: string;
  clientName: string;
  clientEmail: string;
  slot: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  consultationType?: string;
  projectDescription?: string;
  requiredSkills?: string;
  createdAt: string;
}

export interface ConsultationMessageDTO {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface FabJobDTO {
  id: string;
  name: string;
  files: string[];
  fileUrls?: string[];
  status: 'queued' | 'reviewing' | 'in-progress' | 'completed' | 'cancelled';
  progress: number;
  customerName: string;
  customerEmail: string;
  notes?: string;
  serviceType?: '3d-printing' | 'laser-cutting' | 'pcb-fabrication';
  parameters?: Record<string, string>;
  preferredSchedule?: { startDate: string; endDate: string };
  createdAt: string;
}

export interface PickupPointDTO {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
  createdAt: string;
}

export interface ApplicationDTO {
  id: string;
  type: ApplicationType;
  name: string;
  expertise: string;
  description?: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface UserDTO {
  id: string;
  name?: string;
  email?: string;
  role?: 'member' | 'admin' | 'expert' | 'seller' | string;
  acceptedTermsAt?: string;
}
