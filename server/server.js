import express from "express";
import cors from "cors";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

const app = express();
app.use(cors());

// Replace this with your numeric GA4 property ID (not the G- tag)
const PROPERTY_ID = process.env.GA4_PROPERTY_ID || "123456789";

// The Google client library uses the GOOGLE_APPLICATION_CREDENTIALS env var to find
// your service account JSON key. Make sure to set this in your environment before
// starting the server: export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/key.json"
const analyticsDataClient = new BetaAnalyticsDataClient();

// Summary endpoint: returns 28‑day timeseries and top pages for the past 7 days
app.get("/api/ga/summary", async (req, res) => {
  try {
    const [report] = await analyticsDataClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
      metrics: [
        { name: "totalUsers" },
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "screenPageViews" }
      ],
      dimensions: [{ name: "date" }]
    });

    const [topPages] = await analyticsDataClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      metrics: [{ name: "screenPageViews" }],
      dimensions: [{ name: "pagePath" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 10
    });

    res.json({
      timeseries: (report.rows ?? []).map(r => ({
        date: r.dimensionValues?.[0]?.value,
        totalUsers: Number(r.metricValues?.[0]?.value || 0),
        activeUsers: Number(r.metricValues?.[1]?.value || 0),
        sessions: Number(r.metricValues?.[2]?.value || 0),
        pageViews: Number(r.metricValues?.[3]?.value || 0)
      })),
      topPages: (topPages.rows ?? []).map(r => ({
        path: r.dimensionValues?.[0]?.value,
        views: Number(r.metricValues?.[0]?.value || 0)
      }))
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "GA query failed" });
  }
});

// Realtime endpoint: returns the number of active users right now
app.get("/api/ga/realtime", async (req, res) => {
  try {
    const [rt] = await analyticsDataClient.runRealtimeReport({
      property: `properties/${PROPERTY_ID}`,
      metrics: [{ name: "activeUsers" }]
    });
    res.json({ activeUsers: Number(rt.rows?.[0]?.metricValues?.[0]?.value || 0) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Realtime query failed" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`GA4 API listening on :${PORT}`));
