"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../../supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Users, Plus, Edit, UserX, UserCheck, Building } from "lucide-react";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  full_name: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface TenantProperty {
  id: string;
  tenant_id: string;
  property_id: string;
  lease_start_date: string;
  lease_end_date: string;
  monthly_rent: number;
  status: string;
  properties: {
    name: string;
    address: string;
  };
}

interface Property {
  id: string;
  name: string;
  address: string;
  status: string;
}

export default function AdminTenants() {
  const [tenants, setTenants] = useState<User[]>([]);
  const [tenantProperties, setTenantProperties] = useState<TenantProperty[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch tenants
      const { data: tenantsData } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'tenant')
        .order('created_at', { ascending: false });

      // Fetch tenant properties
      const { data: tenantPropsData } = await supabase
        .from('tenant_properties')
        .select(`
          *,
          properties (name, address)
        `)
        .order('created_at', { ascending: false });

      // Fetch available properties
      const { data: propertiesData } = await supabase
        .from('properties')
        .select('id, name, address, status')
        .order('name');

      setTenants(tenantsData || []);
      setTenantProperties(tenantPropsData || []);
      setProperties(propertiesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTenant = async (email: string, fullName: string, password: string) => {
    try {
      // In a real app, you'd use Supabase Auth Admin API to create users
      // For demo purposes, we'll just show the form
      console.log('Creating tenant:', { email, fullName, password });
      alert('Tenant creation would be handled by Supabase Auth Admin API');
    } catch (error) {
      console.error('Error creating tenant:', error);
    }
  };

  const toggleTenantStatus = async (tenantId: string, isActive: boolean) => {
    try {
      await supabase
        .from('users')
        .update({ is_active: !isActive })
        .eq('id', tenantId);

      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Error updating tenant status:', error);
    }
  };

  const assignProperty = async (tenantId: string, propertyId: string, leaseStart: string, leaseEnd: string, monthlyRent: number) => {
    try {
      await supabase
        .from('tenant_properties')
        .insert({
          tenant_id: tenantId,
          property_id: propertyId,
          lease_start_date: leaseStart,
          lease_end_date: leaseEnd,
          monthly_rent: monthlyRent,
          status: 'active'
        });

      // Update property status to occupied
      await supabase
        .from('properties')
        .update({ status: 'occupied' })
        .eq('id', propertyId);

      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Error assigning property:', error);
    }
  };

  const getTenantProperty = (tenantId: string) => {
    return tenantProperties.find(tp => tp.tenant_id === tenantId && tp.status === 'active');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tenants...</p>
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-8 w-8" />
                Tenant Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage tenant accounts and property assignments
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tenant
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Tenant</DialogTitle>
                  <DialogDescription>
                    Create a new tenant account
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const email = formData.get('email') as string;
                  const fullName = formData.get('fullName') as string;
                  const password = formData.get('password') as string;
                  
                  createTenant(email, fullName, password);
                }} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required />
                  </div>
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" name="fullName" required />
                  </div>
                  <div>
                    <Label htmlFor="password">Temporary Password</Label>
                    <Input id="password" name="password" type="password" required />
                  </div>
                  <Button type="submit" className="w-full">
                    Create Tenant Account
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tenants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants.map((tenant) => {
            const tenantProperty = getTenantProperty(tenant.id);
            return (
              <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {tenant.full_name || tenant.name || 'Unnamed Tenant'}
                      </CardTitle>
                      <CardDescription>{tenant.email}</CardDescription>
                    </div>
                    <Badge variant={tenant.is_active ? 'default' : 'secondary'}>
                      {tenant.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Property Assignment */}
                  {tenantProperty ? (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Assigned Property</span>
                      </div>
                      <p className="text-sm text-blue-700 font-medium">
                        {tenantProperty.properties.name}
                      </p>
                      <p className="text-xs text-blue-600">
                        ${tenantProperty.monthly_rent}/month
                      </p>
                      <p className="text-xs text-blue-600">
                        {new Date(tenantProperty.lease_start_date).toLocaleDateString()} - {new Date(tenantProperty.lease_end_date).toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">No property assigned</p>
                    </div>
                  )}

                  {/* Account Info */}
                  <div className="text-sm text-gray-600">
                    <p>Joined: {new Date(tenant.created_at).toLocaleDateString()}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleTenantStatus(tenant.id, tenant.is_active)}
                      className="flex-1"
                    >
                      {tenant.is_active ? (
                        <>
                          <UserX className="h-4 w-4 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Activate
                        </>
                      )}
                    </Button>
                    
                    {!tenantProperty && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => setSelectedTenant(tenant)}
                          >
                            <Building className="h-4 w-4 mr-2" />
                            Assign Property
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Assign Property</DialogTitle>
                            <DialogDescription>
                              Assign a property to {tenant.full_name || tenant.name}
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const propertyId = formData.get('propertyId') as string;
                            const leaseStart = formData.get('leaseStart') as string;
                            const leaseEnd = formData.get('leaseEnd') as string;
                            const monthlyRent = parseFloat(formData.get('monthlyRent') as string);
                            
                            if (selectedTenant) {
                              assignProperty(selectedTenant.id, propertyId, leaseStart, leaseEnd, monthlyRent);
                            }
                          }} className="space-y-4">
                            <div>
                              <Label htmlFor="propertyId">Property</Label>
                              <Select name="propertyId" required>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a property" />
                                </SelectTrigger>
                                <SelectContent>
                                  {properties
                                    .filter(p => p.status === 'available')
                                    .map(property => (
                                    <SelectItem key={property.id} value={property.id}>
                                      {property.name} - {property.address}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="leaseStart">Lease Start Date</Label>
                                <Input id="leaseStart" name="leaseStart" type="date" required />
                              </div>
                              <div>
                                <Label htmlFor="leaseEnd">Lease End Date</Label>
                                <Input id="leaseEnd" name="leaseEnd" type="date" required />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="monthlyRent">Monthly Rent ($)</Label>
                              <Input id="monthlyRent" name="monthlyRent" type="number" step="0.01" min="0" required />
                            </div>
                            <Button type="submit" className="w-full">
                              Assign Property
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {tenants.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Tenants</h3>
              <p className="text-gray-600">Add your first tenant to get started.</p>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenants.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenants.filter(t => t.is_active).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Properties Assigned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenantProperties.filter(tp => tp.status === 'active').length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}