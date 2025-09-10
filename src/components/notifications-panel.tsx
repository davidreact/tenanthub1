"use client";

import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "../../supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/components/ui/use-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  is_admin_log: boolean;
  created_at: string;
  admin_action_by?: {
    full_name?: string;
    name?: string;
  };
}

interface NotificationsPanelProps {
  userId: string;
  isAdmin: boolean;
}

export default function NotificationsPanel({
  userId,
  isAdmin,
}: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [adminLogs, setAdminLogs] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const supabase = createClient();

  useEffect(() => {
    fetchNotifications();

    // Subscribe to real-time notifications
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchNotifications();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  const fetchNotifications = async () => {
    try {
      // Fetch regular notifications
      const { data: regularNotifications } = await supabase
        .from("notifications")
        .select(
          `
          *,
          admin_action_by:users!notifications_admin_action_by_fkey(full_name, name)
        `,
        )
        .eq("user_id", userId)
        .eq("is_admin_log", false)
        .order("created_at", { ascending: false })
        .limit(20);

      // Fetch admin logs if user is admin
      let adminLogsData = [];
      if (isAdmin) {
        const { data } = await supabase
          .from("notifications")
          .select(
            `
            *,
            admin_action_by:users!notifications_admin_action_by_fkey(full_name, name)
          `,
          )
          .eq("user_id", userId)
          .eq("is_admin_log", true)
          .order("created_at", { ascending: false })
          .limit(20);
        adminLogsData = data || [];
      }

      // Count unread notifications
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      setNotifications(regularNotifications || []);
      setAdminLogs(adminLogsData);
      setUnreadCount(count || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast({
        title: t("common.error"),
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      fetchNotifications();
      toast({
        title: t("common.success"),
        description: "All notifications marked as read",
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast({
        title: t("common.error"),
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      default:
        return "ℹ️";
    }
  };

  const NotificationItem = ({
    notification,
  }: {
    notification: Notification;
  }) => (
    <Card
      className={`mb-2 ${!notification.is_read ? "border-blue-200 bg-blue-50" : ""}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2">
            <span className="text-lg">
              {getNotificationIcon(notification.type)}
            </span>
            <div className="flex-1">
              <CardTitle className="text-sm font-medium">
                {notification.title}
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                {new Date(notification.created_at).toLocaleString()}
                {notification.admin_action_by && (
                  <span className="ml-2">
                    by{" "}
                    {notification.admin_action_by.full_name ||
                      notification.admin_action_by.name}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAsRead(notification.id)}
              className="h-6 w-6 p-0"
            >
              <Check className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-gray-700">{notification.message}</p>
      </CardContent>
    </Card>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-96 max-h-96 overflow-hidden"
        align="end"
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{t("notifications.title")}</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                {t("notifications.markAllAsRead")}
              </Button>
            )}
          </div>

          {isAdmin ? (
            <Tabs defaultValue="notifications" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="notifications">
                  {t("notifications.userNotifications")}
                </TabsTrigger>
                <TabsTrigger value="logs">
                  {t("notifications.adminLogs")}
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="notifications"
                className="max-h-64 overflow-y-auto mt-4"
              >
                {loading ? (
                  <div className="text-center py-4">{t("common.loading")}</div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    {t("notifications.noNotifications")}
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent
                value="logs"
                className="max-h-64 overflow-y-auto mt-4"
              >
                {loading ? (
                  <div className="text-center py-4">{t("common.loading")}</div>
                ) : adminLogs.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    {t("notifications.noNotifications")}
                  </div>
                ) : (
                  adminLogs.map((log) => (
                    <NotificationItem key={log.id} notification={log} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <div className="text-center py-4">{t("common.loading")}</div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  {t("notifications.noNotifications")}
                </div>
              ) : (
                notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
