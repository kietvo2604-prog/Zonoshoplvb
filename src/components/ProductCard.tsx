import { useState } from "react";
import { ShoppingCart, Eye, Package, Loader2, Zap, User, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import PurchaseConfirmDialog from "./PurchaseConfirmDialog";
import BoostPurchaseDialog from "./BoostPurchaseDialog";

interface ProductCardProps {
  id?: string;
  name: string;
  price: string;
  numericPrice?: number;
  stock: number;
  description: string;
  category: string;
  imageUrl?: string;
  product_type?: string;
}

const ProductCard = ({ id, name, price, numericPrice, stock, description, category, imageUrl, product_type }: ProductCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [buying, setBuying] = useState(false);
  const [showAccDialog, setShowAccDialog] = useState(false);
  const [purchasedQuantity, setPurchasedQuantity] = useState(0);
  const [purchasedOrderCode, setPurchasedOrderCode] = useState("");
  const [purchasedOrderId, setPurchasedOrderId] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showBoost, setShowBoost] = useState(false);
  const isBoost = product_type === "boost";

  const handleBoostBuy = async (username: string, password: string, note: string) => {
    if (!user || !id) return;
    if (!username || !password) {
      toast({ title: "Vui lòng nhập tài khoản và mật khẩu", variant: "destructive" });
      return;
    }
    setBuying(true);
    const { data, error } = await supabase.rpc("purchase_boost" as any, {
      p_user_id: user.id, p_product_id: id,
      p_username: username, p_password: password, p_note: note,
    });
    setBuying(false);
    if (error) { toast({ title: "Lỗi", description: error.message, variant: "destructive" }); return; }
    const r = data as any;
    if (!r?.success) { toast({ title: "❌ " + (r?.error || "Đặt thất bại"), variant: "destructive" }); return; }
    setShowBoost(false);
    toast({ title: "✅ Đã đặt đơn!", description: `Mã đơn: ${r.order_code}` });
    window.location.href = "/lich-su-cay-thue";
  };

  const handleBuy = async (quantity: number, discountCode?: string) => {
    if (!user) {
      toast({ title: "Vui lòng đăng nhập", variant: "destructive" });
      return;
    }
    if (!id) {
      toast({ title: "Lỗi sản phẩm", variant: "destructive" });
      return;
    }
    if (stock <= 0) {
      toast({ title: "Hết hàng", variant: "destructive" });
      return;
    }
    setBuying(true);
    setShowConfirm(false);

    const { data, error } = await supabase.rpc("purchase_product_batch", {
      p_user_id: user.id,
      p_product_id: id,
      p_quantity: quantity,
      p_discount_code: discountCode || null,
    });

    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
      setBuying(false);
      return;
    }

    const result = data as any;
    if (!result.success) {
      toast({ title: "❌ " + result.error, variant: "destructive" });
      setBuying(false);
      return;
    }

    setBuying(false);
    setPurchasedQuantity(result.quantity || quantity);
    setPurchasedOrderCode(result.order_code);
    setPurchasedOrderId(result.order_id);
    setShowAccDialog(true);
  };

  return (
    <>
      <div className={`group relative bg-card border-2 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
        isBoost 
          ? "border-orange-500/50 hover:border-orange-500 shadow-orange-500/20" 
          : "border-primary/30 hover:border-primary shadow-primary/20"
      }`}>
        
        {/* BADGE PHÂN LOẠI - NỔI BẬT */}
        <div className={`absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-xs font-bold shadow-lg ${
          isBoost 
            ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white" 
            : "bg-gradient-to-r from-primary to-secondary text-white"
        }`}>
          {isBoost ? (
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" /> GAMEPASS
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" /> TÀI KHOẢN
            </span>
          )}
        </div>

        {/* HEADER - MÀU SẮC KHÁC BIỆT */}
        <div className={`px-4 py-4 flex items-center gap-3 border-b ${
          isBoost ? "bg-gradient-to-r from-orange-500/10 to-pink-500/10 border-orange-500/30" : "bg-muted border-border"
        }`}>
          {imageUrl && <img src={imageUrl} alt={name} className="w-12 h-12 rounded object-cover border border-border shrink-0" />}
          <div className="flex-1">
            <h3 className={`font-bold text-base leading-snug line-clamp-2 transition-colors ${
              isBoost ? "text-orange-400 group-hover:text-orange-300" : "text-foreground group-hover:text-primary"
            }`}>
              {name}
            </h3>
            {isBoost && (
              <p className="text-xs text-orange-400/70 flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" /> DONE GAMEPASS 24/7
              </p>
            )}
          </div>
        </div>

        {/* NỘI DUNG */}
        <div className="p-4 space-y-4">
          {/* PHẦN HIỂN THỊ MÔ TẢ ĐÃ SỬA */}
          {description.split("\n").filter(line => line.trim()).length > 1 || description.includes("\n") ? (
            <ul className="space-y-1.5 min-h-[80px]">
              {description.split("\n").map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) return null;
                return (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span className={`leading-snug ${isBoost ? "text-muted-foreground" : "text-foreground"}`}>
                      {trimmed}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={`text-sm min-h-[80px] ${isBoost ? "text-muted-foreground" : "text-foreground"}`}>
              {description}
            </p>
          )}

          {/* THÔNG SỐ - KHÁC BIỆT */}
          <div className={`grid ${isBoost ? "grid-cols-2" : "grid-cols-3"} items-center text-center border-y py-3 gap-2 ${
            isBoost ? "border-orange-500/30" : "border-border"
          }`}>
            <div className="space-y-1 border-r border-border">
              <p className="text-xs font-bold text-foreground">Quốc gia</p>
              <p className="text-lg">🇻🇳</p>
            </div>
            {!isBoost && (
              <div className="space-y-1 border-r border-border">
                <p className="text-xs font-bold text-foreground">Hiện có</p>
                <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {stock}
                </span>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-xs font-bold text-foreground">Giá</p>
              <span className={`text-lg font-bold ${isBoost ? "text-orange-400" : "text-yellow-500"}`}>
                {user ? price : "Đăng nhập để xem giá!"}
              </span>
            </div>
          </div>

          {/* NÚT HÀNH ĐỘNG - KHÁC BIỆT RÕ RÀNG */}
          <div className="grid grid-cols-[auto_1fr] gap-2">
            {id && (
              <Link to={`/san-pham/${id}`} className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm font-semibold ${
                isBoost 
                  ? "border-orange-500/50 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20" 
                  : "border-border bg-muted text-foreground hover:bg-border"
              }`} title="Chi tiết">
                <Eye className="w-4 h-4" /> Xem chi tiết
              </Link>
            )}
            {user ? (
              <button
                onClick={() => isBoost ? setShowBoost(true) : setShowConfirm(true)}
                disabled={buying || (!isBoost && stock <= 0)}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold transition-all ${
                  isBoost
                    ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:shadow-lg hover:shadow-orange-500/30"
                    : "gradient-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/30"
                } hover:opacity-90 disabled:opacity-50`}
              >
                {buying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isBoost ? <Zap className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                {buying ? "Đang xử lý..." : !isBoost && stock <= 0 ? "Hết hàng" : isBoost ? "ĐẶT HÀNG" : "MUA NGAY"}
              </button>
            ) : (
              <Link to="/dang-nhap" className="flex items-center justify-center gap-1.5 px-3 py-2 gradient-primary rounded-full text-xs font-bold text-primary-foreground hover:opacity-90 transition-opacity">
                <ShoppingCart className="w-3.5 h-3.5" /> Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </div>

      <PurchaseConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        productName={name}
        price={price}
        numericPrice={numericPrice || 0}
        stock={stock}
        onConfirm={handleBuy}
        buying={buying}
      />

      <BoostPurchaseDialog
        open={showBoost}
        onOpenChange={setShowBoost}
        productName={name}
        price={price}
        onConfirm={handleBoostBuy}
        buying={buying}
      />

      {/* Success dialog */}
      {showAccDialog && (
        <Dialog open={showAccDialog} onOpenChange={setShowAccDialog}>
          <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle className="text-primary flex items-center gap-2">✅ Mua hàng thành công!</DialogTitle>
              <DialogDescription>Đơn hàng đã được tạo. Xem chi tiết đơn hàng để lấy thông tin tài khoản.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="bg-muted border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1 font-semibold">Sản phẩm:</p>
                <p className="text-sm text-foreground font-medium">{name} (x{purchasedQuantity})</p>
              </div>
              <div className="bg-muted border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1 font-semibold">Mã đơn:</p>
                <p className="text-sm text-primary font-mono font-bold">{purchasedOrderCode}</p>
              </div>
              <div className="bg-muted border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1 font-semibold">Thông tin tài khoản:</p>
                <p className="text-sm text-muted-foreground">●●●●●●●● (đã ẩn)</p>
                <p className="text-xs text-muted-foreground mt-1">Bấm "Xem chi tiết" để xem thông tin tài khoản đầy đủ.</p>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Link to={`/don-hang/${purchasedOrderId}`} onClick={() => setShowAccDialog(false)}
                className="flex items-center justify-center gap-2 px-4 py-2 gradient-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
                <Eye className="w-4 h-4" /> Xem chi tiết
              </Link>
              <button onClick={() => { setShowAccDialog(false); window.location.reload(); }}
                className="px-4 py-2 gradient-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
                Mua thêm
              </button>
              <Link to="/lich-su-mua" onClick={() => setShowAccDialog(false)}
                className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-semibold hover:bg-border transition-colors text-center">
                Lịch sử giao dịch
              </Link>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default ProductCard;
