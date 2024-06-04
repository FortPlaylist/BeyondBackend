export interface Variant {
  channel: string;
  active: string;
  owned: string[];
}

export interface CosmeticSet {
  id: string;
  value: string;
}

export interface VariantJSON {
  id: string;
  variants: Variant[];
}
