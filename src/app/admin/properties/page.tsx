"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "../../../../supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Building,
  Plus,
  Edit,
  Trash2,
  Users,
  Package,
  CreditCard,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";
import { SecurePropertyForm } from "@/components/SecurePropertyForm";

interface Property {
  id: string;
  name: string;
  address: string;
  description: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  square_meters: number;
  monthly_rent: number;
  deposit_amount: number;
  status: string;
  created_at: string;
}

export default function AdminProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const supabase = createClient();
  const pathname = usePathname();

  const scope = pathname.startsWith('/pm-dashboard') ? 'pm' : 'admin';

  useEffect(() => {
    fetchProperties();
  }, [scope]);

  const fetchProperties = async () => {
    try {
      let query = supabase.from("properties").select("*");

      if (scope === 'pm') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          query = query.eq("managed_by", user.id);
        }
      }

      const { data } = await query.order("created_at", { ascending: false });

      setProperties(data || []);
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const createProperty = async (propertyData: Partial<Property>) => {
    try {
      await supabase.from("properties").insert(propertyData);

      fetchProperties(); // Refresh the list
      setIsCreateDialogOpen(false);

      toast({
        title: t("common.propertyCreated"),
        description: t("common.propertyCreatedDescription"),
      });
    } catch (error) {
      console.error("Error creating property:", error);
      toast({
        title: t("common.error"),
        description: t("common.failedToCreateProperty"),
        variant: "destructive",
      });
    }
  };

  const updateProperty = async (
    id: string,
    propertyData: Partial<Property>,
  ) => {
    try {
      await supabase.from("properties").update(propertyData).eq("id", id);

      fetchProperties(); // Refresh the list
      setIsEditing(false);
      setSelectedProperty(null);
      setIsEditDialogOpen(false);

      toast({
        title: t("common.propertyUpdated"),
        description: t("common.propertyUpdatedDescription"),
      });
    } catch (error) {
      console.error("Error updating property:", error);
      toast({
        title: t("common.error"),
        description: t("common.failedToUpdateProperty"),
        variant: "destructive",
      });
    }
  };

  const deleteProperty = async (id: string) => {
    if (!confirm(t("common.areYouSureDeleteProperty"))) return;

    try {
      await supabase.from("properties").delete().eq("id", id);

      fetchProperties(); // Refresh the list

      toast({
        title: t("common.propertyDeleted"),
        description: t("common.propertyDeletedDescription"),
      });
    } catch (error) {
      console.error("Error deleting property:", error);
      toast({
        title: t("common.error"),
        description: t("common.failedToDeleteProperty"),
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "occupied":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "unavailable":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Building className="h-8 w-8 text-emerald-600" />
              </div>
              {t("properties.manageProperties")}
            </h1>
            <p className="text-muted-foreground mt-3">
              {t("properties.addEditManage")}
            </p>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("common.add")} {t("common.property")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                 <DialogHeader>
                   <DialogTitle>
                     {t("common.add")} {t("common.property")}
                   </DialogTitle>
                   <DialogDescription>
                     {t("properties.addEditManage")}
                   </DialogDescription>
                 </DialogHeader>
                 <SecurePropertyForm
                   onSuccess={() => {
                     fetchProperties();
                     setIsCreateDialogOpen(false);
                     toast({
                       title: t("common.propertyCreated"),
                       description: t("common.propertyCreatedDescription"),
                     });
                   }}
                   onCancel={() => setIsCreateDialogOpen(false)}
                 />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <Card
            key={property.id}
            className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-card via-card to-emerald-500/5 border-0 shadow-md hover:shadow-emerald-100/50"
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl font-bold group-hover:text-emerald-600 transition-colors">
                  {property.name}
                </CardTitle>
                <Badge
                  className={`${getStatusColor(property.status)} border-0 shadow-sm`}
                >
                  {property.status === "available"
                    ? t("common.available")
                    : property.status === "occupied"
                      ? t("common.occupied")
                      : property.status === "maintenance"
                        ? t("common.maintenance")
                        : property.status === "unavailable"
                          ? t("common.unavailable")
                          : property.status}
                </Badge>
              </div>
              <CardDescription className="text-sm text-muted-foreground mt-2">
                📍 {property.address}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Property Type and Rent Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground capitalize text-sm">{property.property_type}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-foreground text-lg">{formatCurrency(property.monthly_rent)}</div>
                  <div className="text-muted-foreground text-xs">per month</div>
                </div>
              </div>

              {/* Bedrooms and Bathrooms Row */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-xs">Bedrooms:</span>
                  <span className="font-medium text-foreground">{property.bedrooms}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-xs">Bathrooms:</span>
                  <span className="font-medium text-foreground">{property.bathrooms}</span>
                </div>
              </div>

              {/* Description - show if exists */}
              {property.description && (
                <div className="pt-2 border-t border-border/50">
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {property.description}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t border-border">
                <Dialog
                  open={isEditDialogOpen}
                  onOpenChange={setIsEditDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 hover:bg-muted transition-colors"
                      onClick={() => {
                        setSelectedProperty(property);
                        setIsEditing(true);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      {t("common.edit")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {t("common.edit")} {t("common.property")}
                        </DialogTitle>
                        <DialogDescription>
                          {t("common.modify")}
                        </DialogDescription>
                      </DialogHeader>
                      {selectedProperty && (
                        <SecurePropertyForm
                          initialData={{
                            id: selectedProperty.id,
                            name: selectedProperty.name,
                            address: selectedProperty.address,
                            description: selectedProperty.description,
                            property_type: selectedProperty.property_type,
                            bedrooms: selectedProperty.bedrooms,
                            bathrooms: selectedProperty.bathrooms,
                            square_meters: selectedProperty.square_meters,
                            monthly_rent: selectedProperty.monthly_rent,
                            deposit_amount: selectedProperty.deposit_amount,
                            status: selectedProperty.status as "available" | "occupied" | "maintenance",
                          }}
                          isEditing={true}
                          onSuccess={() => {
                            fetchProperties();
                            setIsEditDialogOpen(false);
                            setSelectedProperty(null);
                            toast({
                              title: t("common.propertyUpdated"),
                              description: t("common.propertyUpdatedDescription"),
                            });
                          }}
                          onCancel={() => {
                            setIsEditDialogOpen(false);
                            setSelectedProperty(null);
                          }}
                        />
                      )}
                    </DialogContent>
                  </Dialog>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteProperty(property.id)}
                  className="hover:bg-destructive/10 hover:border-destructive/20 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Quick Actions */}
              {scope === 'admin' && (
                <div className="grid grid-cols-2 gap-2">
                  <Link href={`/admin/properties/${property.id}/tenants`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-8 text-xs hover:bg-muted"
                    >
                      <Users className="h-3 w-3 mr-1" />
                      Tenants
                    </Button>
                  </Link>
                  <Link href={`/admin/properties/${property.id}/inventory`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-8 text-xs hover:bg-muted"
                    >
                      <Package className="h-3 w-3 mr-1" />
                      Inventory
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {properties.length === 0 && (
        <Card className="bg-gradient-to-br from-card via-card to-emerald-500/5 border-0 shadow-lg">
          <CardContent className="text-center py-16">
            <div className="p-4 bg-emerald-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Building className="h-12 w-12 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">
              {t("common.noProperties")}
            </h3>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              {t("common.noPropertiesDescription")}
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="mt-6 bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("common.add")} {t("common.property")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
