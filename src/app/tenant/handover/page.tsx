"use client";

import { useState, useEffect } from "react";
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
  Calendar,
  Key,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

interface KeyHandover {
  id: string;
  handover_type: string;
  scheduled_date: string;
  status: string;
  notes: string;
  created_at: string;
}

export default function TenantHandover() {
  const [handovers, setHandovers] = useState<KeyHandover[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantPropertyId, setTenantPropertyId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const supabase = createClient();

  useEffect(() => {
    fetchHandovers();
  }, []);

  const fetchHandovers = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get tenant's property
      const { data: tenantProperty } = await supabase
        .from("tenant_properties")
        .select("id")
        .eq("tenant_id", user.id)
        .eq("status", "active")
        .single();

      if (!tenantProperty) return;

      setTenantPropertyId(tenantProperty.id);

      // Get key handovers
      const { data: handoverData } = await supabase
        .from("key_handovers")
        .select("*")
        .eq("tenant_property_id", tenantProperty.id)
        .order("scheduled_date", { ascending: false });

      setHandovers(handoverData || []);
    } catch (error) {
      console.error("Error fetching handovers:", error);
    } finally {
      setLoading(false);
    }
  };

  const scheduleHandover = async (
    type: string,
    date: string,
    time: string,
    notes: string,
  ) => {
    if (!tenantPropertyId) return;

    try {
      const scheduledDateTime = new Date(`${date}T${time}`).toISOString();

      await supabase.from("key_handovers").insert({
        tenant_property_id: tenantPropertyId,
        handover_type: type,
        scheduled_date: scheduledDateTime,
        status: "scheduled",
        notes: notes,
      });

      fetchHandovers(); // Refresh the list
      setIsDialogOpen(false);

      toast({
        title: t("handover.scheduledTitle"),
        description: t("handover.scheduledDescription"),
      });
    } catch (error) {
      console.error("Error scheduling handover:", error);
      toast({
        title: t("common.error"),
        description: t("handover.scheduleErrorDescription"),
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "scheduled":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "cancelled":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "move_in":
        return "bg-green-100 text-green-800";
      case "move_out":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t("handover.loadingSchedule")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("common.backToDashboard")}
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Key className="h-8 w-8" />
                {t("handover.keyHandover")}
              </h1>
              <p className="text-muted-foreground mt-2">
                {t("handover.scheduleKeyExchanges")}
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("handover.scheduleHandover")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("handover.scheduleHandoverTitle")}</DialogTitle>
                  <DialogDescription>
                    {t("handover.scheduleHandoverDescription")}
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const type = formData.get("type") as string;
                    const date = formData.get("date") as string;
                    const time = formData.get("time") as string;
                    const notes = formData.get("notes") as string;

                    if (type && date && time) {
                      scheduleHandover(type, date, time, notes);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="type">{t("common.handoverType")}</Label>
                    <Select name="type" required>
                      <SelectTrigger>
                        <SelectValue placeholder={t("handover.selectHandoverType")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="move_in">{t("common.moveIn")}</SelectItem>
                        <SelectItem value="move_out">{t("common.moveOut")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">{t("common.preferredDate")}</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">{t("common.preferredTime")}</Label>
                    <Input id="time" name="time" type="time" required />
                  </div>
                  <div>
                    <Label htmlFor="notes">{t("common.additionalNotes")}</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder={t("common.addYourNotesPlaceholder")}
                      rows={3}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    {t("handover.scheduleHandover")}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Handover Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t("handover.infoTitle")}</CardTitle>
            <CardDescription>
              {t("handover.infoDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-green-800 mb-2">
                  {t("handover.moveInInfoTitle")}
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• {t("handover.moveInInfo1")}</li>
                  <li>• {t("handover.moveInInfo2")}</li>
                  <li>• {t("handover.moveInInfo3")}</li>
                  <li>• {t("handover.moveInInfo4")}</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-orange-800 mb-2">
                  {t("handover.moveOutInfoTitle")}
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• {t("handover.moveOutInfo1")}</li>
                  <li>• {t("handover.moveOutInfo2")}</li>
                  <li>• {t("handover.moveOutInfo3")}</li>
                  <li>• {t("handover.moveOutInfo4")}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scheduled Handovers */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{t("handover.yourScheduleTitle")}</h2>

          {handovers.length > 0 ? (
            <div className="grid gap-4">
              {handovers.map((handover) => {
                const { date, time } = formatDateTime(handover.scheduled_date);
                return (
                  <Card key={handover.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Badge
                              className={getTypeColor(handover.handover_type)}
                            >
                              {handover.handover_type === "move_in" ? t("common.moveIn") : handover.handover_type === "move_out" ? t("common.moveOut") : handover.handover_type}
                            </Badge>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(handover.status)}
                              <Badge
                                className={getStatusColor(handover.status)}
                              >
                                {handover.status === "completed" ? t("common.completed") : handover.status === "scheduled" ? t("common.scheduled") : handover.status === "cancelled" ? t("common.cancelled") : handover.status}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{time}</span>
                            </div>
                          </div>

                          {handover.notes && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm text-gray-700">
                                {handover.notes}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {t("common.requested")}:{" "}
                            {new Date(handover.created_at).toLocaleDateString()}
                          </p>
                          {handover.status === "scheduled" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                            >
                              {t("common.modifyRequest")}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t("handover.noHandoversTitle")}
                </h3>
                <p className="text-gray-600">
                  {t("handover.noHandoversDescription")}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Contact Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>{t("common.needHelp")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              {t("handover.helpDescription")}
            </p>
            <Link href="/tenant/messages">
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                {t("common.contactAdministrator")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
