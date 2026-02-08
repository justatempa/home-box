export type ItemFormValues = {
  name: string;
  categoryId: string | null;
  parentId: string | null;
  inboundAt: string; // yyyy-mm-dd
  statusValue: string | null;
  acquireMethodValue: string | null;
  price: number;
  isFavorite: boolean;
  rating: number;
  note: string;
};
