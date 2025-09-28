import { useQuery } from '@tanstack/react-query';
import { createClient } from "../../supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Property, InventoryItem } from "@/types/inventory";

const fetchInventoryData = async (propertyId: string) => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Fetch property details
  const { data: propertyData } = await supabase
    .from("properties")
    .select("id, name, address, status")
    .eq("id", propertyId)
    .single();

  // Fetch inventory items for this property
  const { data: inventoryData } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });

  // Fetch inventory photos
  const { data: photosData } = await supabase
    .from("inventory_photos")
    .select("*")
    .order("created_at", { ascending: false });

  return {
    property: propertyData,
    inventoryItems: inventoryData || [],
    photos: photosData || [],
  };
};

export const useInventoryData = (propertyId?: string) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['inventory', propertyId],
    queryFn: () => fetchInventoryData(propertyId!),
    enabled: !!propertyId,
  });

  return {
    property: data?.property || null,
    inventoryItems: data?.inventoryItems || [],
    photos: data?.photos || [],
    loading: isLoading,
    error,
    refetch,
  };
};