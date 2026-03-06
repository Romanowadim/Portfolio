"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "@/components/admin/AdminProvider";
import { useRouter } from "@/i18n/navigation";
import { artworks as staticArtworks, Artwork } from "@/data/artworks";
import ArtworkFormModal from "@/components/admin/ArtworkFormModal";
import ArtworkModal from "@/components/portfolio/ArtworkModal";
import ContactPickerModal from "@/components/admin/ContactPickerModal";
import CoworkerPickerModal from "@/components/admin/CoworkerPickerModal";
import CategoryFormModal from "@/components/admin/CategoryFormModal";
import type { Contact, Coworker } from "@/lib/blob";
import type { Equipment } from "@/data/equipment";
import type { Category, Subcategory } from "@/types/category";
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import StatisticSection from "@/components/cabinet/StatisticSection";
import CardsSection from "@/components/cabinet/CardsSection";
import ContactsSection from "@/components/cabinet/ContactsSection";
import CoworkersSection from "@/components/cabinet/CoworkersSection";
import CategoriesSection from "@/components/cabinet/CategoriesSection";
import SettingsSection from "@/components/cabinet/SettingsSection";

const staticIds = new Set(staticArtworks.map((a) => a.id));

const sections = [{ key: "statistic" }, { key: "cards" }, { key: "categories" }, { key: "contacts" }, { key: "coworkers" }, { key: "settings" }] as const;

export default function CabinetPage() {
  const { isAdmin } = useAdmin();
  const router = useRouter();
  const locale = useLocale() as "ru" | "en";
  const t = useTranslations("admin");

  const socialSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const [activeSection, setActiveSectionRaw] = useState<string | null>("statistic");
  const [sectionRestored, setSectionRestored] = useState(false);
  useEffect(() => {
    if (sectionRestored) return;
    const saved = sessionStorage.getItem("cabinet-section");
    if (saved) setActiveSectionRaw(saved);
    setSectionRestored(true);
  }, [sectionRestored]);
  const setActiveSection = (s: string | null) => {
    setActiveSectionRaw(s);
    if (typeof window !== "undefined") {
      if (s) sessionStorage.setItem("cabinet-section", s);
      else sessionStorage.removeItem("cabinet-section");
    }
  };

  const [sortBy, setSortBy] = useState<"popularity" | "date" | "category">("date");
  const [viewCounts, setViewCounts] = useState<Record<string, { total: number; recent: number }>>({});
  const [dynamicArtworks, setDynamicArtworks] = useState<Artwork[]>([]);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [viewingArtwork, setViewingArtwork] = useState<Artwork | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [initialImageUrl, setInitialImageUrl] = useState<string | undefined>();
  const [createForContactId, setCreateForContactId] = useState<string | undefined>();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isCreatingContact, setIsCreatingContact] = useState(false);

  const [coworkers, setCoworkers] = useState<Coworker[]>([]);
  const [editingCoworker, setEditingCoworker] = useState<Coworker | null>(null);
  const [isCreatingCoworker, setIsCreatingCoworker] = useState(false);

  const [clickCounts, setClickCounts] = useState<Record<string, { total: number; recent: number }>>({});

  const [siteSocials, setSiteSocials] = useState<{ name: string; url: string; icon: string }[]>([]);
  const [socialsSaving, setSocialsSaving] = useState(false);

  const [heroImage, setHeroImage] = useState("/images/hero.png");
  const [heroImages, setHeroImages] = useState<{ url: string; title: string; year: string; tools: string }[]>([{ url: "/images/hero.png", title: "", year: "", tools: "" }]);
  const [heroSaving, setHeroSaving] = useState(false);
  const [heroMetaEditing, setHeroMetaEditing] = useState<{ url: string; title: string; year: string; tools: string } | null>(null);

  const [equipmentItems, setEquipmentItems] = useState<Equipment[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryViewCounts, setCategoryViewCounts] = useState<Record<string, { total: number; recent: number }>>({});
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null);
  type CatModalMode =
    | { type: "newCategory" }
    | { type: "editCategory"; category: Category }
    | { type: "newSubcategory"; parentId: string }
    | { type: "editSubcategory"; parentId: string; subcategory: Subcategory };
  const [catModalMode, setCatModalMode] = useState<CatModalMode | null>(null);

  const openCreate = (imageUrl?: string) => {
    setInitialImageUrl(imageUrl);
    setIsCreating(true);
  };

  useEffect(() => {
    if (!isAdmin) router.replace("/");
  }, [isAdmin, router]);

  useEffect(() => {
    fetch("/api/site-settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.heroImage) setHeroImage(d.heroImage);
        if (Array.isArray(d.heroImages)) {
          setHeroImages(d.heroImages.map((img: unknown) =>
            typeof img === "string"
              ? { url: img, title: "", year: "", tools: "" }
              : img as { url: string; title: string; year: string; tools: string }
          ));
        }
        if (Array.isArray(d.socials)) setSiteSocials(d.socials);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/equipment")
      .then((r) => r.json())
      .then((data: Equipment[]) => { if (Array.isArray(data)) setEquipmentItems(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data: Category[]) => setCategories((prev) => prev.length === 0 ? (Array.isArray(data) ? data : []) : prev))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeSection !== "cards") return;
    fetch("/api/stats").then((r) => r.json()).then(setViewCounts).catch(() => {});
    fetch("/api/artworks").then((r) => r.json()).then((data: Artwork[]) => setDynamicArtworks(data)).catch(() => {});
    fetch("/api/deleted-artworks").then((r) => r.json()).then((data: string[]) => setDeletedIds(new Set(data))).catch(() => {});
    fetch("/api/hidden-artworks").then((r) => r.json()).then((data: string[]) => setHiddenIds(new Set(data))).catch(() => {});
  }, [activeSection]);

  useEffect(() => {
    if (activeSection !== "contacts") return;
    fetch("/api/contacts").then((r) => r.json()).then((data: Contact[]) => setContacts(Array.isArray(data) ? data : [])).catch(() => {});
    fetch("/api/artworks").then((r) => r.json()).then((data: Artwork[]) => setDynamicArtworks(data)).catch(() => {});
    fetch("/api/stats").then((r) => r.json()).then(setViewCounts).catch(() => {});
    fetch("/api/stats/contact-click").then((r) => r.json()).then(setClickCounts).catch(() => {});
  }, [activeSection]);

  useEffect(() => {
    if (activeSection !== "coworkers") return;
    fetch("/api/coworkers").then((r) => r.json()).then((data: Coworker[]) => setCoworkers(Array.isArray(data) ? data : [])).catch(() => {});
    fetch("/api/artworks").then((r) => r.json()).then((data: Artwork[]) => setDynamicArtworks(data)).catch(() => {});
    fetch("/api/stats").then((r) => r.json()).then(setViewCounts).catch(() => {});
    fetch("/api/stats/contact-click").then((r) => r.json()).then(setClickCounts).catch(() => {});
  }, [activeSection]);

  useEffect(() => {
    if (activeSection !== "categories") return;
    fetch("/api/categories").then((r) => r.json()).then((data: Category[]) => setCategories(Array.isArray(data) ? data : [])).catch(() => {});
    fetch("/api/stats/category-views").then((r) => r.json()).then((data: Record<string, { total: number; recent: number }>) => setCategoryViewCounts(data)).catch(() => {});
    fetch("/api/artworks").then((r) => r.json()).then((data: Artwork[]) => setDynamicArtworks(data)).catch(() => {});
    fetch("/api/deleted-artworks").then((r) => r.json()).then((data: string[]) => setDeletedIds(new Set(data))).catch(() => {});
  }, [activeSection]);

  const catSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleCatDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(categories, oldIndex, newIndex);
      setCategories(reordered);
      fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reordered),
      }).catch(() => {});
    },
    [categories]
  );

  const handleToggleHidden = async (id: string) => {
    const isCurrentlyHidden = hiddenIds.has(id);
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyHidden) next.delete(id);
      else next.add(id);
      return next;
    });
    try {
      const res = await fetch("/api/hidden-artworks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, hidden: !isCurrentlyHidden }),
      });
      const data: string[] = await res.json();
      setHiddenIds(new Set(data));
    } catch {}
  };

  if (!isAdmin) return null;

  // Merge static + dynamic; dynamic overrides static (same id); filter deleted
  const artworkMap = new Map<string, Artwork>();
  for (const a of staticArtworks) artworkMap.set(a.id, a);
  for (const a of dynamicArtworks) artworkMap.set(a.id, a);
  const allArtworks = Array.from(artworkMap.values()).filter((a) => !deletedIds.has(a.id));

  // Count artworks per category / subcategory key
  const artworkCounts: Record<string, number> = {};
  for (const a of allArtworks) {
    artworkCounts[a.category] = (artworkCounts[a.category] ?? 0) + 1;
    if (a.subcategory) {
      artworkCounts[`${a.category}/${a.subcategory}`] = (artworkCounts[`${a.category}/${a.subcategory}`] ?? 0) + 1;
    }
  }

  const sortedArtworks = sortBy === "popularity"
    ? [...allArtworks].sort((a, b) => (viewCounts[b.id]?.total ?? 0) - (viewCounts[a.id]?.total ?? 0))
    : [...allArtworks].sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });

  const categoryOrder = categories.length > 0
    ? categories.map((c) => c.id)
    : [...new Set(allArtworks.map((a) => a.category))];

  const categoryLabel = (catId: string) => {
    const found = categories.find((c) => c.id === catId);
    if (found) return found.label[locale];
    const key = `category${catId.charAt(0).toUpperCase()}${catId.slice(1)}` as Parameters<typeof t>[0];
    try { return t(key); } catch { return catId; }
  };

  const groupedByCategory: { category: string; artworks: Artwork[] }[] =
    sortBy === "category"
      ? categoryOrder
          .map((cat) => ({ category: cat, artworks: allArtworks.filter((a) => a.category === cat) }))
          .filter((g) => g.artworks.length > 0)
      : [];

  return (
    <>
      <div className="relative z-10 flex flex-col h-full py-6 lg:py-0">
        <div className="flex-1 flex items-center">
          <div className="flex flex-col gap-[28px]">
            {sections.map((section, i) => (
              <motion.div
                key={section.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, transition: { delay: 0, duration: 0.3 } }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.4, ease: "easeOut" }}
              >
                <button
                  onClick={() =>
                    setActiveSection(activeSection === section.key ? null : section.key)
                  }
                  className={`h-[30px] flex items-center text-sm font-bold tracking-[2.8px] uppercase transition-colors ${
                    activeSection === section.key
                      ? "text-text-muted"
                      : "text-text-light hover:text-text-muted"
                  }`}
                >
                  {t(section.key)}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeSection === "statistic" && (
          <StatisticSection />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeSection === "cards" && (
          <CardsSection
            locale={locale}
            allArtworks={allArtworks}
            sortedArtworks={sortedArtworks}
            groupedByCategory={groupedByCategory}
            viewCounts={viewCounts}
            hiddenIds={hiddenIds}
            sortBy={sortBy}
            setSortBy={setSortBy}
            categories={categories}
            categoryLabel={categoryLabel}
            onEditArtwork={setEditingArtwork}
            onDeletedArtwork={(id) => {
              setDynamicArtworks((prev) => prev.filter((a) => a.id !== id));
              setDeletedIds((prev) => new Set([...prev, id]));
            }}
            onNavigateArtwork={(artwork) => router.push(`/portfolio?artwork=${artwork.id}`)}
            onToggleHidden={handleToggleHidden}
            onCreateArtwork={openCreate}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeSection === "contacts" && (
          <ContactsSection
            locale={locale}
            contacts={contacts}
            allArtworks={allArtworks}
            viewCounts={viewCounts}
            clickCounts={clickCounts}
            onEditContact={setEditingContact}
            onDeletedContact={(id) => setContacts((prev) => prev.filter((c) => c.id !== id))}
            onCreateContact={() => setIsCreatingContact(true)}
            onViewArtwork={setViewingArtwork}
            onCreateArtworkForContact={(contactId) => { setCreateForContactId(contactId); setIsCreating(true); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeSection === "coworkers" && (
          <CoworkersSection
            locale={locale}
            coworkers={coworkers}
            allArtworks={allArtworks}
            viewCounts={viewCounts}
            clickCounts={clickCounts}
            onEditCoworker={setEditingCoworker}
            onDeletedCoworker={(id) => setCoworkers((prev) => prev.filter((c) => c.id !== id))}
            onCreateCoworker={() => setIsCreatingCoworker(true)}
            onViewArtwork={setViewingArtwork}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeSection === "categories" && (
          <CategoriesSection
            locale={locale}
            categories={categories}
            categoryViewCounts={categoryViewCounts}
            artworkCounts={artworkCounts}
            expandedCatId={expandedCatId}
            setExpandedCatId={setExpandedCatId}
            catSensors={catSensors}
            handleCatDragEnd={handleCatDragEnd}
            onNewCategory={() => setCatModalMode({ type: "newCategory" })}
            onEditCategory={(cat) => setCatModalMode({ type: "editCategory", category: cat })}
            onEditSubcategory={(parentId, sub) => setCatModalMode({ type: "editSubcategory", parentId, subcategory: sub })}
            onAddSubcategory={(parentId) => setCatModalMode({ type: "newSubcategory", parentId })}
            onReorderSubs={(catId, reordered) => {
              const updated = categories.map((c) =>
                c.id === catId ? { ...c, subcategories: reordered } : c
              );
              setCategories(updated);
              fetch("/api/categories", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updated),
              }).catch(() => {});
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeSection === "settings" && (
          <SettingsSection
            siteSocials={siteSocials}
            setSiteSocials={setSiteSocials}
            socialsSaving={socialsSaving}
            setSocialsSaving={setSocialsSaving}
            heroImage={heroImage}
            setHeroImage={setHeroImage}
            heroImages={heroImages}
            setHeroImages={setHeroImages}
            heroSaving={heroSaving}
            setHeroSaving={setHeroSaving}
            heroMetaEditing={heroMetaEditing}
            setHeroMetaEditing={setHeroMetaEditing}
            equipmentItems={equipmentItems}
            setEquipmentItems={setEquipmentItems}
            socialSensors={socialSensors}
          />
        )}
      </AnimatePresence>

      {/* Create artwork modal */}
      <AnimatePresence>
        {isCreating && (
          <ArtworkFormModal
            key="new"
            category={categories.length > 0 ? categories[0].id : "personal"}
            categories={categories}
            initialImageUrl={initialImageUrl}
            initialContactId={createForContactId}
            onClose={() => { setIsCreating(false); setCreateForContactId(undefined); }}
            onSaved={(created) => {
              setDynamicArtworks((prev) => [...prev, created]);
              setIsCreating(false);
              setCreateForContactId(undefined);
            }}
          />
        )}
      </AnimatePresence>

      {/* Contact create modal */}
      <AnimatePresence>
        {isCreatingContact && (
          <ContactPickerModal
            key="new-contact"
            onClose={() => setIsCreatingContact(false)}
            onSaved={(contact) => {
              setContacts((prev) => [...prev, contact]);
              setIsCreatingContact(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Contact edit modal */}
      <AnimatePresence>
        {editingContact && (
          <ContactPickerModal
            key={editingContact.id}
            contact={editingContact}
            onClose={() => setEditingContact(null)}
            onSaved={(updated) => {
              setContacts((prev) => prev.map((c) => c.id === updated.id ? updated : c));
              setEditingContact(null);
            }}
            onDeleted={(id) => {
              setContacts((prev) => prev.filter((c) => c.id !== id));
              setEditingContact(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Coworker create modal */}
      <AnimatePresence>
        {isCreatingCoworker && (
          <CoworkerPickerModal
            key="new-coworker"
            onClose={() => setIsCreatingCoworker(false)}
            onSaved={(coworker) => {
              setCoworkers((prev) => [...prev, coworker]);
              setIsCreatingCoworker(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Coworker edit modal */}
      <AnimatePresence>
        {editingCoworker && (
          <CoworkerPickerModal
            key={editingCoworker.id}
            coworker={editingCoworker}
            onClose={() => setEditingCoworker(null)}
            onSaved={(updated) => {
              setCoworkers((prev) => prev.map((c) => c.id === updated.id ? updated : c));
              setEditingCoworker(null);
            }}
            onDeleted={(id) => {
              setCoworkers((prev) => prev.filter((c) => c.id !== id));
              setEditingCoworker(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Edit artwork modal */}
      <AnimatePresence>
        {editingArtwork && (
          <ArtworkFormModal
            key={editingArtwork.id}
            category={editingArtwork.category}
            subcategory={editingArtwork.subcategory}
            categories={categories}
            artwork={editingArtwork}
            onClose={() => setEditingArtwork(null)}
            onSaved={(updated) => {
              setDynamicArtworks((prev) =>
                prev.some((a) => a.id === updated.id)
                  ? prev.map((a) => (a.id === updated.id ? updated : a))
                  : [...prev, updated]
              );
              setEditingArtwork(null);
            }}
            onDeleted={(id) => {
              setDynamicArtworks((prev) => prev.filter((a) => a.id !== id));
              setEditingArtwork(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Category form modal */}
      <AnimatePresence>
        {catModalMode && (
          <CategoryFormModal
            key={JSON.stringify(catModalMode)}
            mode={catModalMode}
            categories={categories}
            onClose={() => setCatModalMode(null)}
            onSaved={(updated) => {
              setCategories(updated);
              setCatModalMode(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Artwork viewing modal */}
      <AnimatePresence>
        {viewingArtwork && (
          <ArtworkModal
            key={viewingArtwork.id}
            artwork={viewingArtwork}
            onClose={() => setViewingArtwork(null)}
            onEdit={() => { setEditingArtwork(viewingArtwork); setViewingArtwork(null); }}
            isHidden={hiddenIds.has(viewingArtwork.id)}
            onToggleHidden={() => handleToggleHidden(viewingArtwork.id)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
