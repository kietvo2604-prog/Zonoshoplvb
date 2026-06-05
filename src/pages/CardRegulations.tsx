import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FileText, AlertTriangle, CheckCircle, CreditCard, Smartphone } from "lucide-react";

const regulations = [
  {
    id: "viettel",
    name: "Viettel",
    color: "text-red-400",
    bgColor: "bg-red-400/10 border-red-400/20",
    rules: [
      "Số Seri phải có 11 hoặc 14 chữ số",
      "Mã thẻ phải có 13 hoặc 15 chữ số",
      "Mệnh giá hỗ trợ: 10.000đ, 20.000đ, 50.000đ, 100.000đ, 200.000đ, 500.000đ",
      "Thẻ đã nạp hoặc hết hạn sẽ bị từ chối",
      "Nhập sai mệnh giá sẽ bị trừ 50% giá trị thẻ",
    ],
  },
  {
    id: "vinaphone",
    name: "Vinaphone",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10 border-blue-400/20",
    rules: [
      "Số Seri phải có 14 chữ số",
      "Mã thẻ phải có 12 hoặc 14 chữ số",
      "Mệnh giá hỗ trợ: 10.000đ, 20.000đ, 50.000đ, 100.000đ, 200.000đ, 500.000đ",
      "Thẻ đã nạp hoặc hết hạn sẽ bị từ chối",
      "Nhập sai mệnh giá sẽ bị trừ 50% giá trị thẻ",
    ],
  },
  {
    id: "mobifone",
    name: "Mobifone",
    color: "text-green-400",
    bgColor: "bg-green-400/10 border-green-400/20",
    rules: [
      "Số Seri phải có 15 chữ số",
      "Mã thẻ phải có 12 chữ số",
      "Mệnh giá hỗ trợ: 10.000đ, 20.000đ, 50.000đ, 100.000đ, 200.000đ, 500.000đ",
      "Thẻ đã nạp hoặc hết hạn sẽ bị từ chối",
      "Nhập sai mệnh giá sẽ bị trừ 50% giá trị thẻ",
    ],
  },
  {
    id: "garena",
    name: "Garena",
    color: "text-orange-400",
    bgColor: "bg-orange-400/10 border-orange-400/20",
    rules: [
      "Số Seri phải có 9 chữ số",
      "Mã thẻ phải có 9 chữ số",
      "Mệnh giá hỗ trợ: 10.000đ, 20.000đ, 50.000đ, 100.000đ, 200.000đ, 500.000đ",
      "Thẻ Garena có thể mất 1-5 phút để xử lý",
      "Nhập sai mệnh giá sẽ bị trừ 50% giá trị thẻ",
    ],
  },
];

const generalRules = [
  "Chiết khấu nạp thẻ: 20% (thực nhận 80% mệnh giá thẻ)",
  "Hệ thống xử lý thẻ tự động 24/7, kết quả trả về trong 1-5 phút",
  "Không hoàn tiền cho thẻ đã sử dụng hoặc thẻ sai",
  "Mỗi lần chỉ nạp được 1 thẻ, vui lòng đợi kết quả trước khi nạp thẻ tiếp",
  "Nếu thẻ đúng nhưng sai mệnh giá, hệ thống sẽ cộng theo mệnh giá thực tế (sau chiết khấu)",
  "Liên hệ Admin nếu gặp vấn đề: thẻ bị trừ nhưng không cộng tiền",
];

const CardRegulations = () => {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-primary neon-text">
            QUY ĐỊNH NẠP THẺ CÀO
          </h1>
          <p className="text-muted-foreground text-sm">
            Vui lòng đọc kỹ quy định trước khi nạp thẻ để tránh mất tiền
          </p>
        </div>

        {/* General Rules */}
        <div className="bg-card border border-border rounded-xl p-6 neon-card space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            <h2 className="font-display text-lg font-bold text-primary">QUY ĐỊNH CHUNG</h2>
          </div>
          <div className="space-y-3">
            {generalRules.map((rule, i) => (
              <div key={i} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{rule}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Warning */}
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-5 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-destructive shrink-0" />
          <div>
            <p className="font-bold text-destructive">⚠️ LƯU Ý QUAN TRỌNG</p>
            <p className="text-sm text-destructive/80 mt-1">
              Nhập sai mệnh giá thẻ cào sẽ bị mất thẻ hoặc trừ 50% giá trị. Vui lòng kiểm tra kỹ trước khi nạp.
              Shop không chịu trách nhiệm cho các trường hợp nhập sai thông tin thẻ.
            </p>
          </div>
        </div>

        {/* Per-card regulations */}
        <div className="grid md:grid-cols-2 gap-4">
          {regulations.map((card) => (
            <div key={card.id} className={`bg-card border rounded-xl p-5 space-y-3 ${card.bgColor}`}>
              <div className="flex items-center gap-2">
                <CreditCard className={`w-5 h-5 ${card.color}`} />
                <h3 className={`font-display text-base font-bold ${card.color}`}>
                  {card.name.toUpperCase()}
                </h3>
              </div>
              <div className="space-y-2">
                {card.rules.map((rule, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className={`text-xs mt-1 ${card.color}`}>•</span>
                    <p className="text-sm text-foreground">{rule}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ATM info */}
        <div className="bg-card border border-border rounded-xl p-6 neon-card space-y-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-neon-cyan" />
            <h2 className="font-display text-lg font-bold text-secondary neon-cyan-text">NẠP QUA ATM / VÍ ĐIỆN TỬ</h2>
          </div>
          <div className="space-y-3">
            {[
              "Nạp Không bị CHIẾT KHẤU❗",
              "Hệ thống tự động cộng tiền khi nhận được chuyển khoản với đúng nội dung",
              "Mỗi tài khoản có một mã chuyển khoản riêng (NNQxxxxxx), không dùng mã của người khác",
              "Thời gian xử lý: 1-15 phút tùy ngân hàng",
            ].map((rule, i) => (
              <div key={i} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
                <CheckCircle className="w-4 h-4 text-neon-cyan shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{rule}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CardRegulations;
