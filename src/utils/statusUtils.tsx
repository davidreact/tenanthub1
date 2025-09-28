import React from "react";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

/**
 * Returns the appropriate icon component for a given status.
 */
export const getStatusIcon = (status: string): React.ReactElement => {
  switch (status) {
    case "approved":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case "rejected":
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    default:
      return <Clock className="h-4 w-4 text-gray-600" />;
  }
};

/**
 * Returns the appropriate Tailwind CSS classes for status badges.
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

/**
 * Formats a month-year string (e.g., "2023-10") into a readable format.
 */
export const formatMonthYear = (monthYear: string): string => {
  const [year, month] = monthYear.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

/**
 * Returns condition color classes for inventory items.
 */
export const getConditionColor = (condition: string): string => {
  switch (condition.toLowerCase()) {
    case "excellent":
      return "bg-green-100 text-green-800";
    case "good":
      return "bg-blue-100 text-blue-800";
    case "fair":
      return "bg-yellow-100 text-yellow-800";
    case "poor":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};