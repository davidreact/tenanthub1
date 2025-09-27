"use client";

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { createClient } from "../../supabase/client";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [propertyNames, setPropertyNames] = useState<Record<string, string>>({});
  const [loadingProperties, setLoadingProperties] = useState<Set<string>>(new Set());
  const supabase = createClient();

  // Function to fetch property name by ID
  const fetchPropertyName = async (propertyId: string) => {
    if (propertyNames[propertyId] || loadingProperties.has(propertyId)) {
      return; // Already fetched or currently loading
    }

    setLoadingProperties(prev => new Set(prev).add(propertyId));

    try {
      const { data } = await supabase
        .from("properties")
        .select("name")
        .eq("id", propertyId)
        .single();

      if (data?.name) {
        setPropertyNames(prev => ({
          ...prev,
          [propertyId]: data.name
        }));
      }
    } catch (error) {
      console.error("Error fetching property name:", error);
    } finally {
      setLoadingProperties(prev => {
        const newSet = new Set(prev);
        newSet.delete(propertyId);
        return newSet;
      });
    }
  };

  // Generate breadcrumbs from pathname if items not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: "Home", href: "/" }
    ];

    // Map common segments to readable labels
    const segmentLabels: Record<string, string> = {
      dashboard: t("nav.dashboard"),
      "pm-dashboard": "Property Manager Dashboard",
      admin: t("dashboard.adminDashboard"),
      tenant: t("dashboard.tenantDashboard"),
      properties: t("properties.manageProperties"),
      tenants: t("tenants.manageTenants"),
      inventory: t("inventory.inventory"),
      payments: t("payments.paymentManagement"),
      conversations: t("messages.conversations"),
      handovers: t("handover.keyHandovers"),
      messages: t("messages.messages"),
      handover: t("handover.keyHandover"),
      profile: "Profile",
    };

    let currentPath = "";
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Handle property IDs - fetch property name instead of showing ID
      if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(segment)) {
        // This looks like a UUID (property ID)
        const propertyName = propertyNames[segment];
        const label = propertyName || "Loading...";

        // Fetch property name if not already cached
        if (!propertyName && !loadingProperties.has(segment)) {
          fetchPropertyName(segment);
        }

        // For property IDs, redirect to the properties list page instead of the non-existent property page
        breadcrumbs.push({
          label,
          href: "/admin/properties"
        });
        return;
      }

      // Skip other dynamic segments
      if (segment.startsWith('[')) {
        return;
      }

      const label = segmentLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

      // Fix routing for admin and tenant sections
      let href = currentPath;
      if (segment === 'admin') {
        href = '/admin';
      } else if (segment === 'tenant') {
        href = '/tenant';
      } else if (segment === 'pm-dashboard') {
        href = '/pm-dashboard';
      }

      breadcrumbs.push({
        label,
        href
      });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = items || generateBreadcrumbs();

  if (breadcrumbItems.length <= 1) return null;

  return (
    <nav
      className={`flex items-center space-x-2 px-6 py-3 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 shadow-sm text-sm ${className}`}
      aria-label="Breadcrumb"
    >
      {breadcrumbItems.map((item, index) => (
        <Fragment key={item.href}>
          {index === 0 ? (
            <Link
              href={item.href}
              className="flex items-center px-2 py-1 rounded-md hover:bg-primary/10 hover:text-primary transition-all duration-200 font-medium"
            >
              <Home className="h-4 w-4 mr-1" />
              <span className="sr-only">{item.label}</span>
            </Link>
          ) : index === breadcrumbItems.length - 1 ? (
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-md font-semibold" aria-current="page">
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              className="px-2 py-1 rounded-md hover:bg-primary/10 hover:text-primary transition-all duration-200 font-medium"
            >
              {item.label}
            </Link>
          )}
          {index < breadcrumbItems.length - 1 && (
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
          )}
        </Fragment>
      ))}
    </nav>
  );
}