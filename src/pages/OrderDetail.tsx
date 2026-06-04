import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ShoppingBag, ArrowLeft, Copy, Check, Loader2, AlertCircle, Clock, User, Lock } from "lucide-react";
// Đã XOÁ import 3 ảnh acc icon

const formatVND = (n: number) => n.toLocaleString("vi-VN") + "đ";

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
      setOrder(data);
      setLoading(false);
    };
    fetch();
  }, [user, id]);

  const handleCopy = async (text: string, index?: number) => {
    await navigator.clipboard.writeText(text);
    if (index !== undefined) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } else {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Vui lòng đăng nhập để xem chi tiết đơn hàng.</p>
          <a href="/dang-nhap" className="inline-block px-6 py-3 gradient-primary text-primary-foreground font-semibold rounded-lg text-sm">
            Đăng nhập
          </a>
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Không tìm thấy đơn hàng.</p>
          <Link to="/lich-su?tab=orders" className="inline-block px-6 py-3 gradient-primary text-primary-foreground font-semibold rounded-lg text-sm">
            Quay lại lịch sử
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const accountInfo = order.account_info || "";
  const lines = accountInfo.split("\n").filter((l: string) => l.trim());
  const quantity = lines.length || 1;

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-xl space-y-6">
        <Link
          to="/lich-su?tab=orders"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại lịch sử đơn hàng
        </Link>

        <div className="bg-card border border-primary/20 rounded-xl p-6 neon-card animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-foreground">CHI TIẾT ĐƠN HÀNG</h1>
              <p className="text-xs text-muted-foreground">
                Mã: <span className="font-mono font-bold text-primary">{order.order_code || order.id.slice(0, 8).toUpperCase()}</span>
              </p>
            </div>
          </div>

          {/* Order info */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Sản phẩm</span>
              <span className="text-sm font-semibold text-foreground text-right max-w-[60%] truncate">{order.product_name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Danh mục</span>
              <span className="px-2 py-0.5 bg-muted rounded text-xs font-medium text-foreground">{order.product_category}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Số lượng</span>
              <span className="text-sm font-bold text-foreground">{quantity}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Tổng giá</span>
              <span className="text-sm font-bold text-destructive">-{formatVND(order.price)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Thời gian</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(order.created_at).toLocaleString("vi-VN")}
              </span>
            </div>
          </div>

          {/* Account credentials - ĐÃ XOẢ ẢNH BÊN CẠNH */}
          <div className="bg-muted border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-foreground text-sm">THÔNG TIN TÀI KHOẢN</h2>
            </div>

            {accountInfo ? (
              <>
                <div className="space-y-2">
                  {lines.map((line: string, i: number) => (
                    <div key={i} className="bg-background border border-border rounded-lg p-3">
                      <div className="flex items-center justify-between gap-2">
                        {/* ĐÃ XOÁ ẢNH <img ... /> */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-xs font-bold text-primary shrink-0 w-5">{i + 1}.</span>
                          <span className="text-sm font-mono text-foreground break-all">{line}</span>
                        </div>
                        <button
                          onClick={() => handleCopy(line, i)}
                          className="p-1.5 rounded-md hover:bg-muted transition-colors shrink-0"
                          title="Sao chép"
                        >
                          {copiedIndex === i ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleCopy(accountInfo)}
                  className="w-full py-2.5 gradient-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  {copiedAll ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedAll ? "Đã sao chép tất cả!" : "Sao chép tất cả"}
                </button>
              </>
            ) : (
              <div className="text-center py-4">
                <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Chưa có thông tin tài khoản cho đơn hàng này.</p>
                <p className="text-xs text-muted-foreground mt-1">Vui lòng liên hệ admin để được hỗ trợ.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderDetail;