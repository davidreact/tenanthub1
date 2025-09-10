"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../../supabase/client";
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

interface Property {
  id: string;
  name: string;
  address: string;
  description: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
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
  const supabase = createClient();

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const { data } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

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
    } catch (error) {
      console.error("Error creating property:", error);
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
    } catch (error) {
      console.error("Error updating property:", error);
    }
  };

  const deleteProperty = async (id: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;

    try {
      await supabase.from("properties").delete().eq("id", id);

      fetchProperties(); // Refresh the list
    } catch (error) {
      console.error("Error deleting property:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "occupied":
        return "bg-blue-100 text-blue-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      case "unavailable":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Building className="h-8 w-8" />
                Property Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage all properties in your portfolio
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Property</DialogTitle>
                  <DialogDescription>
                    Create a new property listing
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const propertyData = {
                      name: formData.get("name") as string,
                      address: formData.get("address") as string,
                      description: formData.get("description") as string,
                      property_type: formData.get("property_type") as string,
                      bedrooms: parseInt(formData.get("bedrooms") as string),
                      bathrooms: parseInt(formData.get("bathrooms") as string),
                      square_feet: parseInt(
                        formData.get("square_feet") as string,
                      ),
                      monthly_rent: parseFloat(
                        formData.get("monthly_rent") as string,
                      ),
                      deposit_amount: parseFloat(
                        formData.get("deposit_amount") as string,
                      ),
                      status: formData.get("status") as string,
                    };

                    createProperty(propertyData);
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Property Name</Label>
                      <Input id="name" name="name" required />
                    </div>
                    <div>
                      <Label htmlFor="property_type">Property Type</Label>
                      <Select name="property_type" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="house">House</SelectItem>
                          <SelectItem value="condo">Condo</SelectItem>
                          <SelectItem value="studio">Studio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea id="address" name="address" required />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" rows={3} />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="bedrooms">Bedrooms</Label>
                      <Input
                        id="bedrooms"
                        name="bedrooms"
                        type="number"
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="bathrooms">Bathrooms</Label>
                      <Input
                        id="bathrooms"
                        name="bathrooms"
                        type="number"
                        min="0"
                        step="0.5"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="square_feet">Square Feet</Label>
                      <Input
                        id="square_feet"
                        name="square_feet"
                        type="number"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="monthly_rent">Monthly Rent ($)</Label>
                      <Input
                        id="monthly_rent"
                        name="monthly_rent"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="deposit_amount">Deposit Amount ($)</Label>
                      <Input
                        id="deposit_amount"
                        name="deposit_amount"
                        type="number"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="occupied">Occupied</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="unavailable">Unavailable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" className="w-full">
                    Create Property
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Card
              key={property.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{property.name}</CardTitle>
                  <Badge className={getStatusColor(property.status)}>
                    {property.status}
                  </Badge>
                </div>
                <CardDescription className="text-sm">
                  {property.address}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <p className="font-medium capitalize">
                      {property.property_type}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Rent:</span>
                    <p className="font-medium">${property.monthly_rent}/mo</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Bedrooms:</span>
                    <p className="font-medium">{property.bedrooms}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Bathrooms:</span>
                    <p className="font-medium">{property.bathrooms}</p>
                  </div>
                </div>

                {property.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {property.description}
                  </p>
                )}

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedProperty(property);
                          setIsEditing(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Edit Property</DialogTitle>
                        <DialogDescription>
                          Update property information
                        </DialogDescription>
                      </DialogHeader>
                      {selectedProperty && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const propertyData = {
                              name: formData.get("name") as string,
                              address: formData.get("address") as string,
                              description: formData.get(
                                "description",
                              ) as string,
                              property_type: formData.get(
                                "property_type",
                              ) as string,
                              bedrooms: parseInt(
                                formData.get("bedrooms") as string,
                              ),
                              bathrooms: parseInt(
                                formData.get("bathrooms") as string,
                              ),
                              square_feet: parseInt(
                                formData.get("square_feet") as string,
                              ),
                              monthly_rent: parseFloat(
                                formData.get("monthly_rent") as string,
                              ),
                              deposit_amount: parseFloat(
                                formData.get("deposit_amount") as string,
                              ),
                              status: formData.get("status") as string,
                            };

                            updateProperty(selectedProperty.id, propertyData);
                          }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="edit-name">Property Name</Label>
                              <Input
                                id="edit-name"
                                name="name"
                                defaultValue={selectedProperty.name}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-property_type">
                                Property Type
                              </Label>
                              <Select
                                name="property_type"
                                defaultValue={selectedProperty.property_type}
                                required
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="apartment">
                                    Apartment
                                  </SelectItem>
                                  <SelectItem value="house">House</SelectItem>
                                  <SelectItem value="condo">Condo</SelectItem>
                                  <SelectItem value="studio">Studio</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="edit-address">Address</Label>
                            <Textarea
                              id="edit-address"
                              name="address"
                              defaultValue={selectedProperty.address}
                              required
                            />
                          </div>

                          <div>
                            <Label htmlFor="edit-description">
                              Description
                            </Label>
                            <Textarea
                              id="edit-description"
                              name="description"
                              defaultValue={selectedProperty.description}
                              rows={3}
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor="edit-bedrooms">Bedrooms</Label>
                              <Input
                                id="edit-bedrooms"
                                name="bedrooms"
                                type="number"
                                min="0"
                                defaultValue={selectedProperty.bedrooms}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-bathrooms">Bathrooms</Label>
                              <Input
                                id="edit-bathrooms"
                                name="bathrooms"
                                type="number"
                                min="0"
                                step="0.5"
                                defaultValue={selectedProperty.bathrooms}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-square_feet">
                                Square Feet
                              </Label>
                              <Input
                                id="edit-square_feet"
                                name="square_feet"
                                type="number"
                                min="0"
                                defaultValue={selectedProperty.square_feet}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="edit-monthly_rent">
                                Monthly Rent ($)
                              </Label>
                              <Input
                                id="edit-monthly_rent"
                                name="monthly_rent"
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue={selectedProperty.monthly_rent}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-deposit_amount">
                                Deposit Amount ($)
                              </Label>
                              <Input
                                id="edit-deposit_amount"
                                name="deposit_amount"
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue={selectedProperty.deposit_amount}
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="edit-status">Status</Label>
                            <Select
                              name="status"
                              defaultValue={selectedProperty.status}
                              required
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="available">
                                  Available
                                </SelectItem>
                                <SelectItem value="occupied">
                                  Occupied
                                </SelectItem>
                                <SelectItem value="maintenance">
                                  Maintenance
                                </SelectItem>
                                <SelectItem value="unavailable">
                                  Unavailable
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <Button type="submit" className="w-full">
                            Update Property
                          </Button>
                        </form>
                      )}
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteProperty(property.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex gap-2 pt-2">
                  <Link
                    href={`/admin/properties/${property.id}/tenants`}
                    className="flex-1"
                  >
                    <Button variant="secondary" size="sm" className="w-full">
                      <Users className="h-4 w-4 mr-2" />
                      Tenants
                    </Button>
                  </Link>
                  <Link
                    href={`/admin/properties/${property.id}/inventory`}
                    className="flex-1"
                  >
                    <Button variant="secondary" size="sm" className="w-full">
                      <Package className="h-4 w-4 mr-2" />
                      Inventory
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {properties.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Properties
              </h3>
              <p className="text-gray-600">
                Add your first property to get started.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
