"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../../supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, CreditCard, Upload, Calendar, DollarSign, CheckCircle, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface PaymentProof {
  id: string;
  month_year: string;
  amount: number;
  payment_date: string;
  proof_url: string;
  status: string;
  admin_notes: string;
  created_at: string;
}

export default function TenantPayments() {
  const [paymentProofs, setPaymentProofs] = useState<PaymentProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [tenantPropertyId, setTenantPropertyId] = useState<string | null>(null);
  const [monthlyRent, setMonthlyRent] = useState<number>(0);
  const supabase = createClient();

  useEffect(() => {
    fetchPaymentProofs();
  }, []);

  const fetchPaymentProofs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get tenant's property
      const { data: tenantProperty } = await supabase
        .from('tenant_properties')
        .select('id, monthly_rent')
        .eq('tenant_id', user.id)
        .eq('status', 'active')
        .single();

      if (!tenantProperty) return;

      setTenantPropertyId(tenantProperty.id);
      setMonthlyRent(tenantProperty.monthly_rent);

      // Get payment proofs
      const { data: proofs } = await supabase
        .from('payment_proofs')
        .select('*')
        .eq('tenant_property_id', tenantProperty.id)
        .order('month_year', { ascending: false });

      setPaymentProofs(proofs || []);
    } catch (error) {
      console.error('Error fetching payment proofs:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadPaymentProof = async (file: File, monthYear: string, amount: number, paymentDate: string) => {
    if (!tenantPropertyId) return;

    setUploading(true);
    try {
      // In a real app, you'd upload to Supabase Storage
      // For demo, we'll use a placeholder URL
      const proofUrl = 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80';

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('payment_proofs')
        .insert({
          tenant_property_id: tenantPropertyId,
          month_year: monthYear,
          amount: amount,
          payment_date: paymentDate,
          proof_url: proofUrl,
          status: 'pending',
          uploaded_by: user.id
        });

      if (!error) {
        fetchPaymentProofs(); // Refresh the list
      }
    } catch (error) {
      console.error('Error uploading payment proof:', error);
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatMonthYear = (monthYear: string) => {
    const [year, month] = monthYear.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment history...</p>
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
            <CreditCard className="h-8 w-8" />
            Payment Tracking
          </h1>
          <p className="text-gray-600 mt-2">
            Upload payment proofs and track your payment history
          </p>
        </div>

        {/* Monthly Rent Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Monthly Rent Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-gray-500 text-sm">Monthly Rent</span>
                <p className="text-2xl font-bold text-green-600">${monthlyRent}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Due Date</span>
                <p className="font-semibold">1st of each month</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Payment Status</span>
                <div className="flex items-center gap-2 mt-1">
                  {paymentProofs.length > 0 && paymentProofs[0].status === 'approved' ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 font-medium">Current</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="text-yellow-600 font-medium">Pending</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload New Payment */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload New Payment Proof</CardTitle>
            <CardDescription>
              Upload proof of your monthly rent payment for verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full md:w-auto">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Payment Proof
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Payment Proof</DialogTitle>
                  <DialogDescription>
                    Please provide details about your payment and upload the proof
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const file = formData.get('file') as File;
                  const monthYear = formData.get('monthYear') as string;
                  const amount = parseFloat(formData.get('amount') as string);
                  const paymentDate = formData.get('paymentDate') as string;
                  
                  if (file && monthYear && amount && paymentDate) {
                    uploadPaymentProof(file, monthYear, amount, paymentDate);
                  }
                }} className="space-y-4">
                  <div>
                    <Label htmlFor="monthYear">Month & Year</Label>
                    <Input
                      id="monthYear"
                      name="monthYear"
                      type="month"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount Paid</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      defaultValue={monthlyRent}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentDate">Payment Date</Label>
                    <Input
                      id="paymentDate"
                      name="paymentDate"
                      type="date"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="file">Payment Proof (Receipt/Screenshot)</Label>
                    <Input
                      id="file"
                      name="file"
                      type="file"
                      accept="image/*,.pdf"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={uploading} className="w-full">
                    {uploading ? 'Uploading...' : 'Upload Proof'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Payment History */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Payment History</h2>
          
          {paymentProofs.length > 0 ? (
            <div className="grid gap-4">
              {paymentProofs.map((proof) => (
                <Card key={proof.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{formatMonthYear(proof.month_year)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          <span>${proof.amount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(proof.status)}
                          <Badge className={getStatusColor(proof.status)}>
                            {proof.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          Paid: {new Date(proof.payment_date).toLocaleDateString()}
                        </span>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              View Proof
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Payment Proof - {formatMonthYear(proof.month_year)}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden">
                                <Image
                                  src={proof.proof_url}
                                  alt="Payment proof"
                                  fill
                                  className="object-contain"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500">Amount:</span>
                                  <p className="font-medium">${proof.amount}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Payment Date:</span>
                                  <p className="font-medium">{new Date(proof.payment_date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Status:</span>
                                  <Badge className={getStatusColor(proof.status)}>
                                    {proof.status}
                                  </Badge>
                                </div>
                                <div>
                                  <span className="text-gray-500">Uploaded:</span>
                                  <p className="font-medium">{new Date(proof.created_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                              {proof.admin_notes && (
                                <div className="bg-blue-50 p-3 rounded-lg">
                                  <p className="font-medium text-blue-800">Admin Notes:</p>
                                  <p className="text-blue-700 text-sm">{proof.admin_notes}</p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment History</h3>
                <p className="text-gray-600">Upload your first payment proof to get started.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}