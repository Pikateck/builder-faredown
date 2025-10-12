import React from "react";
import { Header } from "./Header";
import { Footer } from "@/components/Footer";
import { SearchPanel } from "./SearchPanel";
import { MobileBottomNav } from "./MobileBottomNav";
import { useScrollToTop } from "@/hooks/useScrollToTop";

interface LayoutProps {
  children: React.ReactNode;
  showSearch?: boolean;
  showMobileNav?: boolean;
  className?: string;
}

export function Layout({
  children,
  showSearch = true,
  showMobileNav = true,
  className = "",
}: LayoutProps) {
  useScrollToTop();

  const safeAreaInset = "env(safe-area-inset-bottom, 0px)";
  const defaultContainerPadding = "4rem";
  const containerPadding = showMobileNav
    ? `calc(${defaultContainerPadding} + ${safeAreaInset})`
    : defaultContainerPadding;
  const mainPadding = showMobileNav
    ? `calc(6rem + ${safeAreaInset})`
    : undefined;

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col md:pb-0"
      style={{ paddingBottom: containerPadding }}
    >
      <Header />
      {showSearch && <SearchPanel />}
      <main
        className={`flex-1 ${className}`}
        style={{ paddingBottom: mainPadding }}
      >
        {children}
      </main>
      <Footer />
      {showMobileNav && <MobileBottomNav />}
    </div>
  );
}
