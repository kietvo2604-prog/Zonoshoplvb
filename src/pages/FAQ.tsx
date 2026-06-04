import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowLeft, HelpCircle, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

const faqItems = [
  {
    question: '1. Lỗi khi mua thì bị thông báo "Số dư không đủ, vui lòng nạp thêm" hoặc "Số dư API không đủ, vui lòng liên hệ admin"',
    answer:
      "Trường hợp này là khi sản phẩm bạn có nhu cầu mua hết hàng. Vui lòng đợi trong vòng 24 tiếng để thực hiện mua lại.",
  },
  {
    question: "2. VNG, Global, IP là gì?",
    answer: `Có 2 loại tài khoản: 1 là VNG và 2 là Global.

• Tài khoản VNG yêu cầu sử dụng Roblox VNG để đăng nhập.

• Tài khoản Global: 
  - Global IP: không có thông báo gì.
  - Vietnam IP: sẽ có thông báo, chỉ cần nhấn nút quay lại 2 lần trên Android hoặc tương tự, thông báo sẽ biến mất.`,
  },
  {
    question: "3. Hỗ Trợ Rút Tiền",
    answer:
      "Shop không hỗ trợ rút tiền về. Khách hàng vui lòng cân nhắc số lượng mua để nạp vào shop.",
  },
  {
    question: "4. Shop có bảo hành khi acc không đăng nhập được hay bị reset password không?",
    answer:
      'Có thể đọc mô tả từng sản phẩm để biết thời gian bảo hành và tham khảo CHÍNH SÁCH BẢO HÀNH tại trang chủ phần "Chính sách".',
  },
];

const FAQ = () => {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
        </Link>

        <div className="text-center space-y-2">
          <HelpCircle className="w-12 h-12 text-primary mx-auto neon-text" />
          <h1 className="font-display text-2xl md:text-3xl font-bold text-primary neon-text">
            CÂU HỎI THƯỜNG GẶP
          </h1>
          <p className="text-muted-foreground text-sm">
            Giải đáp các thắc mắc phổ biến khi mua hàng tại ZONOshop
          </p>
        </div>

        <div className="space-y-4">
          {faqItems.map((item, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl p-5 neon-card animate-slide-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                {item.question}
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed pl-6">
                {item.answer}
              </p>
            </div>
          ))}
        </div>

        {/* Lưu ý */}
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-5">
          <p className="text-sm font-semibold text-primary mb-2">📌 Lưu ý:</p>
          <p className="text-sm text-foreground leading-relaxed">
            Chúng tôi luôn cam kết bảo vệ quyền lợi của khách hàng và đảm bảo mọi yêu cầu bảo hành
            được xử lý nhanh chóng và công bằng.
          </p>
          <p className="text-sm text-foreground mt-2">
            Mọi thắc mắc hoặc cần hỗ trợ, vui lòng liên hệ qua{" "}
            <a
              href="https://zalo.me"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Zalo
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;
