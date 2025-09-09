"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../../supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Package, Camera, MessageSquare } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  condition: string;
  location: string;
  quantity: number;
  estimated_value: number;
  notes: string;
  inventory_photos: Array<{
    id: string;
    photo_url: string;
    caption: string;
  }>;
}

export default function TenantInventory() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [notes, setNotes] = useState("");
  const supabase = createClient();

  useEffect(() => {
    fetchInventoryItems();
  }, []);

  const fetchInventoryItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get tenant's property
      const { data: tenantProperty } = await supabase
        .from('tenant_properties')
        .select('property_id')
        .eq('tenant_id', user.id)
        .eq('status', 'active')
        .single();

      if (!tenantProperty) return;

      // Get inventory items with photos
      const { data: items } = await supabase
        .from('inventory_items')
        .select(`
          *,
          inventory_photos (*)
        `)
        .eq('property_id', tenantProperty.property_id)
        .order('name');

      setInventoryItems(items || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateItemNotes = async (itemId: string, newNotes: string) => {
    try {
      await supabase
        .from('inventory_items')
        .update({ notes: newNotes })
        .eq('id', itemId);
      
      // Update local state
      setInventoryItems(items => 
        items.map(item => 
          item.id === itemId ? { ...item, notes: newNotes } : item
        )
      );
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-8 w-8" />
            Property Inventory
          </h1>
          <p className="text-gray-600 mt-2">
            Review your property's inventory and add notes before signing
          </p>
        </div>

        {/* Inventory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventoryItems.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <Badge className={getConditionColor(item.condition)}>
                    {item.condition}
                  </Badge>
                </div>
                <CardDescription>{item.location}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Photos */}
                {item.inventory_photos.length > 0 && (
                  <div className="relative h-48 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={item.inventory_photos[0].photo_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                    {item.inventory_photos.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        +{item.inventory_photos.length - 1} more
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Description:</span> {item.description}</p>
                  <p><span className="font-medium">Quantity:</span> {item.quantity}</p>
                  <p><span className="font-medium">Estimated Value:</span> ${item.estimated_value}</p>
                  {item.notes && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="font-medium text-blue-800">Your Notes:</p>
                      <p className="text-blue-700 text-sm">{item.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          setSelectedItem(item);
                          setNotes(item.notes || "");
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Add Notes
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Notes for {selectedItem?.name}</DialogTitle>
                        <DialogDescription>
                          Add any observations or comments about this item's condition
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Enter your notes about this item..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={4}
                        />
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => {
                              if (selectedItem) {
                                updateItemNotes(selectedItem.id, notes);
                              }
                            }}
                            className="flex-1"
                          >
                            Save Notes
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {item.inventory_photos.length > 0 && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Camera className="h-4 w-4 mr-2" />
                          View Photos
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>{item.name} - Photos</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                          {item.inventory_photos.map((photo) => (
                            <div key={photo.id} className="space-y-2">
                              <div className="relative h-48 bg-gray-100 rounded-lg overflow-hidden">
                                <Image
                                  src={photo.photo_url}
                                  alt={photo.caption || item.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              {photo.caption && (
                                <p className="text-sm text-gray-600">{photo.caption}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {inventoryItems.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Inventory Items</h3>
              <p className="text-gray-600">No inventory items found for your property.</p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center">
          <Button size="lg" className="px-8">
            Sign Inventory Document
          </Button>
        </div>
      </div>
    </div>
  );
}