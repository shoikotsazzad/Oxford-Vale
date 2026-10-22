// Gallery photos. Put files in public/images/gallery/. Alt text describes the photo.

export type GalleryItem = { src: string; alt: string; category?: string };

export const gallery: GalleryItem[] = Array.from({ length: 6 }, (_, i) => ({
  src: "/images/placeholder.svg",
  alt: `[PLACEHOLDER: Photo ${i + 1} description]`,
}));
