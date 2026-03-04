export type Subcategory = {
  id: string;
  label: { ru: string; en: string };
  createdAt?: string;
};

export type Category = {
  id: string;
  label: { ru: string; en: string };
  preview?: string;
  createdAt?: string;
  subcategories: Subcategory[];
};
