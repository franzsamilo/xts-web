import { adminDb } from '@/lib/firebase/admin';

export async function getAllProducts() {
  try {
    const snapshot = await adminDb.collection('products').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function createProduct(data: any) {
  try {
    const docRef = await adminDb.collection('products').add({
      ...data,
      createdAt: new Date(),
    });
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

export async function getProductById(id: string) {
  try {
    const doc = await adminDb.collection('products').doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}
export async function deleteProductFromDb(id: string) {
  try {
    await adminDb.collection('products').doc(id).delete();
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

export async function updateProduct(id: string, data: any) {
  try {
    await adminDb.collection('products').doc(id).update(data);
    return { id, ...data };
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}
