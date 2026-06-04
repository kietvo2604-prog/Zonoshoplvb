
-- Categories table
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.categories (name, slug, sort_order) VALUES
  ('Blox Fruits', 'bloxfruits', 1),
  ('Random', 'random', 2),
  ('Robux', 'robux', 3),
  ('Gamepass', 'gamepass', 4),
  ('Khác', 'other', 5);

-- Product accounts table
CREATE TABLE public.product_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  account_info text NOT NULL,
  is_sold boolean NOT NULL DEFAULT false,
  sold_to_order_id uuid REFERENCES public.orders(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access product_accounts" ON public.product_accounts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Atomic purchase function
CREATE OR REPLACE FUNCTION public.purchase_product(p_user_id uuid, p_product_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product products%ROWTYPE;
  v_account product_accounts%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_order_code text;
  v_order_id uuid;
  v_chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  v_i integer;
BEGIN
  SELECT * INTO v_product FROM products WHERE id = p_product_id AND status = 'active';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sản phẩm không tồn tại');
  END IF;

  SELECT * INTO v_account FROM product_accounts
    WHERE product_id = p_product_id AND is_sold = false
    LIMIT 1 FOR UPDATE SKIP LOCKED;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Hết hàng');
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR v_profile.balance < v_product.price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số dư không đủ');
  END IF;

  v_order_code := 'NNQ';
  FOR v_i IN 1..12 LOOP
    v_order_code := v_order_code || substr(v_chars, floor(random() * 36 + 1)::int, 1);
  END LOOP;

  INSERT INTO orders (user_id, product_name, product_category, price, account_info, order_code)
    VALUES (p_user_id, v_product.name, v_product.category, v_product.price, v_account.account_info, v_order_code)
    RETURNING id INTO v_order_id;

  UPDATE product_accounts SET is_sold = true, sold_to_order_id = v_order_id WHERE id = v_account.id;
  UPDATE products SET stock = (SELECT count(*) FROM product_accounts WHERE product_id = p_product_id AND is_sold = false) WHERE id = p_product_id;
  UPDATE profiles SET balance = balance - v_product.price WHERE user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'order_code', v_order_code, 'order_id', v_order_id, 'account_info', v_account.account_info);
END;
$$;

-- Leaderboard function
CREATE OR REPLACE FUNCTION public.get_topup_leaderboard(limit_count integer DEFAULT 10)
RETURNS TABLE(user_id uuid, display_name text, avatar_url text, total_amount bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.user_id, p.display_name, p.avatar_url, sum(t.amount)::bigint as total_amount
  FROM topup_requests t
  JOIN profiles p ON p.user_id = t.user_id
  WHERE t.status = 'approved'
  GROUP BY t.user_id, p.display_name, p.avatar_url
  ORDER BY total_amount DESC
  LIMIT limit_count;
$$;

-- Recent purchases function
CREATE OR REPLACE FUNCTION public.get_recent_purchases(limit_count integer DEFAULT 10)
RETURNS TABLE(product_name text, product_category text, price integer, created_at timestamptz, display_name text, avatar_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.product_name, o.product_category, o.price, o.created_at, p.display_name, p.avatar_url
  FROM orders o
  JOIN profiles p ON p.user_id = o.user_id
  ORDER BY o.created_at DESC
  LIMIT limit_count;
$$;
