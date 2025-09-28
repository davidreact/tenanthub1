"use client";

import { Suspense } from "react";
import AdminConversations from "@/app/admin/conversations/page";

export default function PMMessages() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminConversations />
    </Suspense>
  );
}