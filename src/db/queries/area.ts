import { db } from "@/db";
import { area } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createArea(data: string) {
    const [c] = await db.insert(area).values({ name: data.toLowerCase() }).returning();
    return c;
}

export async function getAreaById(id: string) {
    const [c] = await db.select().from(area).where(eq(area.areaId, id)).limit(1);
    return c;
}

export async function getAllAreas() {
    const areas = await db.select({ areaId: area.areaId, name: area.name }).from(area);

    return areas.map(c => ({
        id: c.areaId,
        name: c.name,
    }));
}

// get area by name
export async function getAreaByName(name: string) {
    const [c] = await db.select().from(area).where(eq(area.name, name.toLowerCase())).limit(1);
    return c;
}