import { adminDb } from '@/lib/firebase/admin';

export interface SpecificationField {
  key: string;
  value: string;
}

export interface ProductData {
  id?: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  description: string;
  tag: string;
  imageUrls?: string[];
  specifications?: SpecificationField[];
  rating?: number | null;
  totalSold?: number;
  sellerId?: string;
  createdAt?: Date | any;
}

export async function getAllProducts(): Promise<ProductData[]> {
  try {
    const snapshot = await adminDb.collection('products').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ProductData[];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function getProductById(id: string): Promise<ProductData | null> {
  try {
    const doc = await adminDb.collection('products').doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as ProductData;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function createProduct(data: Omit<ProductData, 'id'>): Promise<ProductData> {
  const docRef = await adminDb.collection('products').add({
    ...data,
    imageUrls: data.imageUrls || [],
    specifications: data.specifications || [],
    rating: data.rating || null,
    totalSold: data.totalSold || 0,
    createdAt: new Date(),
  });
  return { id: docRef.id, ...data };
}

export async function deleteProductFromDb(id: string): Promise<void> {
  await adminDb.collection('products').doc(id).delete();
}

export async function updateProduct(id: string, data: Partial<ProductData>): Promise<ProductData> {
  await adminDb.collection('products').doc(id).update(data);
  const doc = await adminDb.collection('products').doc(id).get();
  return { id: doc.id, ...doc.data() } as ProductData;
}
