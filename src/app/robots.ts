import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const APP_URL = "https://familytv.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/", "/family/", "/settings/", "/profile/"],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
