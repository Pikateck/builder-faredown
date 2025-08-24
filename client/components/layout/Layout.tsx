import React from "react";
import { Header } from "./Header";
import { Footer } from "@/components/Footer";
import { SearchPanel } from "./SearchPanel";
import { useScrollToTop } from "@/hooks/useScrollToTop";

interface LayoutProps {
  children: React.ReactNode;
  showSearch?: boolean;
  className?: string;
}

export function Layout({ children, showSearch = true, className = "" }: LayoutProps) {
  useScrollToTop();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      {showSearch && <SearchPanel />}
      <main className={`flex-1 ${className}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
