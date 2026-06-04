import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, ShieldCheck, UserX, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type UserWithRole = {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  is_admin: boolean;
};

const AdminRoles = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [grantingUserId, setGrantingUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch all profiles
      const { data: profiles } = await supabase.from("profiles").select("id, user_id, display_name").order("display_name", { ascending: true, nullsFirst: false });
      
      // Fetch all admins from user_roles
      const { data: adminRoles } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
      
      const adminUserIds = new Set(adminRoles?.map((r) => r.user_id) || []);
      
      // Fetch auth users to get emails
      const { data: { users: authUsers } } = await supabase.auth.admin.listUsers() as any;
      const emailMap = new Map((authUsers || []).map((u: any) => [u.id, u.email]));
      
      const usersWithRoles: UserWithRole[] = (profiles || []).map((p) => ({
        id: p.id,
        user_id: p.user_id,
        display_name: p.display_name,
        email: emailMap.get(p.user_id) || null,
        is_admin: adminUserIds.has(p.user_id),
      }));
      
      setUsers(usersWithRoles);
    } catch (err) {
      console.log("[v0] Error fetching users:", err);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách người dùng",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const grantAdminRole = async (userId: string) => {
    setGrantingUserId(userId);
    try {
      // Check if already admin
      const { data: existing } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userId)
        .eq("role", "admin")
        .single();
      
      if (existing) {
        toast({
          title: "Thông báo",
          description: "Người dùng này đã là admin",
        });
        setGrantingUserId(null);
        return;
      }

      // Insert admin role
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Cấp quyền admin thành công",
      });
      fetchUsers();
    } catch (err) {
      console.log("[v0] Error granting role:", err);
      toast({
        title: "Lỗi",
        description: "Không thể cấp quyền admin",
        variant: "destructive",
      });
    }
    setGrantingUserId(null);
  };

  const revokeAdminRole = async (userId: string) => {
    setGrantingUserId(userId);
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin");

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Thu hồi quyền admin thành công",
      });
      fetchUsers();
    } catch (err) {
      console.log("[v0] Error revoking role:", err);
      toast({
        title: "Lỗi",
        description: "Không thể thu hồi quyền admin",
        variant: "destructive",
      });
    }
    setGrantingUserId(null);
  };

  const filtered = users.filter((u) =>
    (u.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const admins = filtered.filter((u) => u.is_admin);
  const nonAdmins = filtered.filter((u) => !u.is_admin);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-primary neon-text">CẤP QUYỀN QUẢN TRỊ</h1>
        <span className="text-sm text-muted-foreground">{admins.length} admin từ {users.length} người dùng</span>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm người dùng..."
          className="w-full bg-muted border border-border rounded-lg py-2.5 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:neon-border transition-all text-sm"
        />
      </div>

      {/* Admins Section */}
      {admins.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Quản Trị Viên ({admins.length})
          </h2>
          <div className="bg-card border border-primary/30 rounded-xl overflow-hidden neon-card space-y-0">
            {admins.map((u, idx) => (
              <div
                key={u.id}
                className={`flex items-center justify-between p-4 ${
                  idx < admins.length - 1 ? "border-b border-border" : ""
                } hover:bg-muted/30 transition-colors`}
              >
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{u.display_name || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground">{u.email || "No email"}</p>
                </div>
                <button
                  onClick={() => revokeAdminRole(u.user_id)}
                  disabled={grantingUserId === u.user_id}
                  className="px-3 py-1.5 text-xs font-semibold bg-destructive text-destructive-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1"
                >
                  <UserX className="w-3 h-3" />
                  Thu hồi
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Non-Admins Section */}
      {nonAdmins.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground flex items-center gap-2">
            Người Dùng Thường ({nonAdmins.length})
          </h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden neon-card">
            {nonAdmins.map((u, idx) => (
              <div
                key={u.id}
                className={`flex items-center justify-between p-4 ${
                  idx < nonAdmins.length - 1 ? "border-b border-border" : ""
                } hover:bg-muted/30 transition-colors`}
              >
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{u.display_name || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground">{u.email || "No email"}</p>
                </div>
                <button
                  onClick={() => grantAdminRole(u.user_id)}
                  disabled={grantingUserId === u.user_id}
                  className="px-3 py-1.5 text-xs font-semibold gradient-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Cấp Admin
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-muted-foreground">
          Đang tải...
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Không có người dùng phù hợp
        </div>
      )}
    </div>
  );
};

export default AdminRoles;
