export const APP_NAME = "Nexvora Studio";

export const CONTACT_INFO = {
  whatsapp: "6282131974325",
  whatsapp_group: "https://chat.whatsapp.com/FskI1eDA6LY4Ni529OftRD?s=cl&p=a&mlu=2",
  admins: [
    { name: "Admin Paijo", phone: "6282131974325" },
    { name: "Admin Ihsan", phone: "6285810509177" }
  ]
};

export const BANK_DETAILS = {
  bank_name: "Bank BRI",
  account_number: "676201000757500",
  account_holder: "THOMAS ADE PRABOWO"
};

export const TRAFFIC_SERVICES = {
  SHOPEE_VIEW: { id: "8402", rate_view_per_coin: 1000, label: "Trafik Shopee" },
  SHOPEE_FOLLOWERS: { id: "7040", rate_per_100: 3, label: "Shopee Followers" },
  SHOPEE_LIKE: { id: "6897", rate_per_100: 2, label: "Shopee Like" },
  SHOPEE_COMMENT: { id: "4239", rate_per_comment: 0.5, label: "Shopee Comment" },
  SHOPEE_LIVE: {
    label: "Trafik Live",
    durations: [
      { label: "60 Menit", id: "8360", price_per_10: 4, min: 10 },
      { label: "90 Menit", id: "8361", price_per_10: 6, min: 10 },
      { label: "120 Menit", id: "8362", price_per_10: 8, min: 10 },
      { label: "180 Menit", id: "8363", price_per_10: 10, min: 10 },
      { label: "240 Menit", id: "8364", price_per_10: 12, min: 10 },
      { label: "360 Menit", id: "8365", price_per_10: 14, min: 10 },
    ]
  },
  TIKTOK_VIEW: { id: "8833", rate_view_per_coin: 1000, label: "TikTok VT View" },
  TIKTOK_SAVED: { id: "7990", rate_per_100: 2, label: "TikTok Saved" },
  TIKTOK_COMMENT: { id: "855", rate_per_comment: 0.5, label: "TikTok Comment" },
  FB_COMMENT: { id: "856", rate_per_2_comments: 1, label: "Komentar FB" },
  FB_TRAFFIC: { id: "8712", rate_view_per_coin: 1000, label: "Trafik FB" },
  IG_COMMENT: { id: "854", rate_per_2_comments: 1, label: "Komentar IG" },
  IG_TRAFFIC: { id: "4932", rate_view_per_coin: 1000, label: "Trafik IG" }
};

export const PREMIUM_PACKAGES = [
  { id: "1_day", label: "1 Hari", cost: 4, days: 1 },
  { id: "1_week", label: "1 Minggu", cost: 7, days: 7 },
  { id: "2_weeks", label: "2 Minggu", cost: 14, days: 14 },
  { id: "1_month", label: "1 Bulan", cost: 28, days: 30 },
];

export const COIN_PRICE_IDR = 3000;
