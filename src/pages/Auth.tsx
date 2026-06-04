import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

import { Gamepad2, Mail, Lock, User as UserIcon, LogIn, ArrowRight } from "lucide-react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [forgotPassword, setForgotPassword] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Vui lòng nhập email"); return; }
    setSubmitting(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setError(error.message);
    } else {
      setMessage("Đã gửi email đặt lại mật khẩu! Kiểm tra hộp thư của bạn.");
    }
    setSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    if (isLogin) {
      // Login bằng username (không phân biệt hoa thường) → tra email → signIn
      const uname = username.trim();
      if (!uname) { setError("Vui lòng nhập tài khoản đăng nhập"); setSubmitting(false); return; }
      if (!password) { setError("Vui lòng nhập mật khẩu"); setSubmitting(false); return; }

      // Try to find email via RPC first, fallback to using username as email
      let emailToUse = uname;
      
      try {
        const { data: foundEmail, error: rpcErr } = await supabase.rpc("get_email_by_username", { p_username: uname });
        
        if (!rpcErr && foundEmail) {
          emailToUse = foundEmail as string;
        } else {
          // Fallback: Try using username directly as email (in case user registered with username@shop.local format)
          // Or check if it looks like an email
          if (!uname.includes("@")) {
            // Assume it might be stored with a format like username or email
            console.log("[v0] RPC failed, trying username directly as email");
          } else {
            emailToUse = uname; // It's already an email format
          }
        }
      } catch (err) {
        console.log("[v0] RPC error, using username directly:", err);
        // Continue with username as fallback
      }

      const { error } = await supabase.auth.signInWithPassword({ email: emailToUse, password });
      if (error) {
        // If login failed, give more specific feedback
        if (error.message.includes("Invalid login credentials")) {
          setError("Tài khoản hoặc mật khẩu không đúng");
        } else if (error.message.includes("Email not confirmed")) {
          setError("Email chưa được xác nhận. Kiểm tra hộp thư của bạn.");
        } else {
          setError(error.message || "Đăng nhập thất bại");
        }
      } else {
        navigate("/");
      }
    } else {
      // Đăng ký
      const uname = username.trim();
      if (!uname || uname.length < 3) { setError("Tài khoản đăng nhập tối thiểu 3 ký tự"); setSubmitting(false); return; }
      if (!email) { setError("Vui lòng nhập email"); setSubmitting(false); return; }
      if (password.length < 6) { setError("Mật khẩu tối thiểu 6 ký tự"); setSubmitting(false); return; }
      if (password !== confirmPassword) { setError("Mật khẩu nhập lại không khớp"); setSubmitting(false); return; }

      // Check username trùng via RPC (optional - may fail)
      try {
        const { data: avail } = await supabase.rpc("username_available", { p_username: uname });
        if (avail === false) { 
          setError("Tài khoản đã tồn tại"); 
          setSubmitting(false); 
          return; 
        }
      } catch (err) {
        console.log("[v0] Username check RPC failed, continuing anyway:", err);
        // Continue with signup anyway
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: uname, full_name: uname },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Đăng ký thành công! Bạn có thể đăng nhập ngay.");
        setIsLogin(true);
        setPassword("");
        setConfirmPassword("");
      }
    }
    setSubmitting(false);
  };

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setError(error.message || "Đăng nhập Google thất bại");
      setSubmitting(false);
    }
    // Trình duyệt sẽ tự redirect sang Google
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-md">
        <div className="bg-card border border-border rounded-xl p-8 neon-card animate-slide-up">
          <div className="flex flex-col items-center mb-6">
            <Gamepad2 className="w-12 h-12 text-primary neon-text mb-2" />
            <h1 className="font-display text-xl font-bold text-primary neon-text">
              {forgotPassword ? "QUÊN MẬT KHẨU" : isLogin ? "ĐĂNG NHẬP" : "ĐĂNG KÝ"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {forgotPassword ? "Nhập email để nhận liên kết đặt lại" : isLogin ? "Chào mừng trở lại!" : "Tạo tài khoản mới"}
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4 text-sm text-destructive">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 mb-4 text-sm text-primary">
              {message}
            </div>
          )}

          <form onSubmit={forgotPassword ? handleForgotPassword : handleSubmit} className="space-y-4">
            {/* Username field - dùng cho cả login & register, ẩn khi quên mk */}
            {!forgotPassword && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Tài khoản đăng nhập</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nhập tài khoản..."
                    required
                    autoComplete="username"
                    className="w-full bg-muted border border-border rounded-lg py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:neon-border transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email - chỉ hiện khi đăng ký hoặc quên mk */}
            {(!isLogin || forgotPassword) && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Địa chỉ Email {!forgotPassword && <span className="text-xs text-muted-foreground font-normal">(dùng để lấy lại tài khoản)</span>}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập email..."
                    required
                    className="w-full bg-muted border border-border rounded-lg py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:neon-border transition-all"
                  />
                </div>
              </div>
            )}

            {!forgotPassword && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    required
                    minLength={6}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    className="w-full bg-muted border border-border rounded-lg py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:neon-border transition-all"
                  />
                </div>
              </div>
            )}

            {!isLogin && !forgotPassword && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Nhập lại mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu..."
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full bg-muted border border-border rounded-lg py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:neon-border transition-all"
                  />
                </div>
              </div>
            )}

            {isLogin && !forgotPassword && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => { setForgotPassword(true); setError(""); setMessage(""); }}
                  className="text-sm text-primary hover:underline"
                >
                  Quên mật khẩu?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 gradient-primary text-primary-foreground font-bold rounded-lg text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {submitting ? "Đang xử lý..." : forgotPassword ? "Gửi email đặt lại" : isLogin ? "Đăng nhập" : "Đăng ký"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-muted-foreground">hoặc</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={submitting}
            className="w-full py-3 bg-muted border border-border rounded-lg font-semibold text-sm text-foreground hover:bg-border transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Đăng nhập với Google
          </button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {forgotPassword ? (
              <button
                onClick={() => { setForgotPassword(false); setError(""); setMessage(""); }}
                className="text-primary font-semibold hover:underline"
              >
                ← Quay lại đăng nhập
              </button>
            ) : (
              <>
                {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
                <button
                  onClick={() => { setIsLogin(!isLogin); setError(""); setMessage(""); }}
                  className="text-primary font-semibold hover:underline"
                >
                  {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
                </button>
              </>
            )}
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;
