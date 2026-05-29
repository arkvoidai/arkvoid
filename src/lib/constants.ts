export const SITE_URL = "https://arkvoid.com";
export const APP_NAME = "ARKVOID";
export const COMPANY = "ARKVOID Inc.";
export const FOUNDER = "Manish Talukdar";
export const CONTACT_EMAIL = "cherazen.ai@gmail.com";
export const ADMIN_EMAIL = "manishtalukdar666@gmail.com";

// ─── Plan definitions (single source of truth) ────────────────────────────────
// Plan names: FREE, PRO, TEAM, ENTERPRISE
// Pricing is shown in USD in the UI and converted to INR for Razorpay.
export const PLAN_LIMITS = {
  FREE: {
    agents: 3,
    traces: 25_000,
    retention_days: 7,
    price_monthly_usd: 0,
    price_annual_usd: 0,
  },
  PRO: {
    agents: 20,
    traces: 500_000,
    retention_days: 90,
    price_monthly_usd: 24,
    price_annual_usd: 19, // per month billed annually
  },
  TEAM: {
    agents: Infinity,
    traces: 5_000_000,
    retention_days: 365,
    price_monthly_usd: 99,
    price_annual_usd: 79, // per month billed annually
  },
  ENTERPRISE: {
    agents: Infinity,
    traces: Infinity,
    retention_days: Infinity,
    price_monthly_usd: 0, // custom
    price_annual_usd: 0,
  },
};

export const NAV_LINKS = [
  { name: "Product", href: "#product" },
  { name: "Pricing", href: "#pricing" },
  { name: "Docs", href: "#docs" },
  { name: "About", href: "#about" },
];
