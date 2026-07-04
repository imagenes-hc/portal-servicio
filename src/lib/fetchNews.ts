import { XMLParser } from "fast-xml-parser";

export interface NewsItem {
  source: string;
  sourceIcon: string;
  title: string;
  description: string;
  url: string;
  date: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

const technicalKeywords = [
  "tomografía",
  "tomografia",
  "tc",
  "tac",
  "mamografía",
  "mamografia",
  "radioscopia",
  "fluoroscopia",
  "radiografía",
  "radiografia",
  "rayos x",
  "resonancia",
  "rm",
  "irm",
  "ultrasonido",
  "ecografía",
  "ecografia",
  "pet",
  "spect",
  "medicina nuclear",
  "contraste",
  "dosis de radiación",
  "radiación",
  "radiacion",
  "inteligencia artificial",
  "ia",
  "algoritmo",
  "reconstrucción",
  "reconstruccion",
  "detección",
  "deteccion",
  "diagnóstico",
  "diagnostico",
  "equipo",
  "sistema",
  "tecnología",
  "tecnologia",
  "3d",
  "portátil",
  "portatil",
  "digital",
  "imagen",
  "imágenes",
  "imagenes",
  "flujo de trabajo",
  "software",
  "pulmonar",
  "cardíaco",
  "cardiaco",
  "cáncer",
  "cancer",
  "tumor",
  "hueso",
  "ósea",
  "osea",
  "vascular",
  "dosis",
  "radiación",
  "radiacion",
  "rayos x",
  "rx",
];

const excludeKeywords = [
  "premio",
  "consigue",
  "premiad",
  "convocatoria",
  "beca",
  "subvención",
  "nombramiento",
  "elecciones",
  "presidente",
  "presupuesto",
  "junta directiva",
  "toc alert",
  "newsletter",
  "alcalde",
  "alcaldesa",
  "recibió",
  "recibe",
  "recibir",
  "nombrado",
  "designado",
  "fallecimiento",
  "obituario",
  "agenda",
  "reunión",
];

function isRelevant(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase().substring(0, 500);
  const hasExclude = excludeKeywords.some((k) => text.includes(k));
  if (hasExclude) return false;
  return technicalKeywords.some((k) => text.includes(k));
}

const sourceIcons: Record<string, string> = {
  MedImaging: "🖥️",
  SERAM: "🏛️",
  "Google News": "🌐",
};

const sources = [
  {
    name: "MedImaging",
    url: "https://www.medimaging.es/rss/311/radiografía.rss",
  },
  {
    name: "MedImaging",
    url: "https://www.medimaging.es/rss/315/imaginología_general.rss",
  },
  { name: "SERAM", url: "https://seram.es/feed/" },
  {
    name: "Google News",
    url: "https://news.google.com/rss/search?q=radiolog%C3%ADa+tomograf%C3%ADa+mamograf%C3%ADa+fluoroscopia+rayos+X+TC&hl=es&gl=ES&ceid=ES:es",
  },
];

function feedToNewsItems(items: any[], sourceName: string): NewsItem[] {
  return items
    .filter((item) => {
      const title = item.title ?? item["atom:title"] ?? "";
      const desc = item.description ?? item["atom:summary"] ?? "";
      return isRelevant(title, typeof desc === "string" ? desc : "");
    })
    .slice(0, 4)
    .map((item) => ({
      source: sourceName,
      sourceIcon: sourceIcons[sourceName] ?? "📰",
      title: item.title ?? "",
      description: stripHtml(
        typeof item.description === "string" ? item.description : "",
      ).substring(0, 200),
      url: item.link?.startsWith("http")
        ? item.link
        : (item.guid?.["#text"] ?? item.link ?? ""),
      date: item.pubDate ?? "",
    }));
}

export async function fetchNews(): Promise<NewsItem[]> {
  const parser = new XMLParser({ ignoreAttributes: false });

  const results = await Promise.allSettled(
    sources.map(async (s) => {
      const res = await fetch(s.url, {
        headers: { "User-Agent": "Portal-Servicio/1.0" },
      });
      const xml = await res.text();
      const data = parser.parse(xml);
      const channel = data.rss?.channel;
      if (!channel?.item) return [];
      const items = Array.isArray(channel.item) ? channel.item : [channel.item];
      return feedToNewsItems(items, s.name);
    }),
  );

  const seen = new Set<string>();

  return results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => (r as PromiseFulfilledResult<NewsItem[]>).value)
    .filter((item) => {
      const key = item.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);
}
