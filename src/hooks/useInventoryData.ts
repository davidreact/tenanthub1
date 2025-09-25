import { useState, useEffect } from "react";
import { createClient } from "../../supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Property, InventoryItem } from "@/types/inventory";

export const useInventoryData = (propertyId?: string) => {
  const [property, setProperty] = useState<Property | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const supabase = createClient();

  const fetchData = async () => {
    try {
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

      setProperty(propertyData);
      setInventoryItems(inventoryData || []);
      setPhotos(photosData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load inventory data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propertyId) {
      fetchData();
    }
  }, [propertyId]);

  return {
    property,
    inventoryItems,
    photos,
    loading,
    refetch: fetchData,
  };
};