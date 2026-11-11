export type Owner = "me" | "partner" | "family";
export type Status = "pending" | "kept" | "declined";
export type MarriageType = "love" | "arranged" | "court";
export type ViewMode = "couple" | "family";

export interface Item {
  id: string;
  type: "image" | "note" | "file";
  title?: string;
  src?: string; // data URL for uploaded images
  text?: string; // note body
  fileName?: string;
  tags: string[];
  palette: string[]; // hex colours
  notes?: string;
  owner: Owner;
  status: Status;
  createdAt: number;
}

export interface Theme {
  id: string;
  name: string;
  tags: string[];
  palette: string[];
  items: Item[];
}
