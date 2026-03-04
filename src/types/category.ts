export type Subcategory = {
  id: string;
  label: { ru: string; en: string };
};

export type Category = {
  id: string;
  label: { ru: string; en: string };
  preview?: string;
  subcategories: Subcategory[];
};
