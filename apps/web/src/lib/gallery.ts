import {
  listApprovedGuestEntries,
  listApprovedPhotos,
  type ApprovedGuestEntry,
  type ApprovedPhoto,
} from "./api";

export type GalleryItem =
  | { kind: "hope"; createdAt: string; id: string; entry: ApprovedGuestEntry }
  | { kind: "photo"; createdAt: string; id: string; photo: ApprovedPhoto };

export async function loadGalleryItems(limit = 50): Promise<GalleryItem[]> {
  const [hopeResult, photoResult] = await Promise.allSettled([
    listApprovedGuestEntries(limit),
    listApprovedPhotos(limit),
  ]);
  if (hopeResult.status === "rejected" && photoResult.status === "rejected") {
    throw new Error("Galeri belum dapat dimuat");
  }

  const items: GalleryItem[] = [];
  if (hopeResult.status === "fulfilled") {
    items.push(
      ...hopeResult.value.map((entry) => ({
        kind: "hope" as const,
        createdAt: entry.created_at,
        id: `hope-${entry.id}`,
        entry,
      })),
    );
  }
  if (photoResult.status === "fulfilled") {
    items.push(
      ...photoResult.value.map((photo) => ({
        kind: "photo" as const,
        createdAt: photo.created_at,
        id: `photo-${photo.id}`,
        photo,
      })),
    );
  }
  return items.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}
