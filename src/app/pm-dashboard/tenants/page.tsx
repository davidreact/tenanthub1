"use client";

import { Suspense } from "react";
import AdminTenants from "@/app/admin/tenants/page";

export default function PMTenants() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminTenants />
    </Suspense>
  );
}