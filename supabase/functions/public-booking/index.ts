import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    if (req.method === "GET") {
      return await handleGetSlots(req, supabase);
    }
    if (req.method === "POST") {
      return await handleCreateBooking(req, supabase);
    }
    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    console.error("public-booking error:", err);
    return json({ error: "Erro interno do servidor" }, 500);
  }
});

// GET /public-booking?slug=xxx&date=YYYY-MM-DD
async function handleGetSlots(req: Request, supabase: any) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  const dateStr = url.searchParams.get("date");

  if (!slug) return json({ error: "slug é obrigatório" }, 400);

  // Get profile by slug
  const { data: profiles, error: profileErr } = await supabase.rpc(
    "get_profile_by_slug",
    { p_slug: slug }
  );
  if (profileErr || !profiles?.length) {
    return json({ error: "Profissional não encontrado" }, 404);
  }

  const profile = profiles[0];

  // Get booking config
  const { data: config } = await supabase
    .from("booking_config")
    .select("*")
    .eq("user_id", profile.user_id)
    .single();

  if (!config || !config.booking_enabled) {
    return json({ error: "Agendamento online não disponível" }, 404);
  }

  // Return profile info + config (no date = just info)
  const baseInfo = {
    name: profile.name,
    specialty: profile.specialty,
    crp: profile.crp,
    sessionDuration: config.session_duration_minutes,
    maxAdvanceDays: config.max_advance_days,
  };

  if (!dateStr) {
    // Return availability days of week
    const { data: settings } = await supabase
      .from("availability_settings")
      .select("day_of_week, is_active")
      .eq("user_id", profile.user_id);

    return json({
      ...baseInfo,
      availableDays: (settings || [])
        .filter((s: any) => s.is_active)
        .map((s: any) => s.day_of_week),
    });
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return json({ error: "Formato de data inválido" }, 400);
  }

  const targetDate = new Date(dateStr + "T12:00:00Z");
  const now = new Date();
  const today = new Date(now.toISOString().split("T")[0] + "T12:00:00Z");

  // Check if date is in the past
  if (targetDate < today) {
    return json({ ...baseInfo, slots: [] });
  }

  // Check max advance
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + config.max_advance_days);
  if (targetDate > maxDate) {
    return json({ ...baseInfo, slots: [] });
  }

  // Check day of week availability
  const dayOfWeek = new Date(dateStr + "T12:00:00").getDay();
  const { data: daySetting } = await supabase
    .from("availability_settings")
    .select("*")
    .eq("user_id", profile.user_id)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true)
    .single();

  if (!daySetting) {
    return json({ ...baseInfo, slots: [] });
  }

  // Check full-day blocks
  const { data: blocks } = await supabase
    .from("availability_blocks")
    .select("*")
    .eq("user_id", profile.user_id)
    .eq("blocked_date", dateStr);

  const fullDayBlock = (blocks || []).find((b: any) => b.block_full_day);
  if (fullDayBlock) {
    return json({ ...baseInfo, slots: [] });
  }

  // Generate time slots
  const slots: string[] = [];
  const startMinutes = timeToMinutes(daySetting.start_time);
  const endMinutes = timeToMinutes(daySetting.end_time);
  const step = config.session_duration_minutes + config.break_between_minutes;

  for (let m = startMinutes; m + config.session_duration_minutes <= endMinutes; m += step) {
    const slotTime = minutesToTime(m);

    // Check if blocked
    const isBlocked = (blocks || []).some((b: any) => {
      if (b.block_full_day) return true;
      const bStart = timeToMinutes(b.blocked_start_time);
      const bEnd = timeToMinutes(b.blocked_end_time);
      return m < bEnd && m + config.session_duration_minutes > bStart;
    });
    if (isBlocked) continue;

    // Check min advance (only for today)
    if (dateStr === now.toISOString().split("T")[0]) {
      const slotDate = new Date(`${dateStr}T${slotTime}:00`);
      const minAdvance = new Date(now.getTime() + config.min_advance_hours * 60 * 60 * 1000);
      if (slotDate <= minAdvance) continue;
    }

    slots.push(slotTime);
  }

  // Remove occupied slots (check existing appointments)
  const { data: existingApts } = await supabase
    .from("appointments")
    .select("appointment_time")
    .eq("user_id", profile.user_id)
    .eq("appointment_date", dateStr);

  const occupiedTimes = new Set(
    (existingApts || []).map((a: any) => a.appointment_time.substring(0, 5))
  );

  const availableSlots = slots.filter((s) => !occupiedTimes.has(s));

  return json({ ...baseInfo, slots: availableSlots });
}

// POST /public-booking
async function handleCreateBooking(req: Request, supabase: any) {
  const body = await req.json();
  const { slug, date, time, patientName, patientAge } = body;

  // Validate required fields
  if (!slug || !date || !time || !patientName || !patientAge) {
    return json({ error: "Campos obrigatórios: slug, date, time, patientName, patientAge" }, 400);
  }

  // Sanitize inputs
  const cleanName = String(patientName).trim().substring(0, 200);
  const cleanAge = String(patientAge).trim();

  if (cleanName.length < 2) return json({ error: "Nome muito curto" }, 400);
  const ageNum = parseInt(cleanAge, 10);
  if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) return json({ error: "Idade inválida" }, 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: "Data inválida" }, 400);
  if (!/^\d{2}:\d{2}$/.test(time)) return json({ error: "Horário inválido" }, 400);

  // Get profile
  const { data: profiles } = await supabase.rpc("get_profile_by_slug", { p_slug: slug });
  if (!profiles?.length) return json({ error: "Profissional não encontrado" }, 404);
  const userId = profiles[0].user_id;

  // Get config
  const { data: config } = await supabase
    .from("booking_config")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!config || !config.booking_enabled) {
    return json({ error: "Agendamento online não disponível" }, 400);
  }

  const now = new Date();
  const targetDate = new Date(date + "T12:00:00Z");
  const today = new Date(now.toISOString().split("T")[0] + "T12:00:00Z");

  // Validate date not in past
  if (targetDate < today) return json({ error: "Data no passado" }, 400);

  // Validate max advance
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + config.max_advance_days);
  if (targetDate > maxDate) return json({ error: "Data muito distante" }, 400);

  // Validate min advance
  const slotDatetime = new Date(`${date}T${time}:00`);
  const minAdvance = new Date(now.getTime() + config.min_advance_hours * 60 * 60 * 1000);
  if (slotDatetime <= minAdvance) {
    return json({ error: "Horário não disponível (antecedência mínima)" }, 400);
  }

  // Check day availability
  const dayOfWeek = new Date(date + "T12:00:00").getDay();
  const { data: daySetting } = await supabase
    .from("availability_settings")
    .select("*")
    .eq("user_id", userId)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true)
    .single();

  if (!daySetting) return json({ error: "Dia não disponível" }, 400);

  // Check time is within range
  const slotMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(daySetting.start_time);
  const endMinutes = timeToMinutes(daySetting.end_time);
  if (slotMinutes < startMinutes || slotMinutes + config.session_duration_minutes > endMinutes) {
    return json({ error: "Horário fora do expediente" }, 400);
  }

  // Check blocks
  const { data: blocks } = await supabase
    .from("availability_blocks")
    .select("*")
    .eq("user_id", userId)
    .eq("blocked_date", date);

  const isBlocked = (blocks || []).some((b: any) => {
    if (b.block_full_day) return true;
    const bStart = timeToMinutes(b.blocked_start_time);
    const bEnd = timeToMinutes(b.blocked_end_time);
    return slotMinutes < bEnd && slotMinutes + config.session_duration_minutes > bStart;
  });
  if (isBlocked) return json({ error: "Horário bloqueado" }, 400);

  // Check conflict with existing appointments
  const { data: conflict } = await supabase
    .from("appointments")
    .select("id")
    .eq("user_id", userId)
    .eq("appointment_date", date)
    .eq("appointment_time", time)
    .limit(1);

  if (conflict && conflict.length > 0) {
    return json({ error: "Horário já ocupado" }, 400);
  }

  // Find or create patient
  let patientId: string | null = null;

  // Try to find existing patient by name and phone
  const { data: existingPatients } = await supabase
    .from("patients")
    .select("id")
    .eq("user_id", userId)
    .ilike("name", cleanName)
    .limit(1);

  if (existingPatients && existingPatients.length > 0) {
    patientId = existingPatients[0].id;
  } else {
    // Create new patient
    const { data: newPatient, error: patientErr } = await supabase
      .from("patients")
      .insert({
        user_id: userId,
        name: cleanName,
      })
      .select("id")
      .single();

    if (patientErr) {
      console.error("Error creating patient:", patientErr);
      return json({ error: "Erro ao registrar paciente" }, 500);
    }
    patientId = newPatient.id;
  }

  // Create appointment
  const { error: aptErr } = await supabase.from("appointments").insert({
    user_id: userId,
    patient_id: patientId,
    patient_name: cleanName,
    appointment_date: date,
    appointment_time: time,
    notes: `Agendamento online | Tel: ${cleanPhone}${cleanEmail ? ` | Email: ${cleanEmail}` : ""}`,
  });

  if (aptErr) {
    console.error("Error creating appointment:", aptErr);
    return json({ error: "Erro ao criar agendamento" }, 500);
  }

  return json({ success: true, message: "Consulta agendada com sucesso!" });
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}
