import { createClient } from "../../supabase/client";
import { Database } from "@/types/supabase";

type NotificationType = "info" | "success" | "warning" | "error";
type EntityType =
  | "property"
  | "tenant"
  | "payment"
  | "inventory"
  | "handover"
  | "message";

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  isAdminLog?: boolean;
  adminActionBy?: string;
  relatedEntityType?: EntityType;
  relatedEntityId?: string;
  metadata?: Record<string, any>;
}

export async function createNotification(params: CreateNotificationParams) {
  const supabase = createClient();

  const { error } = await supabase.from("notifications").insert({
    user_id: params.userId,
    title: params.title,
    message: params.message,
    type: params.type || "info",
    is_admin_log: params.isAdminLog || false,
    admin_action_by: params.adminActionBy,
    related_entity_type: params.relatedEntityType,
    related_entity_id: params.relatedEntityId,
    metadata: params.metadata || {},
  });

  if (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

export async function createAdminLogNotification(params: {
  adminUserId: string;
  action: string;
  entityType: EntityType;
  entityId?: string;
  details?: Record<string, any>;
}) {
  const supabase = createClient();

  // Get all admin users to notify
  const { data: adminUsers } = await supabase
    .from("users")
    .select("id")
    .eq("role", "admin");

  if (!adminUsers) return;

  // Create notifications for all admins
  const notifications = adminUsers.map((admin) => ({
    user_id: admin.id,
    title: `System Activity Log`,
    message: `${params.action} on ${params.entityType}${params.entityId ? ` (ID: ${params.entityId})` : ""}`,
    type: "info" as NotificationType,
    is_admin_log: true,
    admin_action_by: params.adminUserId,
    related_entity_type: params.entityType,
    related_entity_id: params.entityId,
    metadata: params.details || {},
  }));

  const { error } = await supabase.from("notifications").insert(notifications);

  if (error) {
    console.error("Error creating admin log notifications:", error);
  }
}

export async function createTenantNotification(params: {
  tenantId: string;
  title: string;
  message: string;
  type?: NotificationType;
  entityType?: EntityType;
  entityId?: string;
}) {
  await createNotification({
    userId: params.tenantId,
    title: params.title,
    message: params.message,
    type: params.type || "info",
    isAdminLog: false,
    relatedEntityType: params.entityType,
    relatedEntityId: params.entityId,
  });
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, updated_at: new Date().toISOString() })
    .eq("id", notificationId);

  if (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}

export async function getUserNotifications(
  userId: string,
  isAdminLog: boolean = false,
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .eq("is_admin_log", isAdminLog)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }

  // Enrich admin_action_by (string user id) with user full_name/name without relying on FK embedding
  let result = data || [];

  // Collect unique admin ids from notifications
  const adminIds = Array.from(
    new Set(
      result
        .map((n: any) => n.admin_action_by)
        .filter(Boolean)
    )
  );

  if (adminIds.length > 0) {
    const { data: admins, error: usersError } = await supabase
      .from("users")
      .select("id, full_name, name")
      .in("id", adminIds as string[]);

    if (!usersError && admins) {
      const userMap = new Map(
        admins.map((u: any) => [u.id, { full_name: u.full_name, name: u.name }])
      );

      result = result.map((n: any) =>
        n.admin_action_by
          ? { ...n, admin_action_by: userMap.get(n.admin_action_by) || null }
          : n
      );
    }
  }

  return result;
}

export async function getUnreadNotificationCount(userId: string) {
  const supabase = createClient();

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    console.error("Error fetching unread count:", error);
    return 0;
  }

  return count || 0;
}
