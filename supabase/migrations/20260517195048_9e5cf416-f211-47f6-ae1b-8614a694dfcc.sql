
CREATE POLICY "Users can update own blocks" ON public.availability_blocks
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own booking config" ON public.booking_config
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
