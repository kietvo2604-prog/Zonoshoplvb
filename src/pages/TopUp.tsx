import { useEffect, useMemo, useState } from "react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle, Clock, Copy, CreditCard, Landmark, Loader2, Smartphone, Wallet, XCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const cardTypes = [
  { id: "viettel", name: "Viettel", serialLengths: [11, 14], codeLengths: [13, 15], serialHint: "11 hoặc 14 số", codeHint: "13 hoặc 15 số" },
  { id: "vinaphone", name: "Vinaphone", serialLengths: [14], codeLengths: [12, 14], serialHint: "14 số", codeHint: "12 hoặc 14 số" },
  { id: "mobifone", name: "Mobifone", serialLengths: [15], codeLengths: [12], serialHint: "15 số", codeHint: "12 số" },
  { id: "garena", name: "Garena", serialLengths: [9], codeLengths: [9], serialHint: "9 số", codeHint: "9 số" },
];

const denominations = [10000, 20000, 50000, 100000, 200000, 500000];
const formatVND = (n: number) => n.toLocaleString("vi-VN") + "đ";

type TopupRequest = { id: string; amount: number; method: string; status: string; note: string | null; created_at: string };

const StatusBadge = ({ status }: { status: string }) => {
  if (status === "approved") return <span className="text-primary font-bold">Thành công</span>;
  if (status === "rejected") return <span className="text-destructive font-bold">Thất bại</span>;
  return <span className="text-accent font-bold">Chờ xử lý</span>;
};

const HistoryTable = ({ rows, title }: { rows: TopupRequest[]; title: string }) => (
  <section className="bg-card border border-border p-4 neon-card space-y-4">
    <h2 className="text-xl font-bold text-foreground">{title}</h2>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/60 border-y border-border">
            <th className="px-3 py-3 text-left font-bold text-foreground">#</th>
            <th className="px-3 py-3 text-left font-bold text-foreground">Nhà mạng / phương thức</th>
            <th className="px-3 py-3 text-left font-bold text-foreground">Mệnh giá</th>
            <th className="px-3 py-3 text-left font-bold text-foreground">Thực nhận</th>
            <th className="px-3 py-3 text-left font-bold text-foreground">Trạng thái</th>
            <th className="px-3 py-3 text-left font-bold text-foreground">Thời gian</th>
            <th className="px-3 py-3 text-left font-bold text-foreground">Lý do</th>
           </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">No data available in table</td></tr>
          ) : rows.map((t, i) => (
            <tr key={t.id} className="border-b border-border hover:bg-muted/30">
              <td className="px-3 py-3 text-foreground">{i + 1}</td>
              <td className="px-3 py-3 text-foreground">{t.method}</td>
              <td className="px-3 py-3 text-yellow-500 font-semibold">{formatVND(t.amount)}</td>
              <td className="px-3 py-3 text-primary font-semibold">{t.status === "approved" ? formatVND(t.amount) : "—"}</td>
              <td className="px-3 py-3"><StatusBadge status={t.status} /></td>
              <td className="px-3 py-3 text-muted-foreground text-xs">{new Date(t.created_at).toLocaleString("vi-VN")}</td>
              <td className="px-3 py-3 text-muted-foreground max-w-[240px] truncate">{t.note || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

const TopUp = () => {
  const isBankPage = useLocation().pathname.includes("nap-ngan-hang");
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCard, setSelectedCard] = useState("viettel");
  const [selectedDenom, setSelectedDenom] = useState(100000);
  const [serial, setSerial] = useState("");
  const [code, setCode] = useState("");
  const [copiedField, setCopiedField] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ serial?: string; code?: string }>({});
  const [transferCode, setTransferCode] = useState<string | null>(null);
  const [recentTopups, setRecentTopups] = useState<TopupRequest[]>([]);
  const [activeApi, setActiveApi] = useState("gachthefast");
  const currentCard = cardTypes.find((c) => c.id === selectedCard)!;

  const sepayContent = transferCode || "NNQ000";
  const sepayQr = useMemo(() => `https://qr.sepay.vn/img?acc=0365739178&bank=MB&amount=&des=${encodeURIComponent(sepayContent)}`, [sepayContent]);

  useEffect(() => {
    supabase.from("shop_settings").select("value").eq("key", "charge_card_api").maybeSingle().then(({ data }) => setActiveApi(data?.value || "gachthefast"));
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [profileRes, topupRes] = await Promise.all([
        supabase.from("profiles").select("transfer_code").eq("user_id", user.id).single(),
        supabase.from("topup_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      ]);
      setTransferCode(profileRes.data?.transfer_code || null);
      setRecentTopups(topupRes.data || []);
    };
    fetchData();
  }, [user]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const validateCard = () => {
    const newErrors: { serial?: string; code?: string } = {};
    const serialDigits = serial.replace(/\D/g, "");
    const codeDigits = code.replace(/\D/g, "");
    if (!serialDigits) newErrors.serial = "Vui lòng nhập số Seri";
    else if (!currentCard.serialLengths.includes(serialDigits.length)) newErrors.serial = `Số Seri ${currentCard.name} phải có ${currentCard.serialHint}`;
    if (!codeDigits) newErrors.code = "Vui lòng nhập mã thẻ";
    else if (!currentCard.codeLengths.includes(codeDigits.length)) newErrors.code = `Mã thẻ ${currentCard.name} phải có ${currentCard.codeHint}`;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateCard()) return;
    if (!user) { toast({ title: "Vui lòng đăng nhập", variant: "destructive" }); return; }
    setSubmitting(true);
    const telcoMap: Record<string, string> = { viettel: "VIETTEL", vinaphone: "VINAPHONE", mobifone: "MOBIFONE", garena: "GARENA" };
    const { data: insertData, error: insertError } = await supabase.from("topup_requests").insert({
      user_id: user.id,
      amount: selectedDenom,
      method: `Thẻ cào ${currentCard.name}`,
      note: `API: ${activeApi === "thesieure" ? "thesieure.com" : "gachthefast.com"} | Seri: ${serial} | Mã: ${code} | Mệnh giá: ${formatVND(selectedDenom)}`,
    }).select("id").single();
    if (insertError || !insertData) {
      setSubmitting(false);
      toast({ title: "Lỗi", description: "Không thể gửi yêu cầu.", variant: "destructive" });
      return;
    }
    const { error: apiError } = await supabase.functions.invoke("charge-card", {
      body: { telco: telcoMap[selectedCard], code, serial, amount: selectedDenom, user_id: user.id, topup_request_id: insertData.id },
    });
    toast({ title: apiError ? "⚠️ Đã gửi thẻ" : "✅ Đã gửi thẻ cào", description: "Thẻ đang được xử lý tự động. Vui lòng chờ kết quả." });
    const { data: newTopups } = await supabase.from("topup_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);
    setRecentTopups(newTopups || []);
    setSerial(""); setCode(""); setErrors({}); setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar /><Header />
      <main className="container mx-auto px-4 py-6 space-y-6 max-w-none">
        {isBankPage ? (
          <>
            <section className="bg-card border border-primary p-6 neon-card space-y-5">
              <h1 className="text-xl font-bold text-foreground">-LƯU Ý QUAN TRỌNG:</h1>
              <p className="text-sm font-bold text-foreground">❗ +) NẾU QUÁ 15 PHÚT MÀ TIỀN CHƯA VÀO THÌ LIÊN HỆ ADMIN ĐỂ ĐƯỢC HỖ TRỢ.</p>
              <p className="text-sm font-bold text-foreground">❗ +) VUI LÒNG NHẬP ĐÚNG NỘI DUNG CHUYỂN KHOẢN VÀ TÀI KHOẢN, NẾU SAI ND THÌ LIÊN HỆ ADMIN ĐỂ ĐƯỢC HỖ TRỢ SỚM NHẤT.</p>
              <p className="text-sm text-muted-foreground">Min BANK là 10k, chuyển thấp hơn sẽ không được cộng. Nhập đúng số tài khoản, số tiền và nội dung chuyển khoản để hệ thống tự động xác nhận.</p>
            </section>
            
            {/* ĐÃ XOÁ BẢNG KHUYẾN MÃI */}
            
            {/* Chỉ giữ SePay */}
            <section className="bg-card border border-border p-6 neon-card space-y-5">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Landmark className="w-5 h-5 text-primary" /> Nạp tiền theo hoá đơn
              </h2>
              <div className="flex flex-col items-center justify-center gap-6 max-w-md mx-auto">
                <div className="bg-background border-2 border-primary p-6 space-y-4 rounded-xl shadow-lg w-full text-center">
                  <div className="flex justify-center">
                    <img src={sepayQr} alt="QR SePay" className="w-48 h-48 bg-white object-contain rounded-xl p-2 shadow-md" />
                  </div>
                  <p className="font-bold text-xl text-primary">SePay tự động</p>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Nội dung chuyển khoản</p>
                    <code className="block text-lg md:text-xl lg:text-2xl font-bold text-yellow-500 bg-muted px-3 py-1.5 rounded-lg inline-block mx-auto tracking-normal">
                     {sepayContent}
                     </code>
                    <button 
                      onClick={() => handleCopy(sepayContent, "sepay")} 
                      className="px-5 py-2.5 galaxy-button rounded-lg text-primary-foreground text-sm font-bold mt-3"
                    >
                      {copiedField === "sepay" ? "✅ Đã copy" : "📋 Copy nội dung"}
                    </button>
                  </div>
                  <div className="border-t border-border pt-4 mt-2 space-y-1">
                    <p className="font-bold text-foreground">
                      Tên chủ tài khoản: <span className="text-primary">NGUYỄN NGỌC QUÝ</span>
                    </p>
                    <p className="font-bold text-foreground">
                      Số tài khoản: <span className="text-primary">0365739178</span>
                    </p>
                  </div>
                </div>
              </div>
            </section>
            
            {user && <HistoryTable rows={recentTopups.filter(t => !t.method.includes("Thẻ cào"))} title="Lịch sử nạp ngân hàng" />}
          </>
        ) : (
          <>
            <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
              <section className="bg-card border border-border p-6 neon-card space-y-5">
                <div className="flex items-center justify-between"><h1 className="text-xl font-bold text-foreground">Nạp Thẻ</h1><span className="text-xs border border-primary text-primary px-3 py-1 rounded-full">API đang hoạt động: {activeApi === "thesieure" ? "thesieure.com" : "gachthefast.com"}</span></div>
                <div className="grid sm:grid-cols-[160px_1fr] gap-3 items-center"><label className="font-bold text-sm">Loại thẻ</label><select value={selectedCard} onChange={e => setSelectedCard(e.target.value)} className="bg-muted border border-border py-3 px-4 text-foreground rounded-md">{cardTypes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div className="grid sm:grid-cols-[160px_1fr] gap-3 items-center"><label className="font-bold text-sm">Mệnh giá</label><select value={selectedDenom} onChange={e => setSelectedDenom(Number(e.target.value))} className="bg-muted border border-border py-3 px-4 text-foreground rounded-md">{denominations.map(d => <option key={d} value={d}>{formatVND(d)}</option>)}</select></div>
                <div className="grid sm:grid-cols-[160px_1fr] gap-3 items-center"><label className="font-bold text-sm">Serial</label><div><input value={serial} onChange={e => { setSerial(e.target.value.replace(/\D/g, "")); setErrors(p => ({...p, serial: undefined})); }} placeholder="Nhập serial thẻ" className="w-full bg-muted border border-border py-3 px-4 rounded-md" />{errors.serial && <p className="text-xs text-destructive mt-1">{errors.serial}</p>}</div></div>
                <div className="grid sm:grid-cols-[160px_1fr] gap-3 items-center"><label className="font-bold text-sm">Pin</label><div><input value={code} onChange={e => { setCode(e.target.value.replace(/\D/g, "")); setErrors(p => ({...p, code: undefined})); }} placeholder="Nhập mã thẻ" className="w-full bg-muted border border-border py-3 px-4 rounded-md" />{errors.code && <p className="text-xs text-destructive mt-1">{errors.code}</p>}</div></div>
                <div className="border border-primary rounded-md text-center py-2 text-sm">Số tiền thực nhận: <span className="text-destructive font-bold">{formatVND(selectedDenom * 0.8)}</span></div>
                <div className="text-center"><button onClick={handleSubmit} disabled={submitting} className="px-8 py-3 galaxy-button rounded-lg text-primary-foreground font-bold disabled:opacity-60">{submitting ? <Loader2 className="w-4 h-4 animate-spin inline" /> : <CreditCard className="w-4 h-4 inline mr-1" />} Nạp Thẻ</button></div>
              </section>
              <section className="bg-card border border-border p-6 neon-card space-y-3">
                <h2 className="text-xl font-bold text-foreground">Lưu Ý</h2>
                {["KHÁCH HÀNG VUI LÒNG NHẬP ĐÚNG MÃ VÀ SERI THẺ", "NHẬP SAI MỆNH GIÁ THẺ SẼ BỊ TRỪ 100% GIÁ TRỊ THẺ", "THẺ ĐÚNG - TIỀN SẼ VÀO NGAY SAU VÀI GIÂY", "NẾU THẺ CHỜ XỬ LÝ QUÁ LÂU HÃY LIÊN HỆ ADMIN"].map(t => <p key={t} className="text-sm font-bold text-foreground">▶ {t}</p>)}
                <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/30 rounded-lg p-3"><AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" /><p className="text-xs text-destructive">Nhập sai mệnh giá sẽ không được hoàn tiền.</p></div>
              </section>
            </div>
            {user ? <HistoryTable rows={recentTopups.filter(t => t.method.includes("Thẻ cào"))} title="Lịch sử nạp thẻ" /> : <div className="text-center text-muted-foreground">Vui lòng <Link to="/dang-nhap" className="text-primary font-bold">đăng nhập</Link> để nạp thẻ.</div>}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default TopUp;