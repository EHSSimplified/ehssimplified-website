// Runs automatically on every verified Netlify Forms submission.
// For the "gap-assessment" form, it adds the person to Omnisend as an
// email subscriber with their details and assessment results.
// Other forms (like testimonials) are ignored here.
//
// Requires the environment variable OMNISEND_API_KEY (scope: Functions).

const OMNISEND_URL = "https://api.omnisend.com/api/contacts";
const OMNISEND_VERSION = "2026-03-15";

const OWNER_LABELS = {
  pro: "Dedicated EHS pro",
  parttime: "Owner, Operations or HR",
  nobody: "No one",
};

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function clean(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  }
  return out;
}

export default async (req) => {
  let body;
  try {
    body = await req.json();
  } catch {
    console.log("submission-created: could not parse event body");
    return;
  }

  const payload = body?.payload || {};
  if (payload.form_name !== "gap-assessment") return;

  const apiKey = Netlify.env.get("OMNISEND_API_KEY");
  if (!apiKey) {
    console.log("submission-created: OMNISEND_API_KEY is not set");
    return;
  }

  const d = payload.data || {};
  const email = String(d.email || "").trim();
  if (!email) {
    console.log("submission-created: no email on submission");
    return;
  }

  const now = new Date().toISOString();

  const contact = {
    identifiers: [
      {
        type: "email",
        id: email,
        channels: {
          email: { status: "subscribed", statusChangedAt: now },
        },
        consent: clean({
          source: "EHS Gap Assessment (ehssimplified.com/gap-assessment)",
          createdAt: payload.created_at || now,
          ip: d.ip,
          userAgent: d.user_agent,
        }),
      },
    ],
    firstName: d.first_name || undefined,
    lastName: d.last_name || undefined,
    tags: ["gap-assessment-lead", "source: gap assessment"],
    customProperties: clean({
      company: d.company,
      job_title: d.job_title,
      phone_number: d.phone,
      employees: num(d.employees),
      locations: d.sites,
      manager_seats: d.manager_seats,
      business_type: d.industry,
      naics: d.naics,
      safety_owner: OWNER_LABELS[d.safety_owner] || d.safety_owner,
      injuries_12mo: d.recordables_12mo,
      gap_score: num(d.readiness_score),
      gap_risk_level: d.risk_level,
      gap_fine_low: num(d.fine_low),
      gap_fine_high: num(d.fine_high),
      gap_injury_cost_3yr: num(d.injury_cost_3yr),
      gap_recommended_plan: d.recommended_plan,
      gap_top_gaps: d.top_gaps ? String(d.top_gaps).slice(0, 2000) : undefined,
      gap_assessment_date: now,
      lead_source: d.utm_source || "website",
    }),
  };

  try {
    const res = await fetch(OMNISEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Omnisend-API-Key ${apiKey}`,
        "Omnisend-Version": OMNISEND_VERSION,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(contact),
    });
    const text = await res.text();
    if (!res.ok) {
      console.log(`submission-created: Omnisend error ${res.status}: ${text.slice(0, 500)}`);
    } else {
      console.log(`submission-created: Omnisend contact saved (${res.status})`);
    }
  } catch (err) {
    console.log(`submission-created: request failed: ${err.message}`);
  }
};
