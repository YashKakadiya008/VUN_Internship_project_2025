import { AddressInsert, db } from '@/db';
import { address } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function createAddress(data: AddressInsert) {
  const [a] = await db.insert(address).values(data).returning();
  return a;
}

export async function updateAddress(id: string, data: Partial<AddressInsert>) {
  const [a] = await db.update(address).set(data).where(eq(address.addressId, id)).returning();
  return a;
}

export async function getAddressById(id: string) {
  const [a] = await db.select().from(address).where(eq(address.addressId, id)).limit(1);
  return a;
}

export async function deleteAddress(id: string) {
  const [a] = await db.delete(address).where(eq(address.addressId, id)).returning();
  return a;
}
