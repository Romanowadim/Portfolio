import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import type { Artwork } from "@/data/artworks";

export type Contact = {
  id: string;
  clientName: string;
  client?: string;
  clientRole?: string;
  clientAvatar?: string;
  clientSocials?: { icon: string; url: string }[];
};

export type Coworker = {
  id: string;
  name: string;
  role?: string;
  avatar?: string;
  socials?: { icon: string; url: string }[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const ARTWORKS_FILE = path.join(DATA_DIR, "artworks.json");
const CONTACTS_FILE = path.join(DATA_DIR, "contacts.json");
const COWORKERS_FILE = path.join(DATA_DIR, "coworkers.json");
export async function readDynamicArtworks(): Promise<Artwork[]> {
  try {
    const content = await readFile(ARTWORKS_FILE, "utf-8");
    return JSON.parse(content) as Artwork[];
  } catch {
    return [];
  }
}

export async function writeDynamicArtworks(artworks: Artwork[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(ARTWORKS_FILE, JSON.stringify(artworks, null, 2), "utf-8");
}

export async function readContacts(): Promise<Contact[]> {
  try {
    const content = await readFile(CONTACTS_FILE, "utf-8");
    return JSON.parse(content) as Contact[];
  } catch {
    return [];
  }
}

export async function writeContacts(contacts: Contact[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(CONTACTS_FILE, JSON.stringify(contacts, null, 2), "utf-8");
}

export async function readCoworkers(): Promise<Coworker[]> {
  try {
    const content = await readFile(COWORKERS_FILE, "utf-8");
    return JSON.parse(content) as Coworker[];
  } catch {
    return [];
  }
}

export async function writeCoworkers(coworkers: Coworker[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(COWORKERS_FILE, JSON.stringify(coworkers, null, 2), "utf-8");
}

