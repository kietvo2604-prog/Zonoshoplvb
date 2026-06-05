import { CreditCard, Smartphone, Wallet, Gift } from "lucide-react";

const TopUpGuide = () => {
  return (
    <div className="bg-card border border-border rounded-xl p-6 neon-card">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="w-7 h-7 text-neon-cyan" />
        <h2 className="font-display text-xl font-bold text-secondary neon-cyan-text">HƯỚNG DẪN NẠP TIỀN</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-muted rounded-xl p-5 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground">Cách 1: Nạp qua Thẻ Cào</h3>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full gradient-primary text-primary-foreground text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">1</span>
              Chọn loại thẻ (Viettel, Vinaphone, Mobifone) và mệnh giá.
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full gradient-primary text-primary-foreground text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">2</span>
              Nhập chính xác số Seri và Mã thẻ.
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full gradient-primary text-primary-foreground text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">3</span>
              Nhấn "Nạp thẻ" và chờ xử lý. Thực nhận 80% mệnh giá (thuế 20%).
            </li>
          </ul>
        </div>

        <div className="bg-muted rounded-xl p-5 border border-border relative overflow-hidden">
          <div className="absolute top-3 right-3">
            <span className="gradient-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full">
              Không chiết khấu
            </span>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-secondary" />
            <h3 className="font-bold text-foreground">Cách 2: ATM / Ví Điện Tử</h3>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-neon-orange shrink-0" />
              <span><strong className="text-neon-orange">KHÔNG CHIẾT KHẤU:</strong> Nhận 100% giá trị nạp!</span>
            </li>
            <li className="text-xs mt-2">Ví dụ: Nạp 30k → nhận 30k. Nạp 100k → nhận 100k .</li>
            <li className="text-xs">Hỗ trợ: Momo, ZaloPay, chuyển khoản ngân hàng.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TopUpGuide;
