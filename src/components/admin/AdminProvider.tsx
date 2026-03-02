"use client";

import { createContext, useContext, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";

type AdminContextType = {
  isAdmin: boolean;
  logout: () => void;
};

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  logout: () => {},
});

export function useAdmin() {
  return useContext(AdminContext);
}

export default function AdminProvider({
  initialIsAdmin,
  children,
}: {
  initialIsAdmin: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();

  const logout = useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }, [router]);

  return (
    <AdminContext.Provider value={{ isAdmin: initialIsAdmin, logout }}>
      {children}
    </AdminContext.Provider>
  );
}
