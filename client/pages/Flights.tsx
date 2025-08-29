import React from "react";
import { Layout } from "@/components/layout/Layout";
import { SearchPanel } from "@/components/layout/SearchPanel";

export default function Flights() {
  return (
    <Layout showSearch={false}>
      <SearchPanel />
    </Layout>
  );
}
