import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE_URL = "https://reference.ainspire.co.kr/api/search";

async function fetchSearch(params) {
  const url = new URL(BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

const server = new McpServer({
  name: "ainspire-ref",
  version: "1.0.0",
});

server.tool(
  "search_references",
  "Search Ainspire reference images by visual metadata filters. Returns images sorted by reference_score descending.",
  {
    angle: z.string().optional().describe("Camera angle. e.g. eye_level, low_angle, high_angle, dutch_angle, overhead, pov"),
    shot_size: z.string().optional().describe("Shot size. e.g. extreme_close_up, close_up, medium_close_up, medium, medium_wide, wide, extreme_wide"),
    people_count: z.string().optional().describe("Number of people. e.g. none, solo, duo, group"),
    color_mood: z.string().optional().describe("Color mood. e.g. warm, cool, neutral, monochrome, vibrant"),
    saturation: z.string().optional().describe("Color saturation. e.g. low, medium, high, desaturated"),
    mood: z.string().optional().describe("Comma-separated mood tags. e.g. tense,ominous or peaceful,romantic"),
    setting: z.string().optional().describe("Setting. e.g. indoor, outdoor"),
    location_type: z.string().optional().describe("Location type. e.g. urban, rural, nature, fantastical_sci_fi, domestic"),
    lighting: z.string().optional().describe("Lighting type. e.g. natural, artificial, soft_diffuse, hard_dramatic, backlit, golden_hour"),
    time_of_day: z.string().optional().describe("Time of day. e.g. day, night, dawn_dusk, indoor_no_window"),
    composition: z.string().optional().describe("Comma-separated composition tags. e.g. rule_of_thirds,leading_lines"),
    work: z.string().optional().describe("Movie/work title to filter by"),
    min_score: z.number().min(0).max(10).optional().describe("Minimum reference_score (0-10)"),
    query: z.string().optional().describe("Text search in image description"),
    limit: z.number().min(1).max(50).optional().describe("Max results to return (default 20, max 50)"),
  },
  async (args) => {
    const params = {};
    if (args.angle)         params.angle = args.angle;
    if (args.shot_size)     params.shot_size = args.shot_size;
    if (args.people_count)  params.people_count = args.people_count;
    if (args.color_mood)    params.color_mood = args.color_mood;
    if (args.saturation)    params.saturation = args.saturation;
    if (args.mood)          params.mood = args.mood;
    if (args.setting)       params.setting = args.setting;
    if (args.location_type) params.location_type = args.location_type;
    if (args.lighting)      params.lighting = args.lighting;
    if (args.time_of_day)   params.time_of_day = args.time_of_day;
    if (args.composition)   params.composition = args.composition;
    if (args.work)          params.work = args.work;
    if (args.min_score != null) params.min_score = args.min_score;
    if (args.query)         params.q = args.query;
    if (args.limit != null) params.limit = args.limit;

    const data = await fetchSearch(params);

    const summary = data.images.map((img, i) =>
      `[${i + 1}] ${img.id}\n` +
      `  work: ${img.work}\n` +
      `  score: ${img.reference_score ?? "?"}\n` +
      `  shot: ${img.shot_size ?? "-"} / angle: ${img.angle ?? "-"}\n` +
      `  mood: ${(img.mood ?? []).join(", ") || "-"}\n` +
      `  description: ${img.description ?? "-"}\n` +
      `  thumb: ${img.thumb_url}\n` +
      `  original: ${img.original_url}`
    ).join("\n\n");

    return {
      content: [
        {
          type: "text",
          text: `Found ${data.count} images (showing ${data.images.length}):\n\n${summary}`,
        },
      ],
    };
  }
);

server.tool(
  "get_available_filters",
  "Returns all available filter values for each metadata field (angle, shot_size, mood, etc.).",
  {},
  async () => {
    const data = await fetchSearch({ filters_only: "true" });
    const opts = data.options ?? {};

    const lines = Object.entries(opts).map(([key, values]) =>
      `${key}: ${Array.isArray(values) ? values.join(", ") : values}`
    );

    return {
      content: [
        {
          type: "text",
          text: `Available filter options:\n\n${lines.join("\n")}`,
        },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
