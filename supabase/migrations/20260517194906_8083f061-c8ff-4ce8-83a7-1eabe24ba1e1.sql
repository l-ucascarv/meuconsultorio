
-- availability_settings
DROP POLICY IF EXISTS "Users can view own availability" ON public.availability_settings;
DROP POLICY IF EXISTS "Users can insert own availability" ON public.availability_settings;
DROP POLICY IF EXISTS "Users can update own availability" ON public.availability_settings;
DROP POLICY IF EXISTS "Users can delete own availability" ON public.availability_settings;
CREATE POLICY "Users can view own availability" ON public.availability_settings FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own availability" ON public.availability_settings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own availability" ON public.availability_settings FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own availability" ON public.availability_settings FOR DELETE TO authenticated USING (user_id = auth.uid());

-- availability_blocks
DROP POLICY IF EXISTS "Users can view own blocks" ON public.availability_blocks;
DROP POLICY IF EXISTS "Users can insert own blocks" ON public.availability_blocks;
DROP POLICY IF EXISTS "Users can delete own blocks" ON public.availability_blocks;
CREATE POLICY "Users can view own blocks" ON public.availability_blocks FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own blocks" ON public.availability_blocks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own blocks" ON public.availability_blocks FOR DELETE TO authenticated USING (user_id = auth.uid());

-- booking_config
DROP POLICY IF EXISTS "Users can view own booking config" ON public.booking_config;
DROP POLICY IF EXISTS "Users can insert own booking config" ON public.booking_config;
DROP POLICY IF EXISTS "Users can update own booking config" ON public.booking_config;
CREATE POLICY "Users can view own booking config" ON public.booking_config FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own booking config" ON public.booking_config FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own booking config" ON public.booking_config FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- service_types
DROP POLICY IF EXISTS "Users can view own service types" ON public.service_types;
DROP POLICY IF EXISTS "Users can insert own service types" ON public.service_types;
DROP POLICY IF EXISTS "Users can update own service types" ON public.service_types;
DROP POLICY IF EXISTS "Users can delete own service types" ON public.service_types;
CREATE POLICY "Users can view own service types" ON public.service_types FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own service types" ON public.service_types FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own service types" ON public.service_types FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own service types" ON public.service_types FOR DELETE TO authenticated USING (user_id = auth.uid());

-- financial_categories
DROP POLICY IF EXISTS "Users can view own categories" ON public.financial_categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON public.financial_categories;
DROP POLICY IF EXISTS "Users can update own categories" ON public.financial_categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON public.financial_categories;
CREATE POLICY "Users can view own categories" ON public.financial_categories FOR SELECT TO authenticated USING ((user_id = auth.uid()) AND has_active_subscription(auth.uid()));
CREATE POLICY "Users can insert own categories" ON public.financial_categories FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()) AND has_active_subscription(auth.uid()));
CREATE POLICY "Users can update own categories" ON public.financial_categories FOR UPDATE TO authenticated USING ((user_id = auth.uid()) AND has_active_subscription(auth.uid()));
CREATE POLICY "Users can delete own categories" ON public.financial_categories FOR DELETE TO authenticated USING ((user_id = auth.uid()) AND has_active_subscription(auth.uid()));

-- financial_transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.financial_transactions;
CREATE POLICY "Users can view own transactions" ON public.financial_transactions FOR SELECT TO authenticated USING ((user_id = auth.uid()) AND has_active_subscription(auth.uid()));
CREATE POLICY "Users can insert own transactions" ON public.financial_transactions FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()) AND has_active_subscription(auth.uid()));
CREATE POLICY "Users can update own transactions" ON public.financial_transactions FOR UPDATE TO authenticated USING ((user_id = auth.uid()) AND has_active_subscription(auth.uid()));
CREATE POLICY "Users can delete own transactions" ON public.financial_transactions FOR DELETE TO authenticated USING ((user_id = auth.uid()) AND has_active_subscription(auth.uid()));

-- Admins can view all user_roles policy was on public role; restrict to authenticated
DROP POLICY IF EXISTS "Admins can view all user_roles" ON public.user_roles;
CREATE POLICY "Admins can view all user_roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- subscription_plans: admins manage scoped to authenticated; keep public SELECT for active plans
DROP POLICY IF EXISTS "Admins can manage all plans" ON public.subscription_plans;
CREATE POLICY "Admins can manage all plans" ON public.subscription_plans FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
