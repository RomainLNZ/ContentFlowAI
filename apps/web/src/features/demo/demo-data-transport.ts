import type { DataTransport, TenantRequest } from "@/lib/data-transport";
import { DataTransportError } from "@/lib/data-transport";
import type { Campaign, CalendarItem } from "@/features/calendar/calendar.types";
import type { ContentItem, ContentVariant } from "@/features/content/content.types";
import type { DirectorOverview, DirectorRecommendation } from "@/features/today/today.types";

const organizationId = "demo-organization-nova";
const workspaceId = "demo-workspace-editorial";
const now = new Date();
const iso = (days: number, hour = 10) => {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

const campaigns: Campaign[] = [
  { id: "campaign-horizon", name: "Lancement Horizon", color: "#8B5CF6", status: "ACTIVE", _count: { contentItems: 3 } },
  { id: "campaign-expertise", name: "Regards d’experts", color: "#0EA5E9", status: "ACTIVE", _count: { contentItems: 2 } },
  { id: "campaign-coulisses", name: "Coulisses de l’atelier", color: "#10B981", status: "ACTIVE", _count: { contentItems: 1 } },
];

type DemoContent = ContentItem & {
  author: { id: string; fullName: string; avatarPath?: string | null };
  _count: { comments: number };
};

const contents: DemoContent[] = [
  {
    id: "content-horizon-announcement",
    title: "Horizon : donner un cap clair à sa communication",
    body: "Une communication utile ne commence pas par publier davantage. Elle commence par choisir un cap.\n\nAvec Horizon, nous aidons les équipes à transformer leurs priorités en prises de parole cohérentes.",
    cta: "Découvrir l’approche Horizon",
    hashtags: ["#communication", "#strategie", "#PME"],
    status: "SCHEDULED",
    scheduledAt: iso(2, 9),
    timezone: "Europe/Paris",
    campaignId: "campaign-horizon",
    assigneeId: "demo-user-alix",
    reviewerId: "demo-user-samia",
    campaign: { id: "campaign-horizon", name: "Lancement Horizon", color: "#8B5CF6" },
    author: { id: "demo-user-alix", fullName: "Alix Martin", avatarPath: null },
    assignee: { id: "demo-user-alix", fullName: "Alix Martin" },
    reviewer: { id: "demo-user-samia", fullName: "Samia Benali" },
    objective: "Présenter la nouvelle offre",
    tone: "Clair, humain et expert",
    targetAudience: "Dirigeants de PME",
    updatedAt: iso(-1),
    _count: { comments: 2 },
  },
  {
    id: "content-expert-routine",
    title: "La routine éditoriale qui libère les équipes",
    body: "Le manque d’idées est rarement le vrai problème. Le problème, c’est l’absence d’un rythme partagé.\n\nTrois rendez-vous simples suffisent souvent : observer, décider, produire.",
    cta: "Quelle routine fonctionne dans votre équipe ?",
    hashtags: ["#contenu", "#organisation", "#leadership"],
    status: "APPROVED",
    scheduledAt: iso(5, 11),
    timezone: "Europe/Paris",
    campaignId: "campaign-expertise",
    assigneeId: "demo-user-thomas",
    reviewerId: "demo-user-alix",
    campaign: { id: "campaign-expertise", name: "Regards d’experts", color: "#0EA5E9" },
    author: { id: "demo-user-thomas", fullName: "Thomas Leroy", avatarPath: null },
    assignee: { id: "demo-user-thomas", fullName: "Thomas Leroy" },
    reviewer: { id: "demo-user-alix", fullName: "Alix Martin" },
    updatedAt: iso(-2),
    _count: { comments: 1 },
  },
  {
    id: "content-coulisses-workshop",
    title: "Dans les coulisses de notre atelier stratégique",
    body: "Avant les slides, il y a les questions. Avant les messages, il y a les convictions. Voici comment notre équipe prépare un atelier de positionnement.",
    hashtags: ["#coulisses", "#equipe", "#marque"],
    status: "DRAFT",
    scheduledAt: iso(9, 14),
    timezone: "Europe/Paris",
    campaignId: "campaign-coulisses",
    assigneeId: "demo-user-samia",
    reviewerId: null,
    campaign: { id: "campaign-coulisses", name: "Coulisses de l’atelier", color: "#10B981" },
    author: { id: "demo-user-samia", fullName: "Samia Benali", avatarPath: null },
    assignee: { id: "demo-user-samia", fullName: "Samia Benali" },
    reviewer: null,
    updatedAt: iso(-1, 16),
    _count: { comments: 0 },
  },
  {
    id: "content-horizon-proof",
    title: "Ce que 30 jours de cohérence changent vraiment",
    body: "Pendant 30 jours, nous avons suivi un principe simple : un message central, plusieurs preuves, aucun remplissage.",
    hashtags: ["#impact", "#communication"],
    status: "PUBLISHED",
    publishedAt: iso(-4, 9),
    scheduledAt: iso(-4, 9),
    timezone: "Europe/Paris",
    campaignId: "campaign-horizon",
    assigneeId: "demo-user-alix",
    reviewerId: "demo-user-samia",
    campaign: { id: "campaign-horizon", name: "Lancement Horizon", color: "#8B5CF6" },
    author: { id: "demo-user-alix", fullName: "Alix Martin", avatarPath: null },
    assignee: { id: "demo-user-alix", fullName: "Alix Martin" },
    reviewer: { id: "demo-user-samia", fullName: "Samia Benali" },
    updatedAt: iso(-4, 10),
    _count: { comments: 3 },
  },
];

const recommendationBase = {
  confidence: 0.91,
  evidence: { source: "demo-workspace", signals: 4 },
  objectiveType: "AWARENESS",
  expiresAt: iso(7),
  createdAt: iso(-1),
  suggestedAt: iso(1),
};

const recommendations: DirectorRecommendation[] = [
  {
    ...recommendationBase,
    id: "recommendation-calendar-gap",
    type: "CALENDAR_SUGGESTION",
    status: "NEW",
    priority: "HIGH",
    title: "Renforcez le milieu de semaine",
    summary: "Aucun contenu n’est prévu mercredi alors que votre audience y est la plus active.",
    rationale: "Le calendrier présente un intervalle de cinq jours entre deux publications stratégiques.",
    suggestedAction: { label: "Planifier un contenu" },
    campaignId: null,
    contentId: null,
  },
  {
    ...recommendationBase,
    id: "recommendation-proof",
    type: "CONTENT_OPPORTUNITY",
    status: "NEW",
    priority: "HIGH",
    confidence: 0.88,
    title: "Transformez vos résultats en preuve concrète",
    summary: "Le lancement Horizon gagnerait à intégrer un retour d’expérience chiffré.",
    rationale: "La campagne explique bien la méthode mais contient encore peu de preuves tangibles.",
    suggestedAction: { label: "Préparer un brouillon" },
    campaignId: null,
    contentId: null,
  },
  {
    ...recommendationBase,
    id: "recommendation-review",
    type: "WORKFLOW_RISK",
    status: "VIEWED",
    priority: "MEDIUM",
    confidence: 0.82,
    title: "Validez le contenu expert avant vendredi",
    summary: "Une publication approuvée attend encore sa planification définitive.",
    rationale: "Une validation tardive réduirait la régularité de la campagne Regards d’experts.",
    suggestedAction: { label: "Ouvrir le contenu" },
    campaignId: "campaign-expertise",
    contentId: "content-expert-routine",
  },
];

const members = [
  { user: { id: "demo-user-alix", fullName: "Alix Martin", email: "alix@atelier-nova.demo" }, role: { name: "Administratrice" } },
  { user: { id: "demo-user-samia", fullName: "Samia Benali", email: "samia@atelier-nova.demo" }, role: { name: "Éditrice" } },
  { user: { id: "demo-user-thomas", fullName: "Thomas Leroy", email: "thomas@atelier-nova.demo" }, role: { name: "Contributeur" } },
];

type DemoComment = { id: string; body: string; deletedAt: null; createdAt: string; author: { fullName: string } };
type DemoHistory = { id: string; action: string; metadata: unknown; createdAt: string; actor: { fullName: string } | null };
type DemoNotification = { id: string; type: string; readAt: string | null; createdAt: string; actor: { fullName: string } | null; content: { id: string; title: string } | null };

export class DemoDataTransport implements DataTransport {
  private campaigns = structuredClone(campaigns);
  private contents = structuredClone(contents);
  private recommendations = structuredClone(recommendations);
  private notifications: DemoNotification[] = [
    { id: "notification-review", type: "REVIEW_REQUESTED", readAt: null, createdAt: iso(-1, 15), actor: { fullName: "Samia Benali" }, content: { id: "content-expert-routine", title: "La routine éditoriale qui libère les équipes" } },
    { id: "notification-scheduled", type: "CONTENT_SCHEDULED", readAt: null, createdAt: iso(-2, 11), actor: { fullName: "Alix Martin" }, content: { id: "content-horizon-announcement", title: "Horizon : donner un cap clair à sa communication" } },
  ];
  private comments: Record<string, DemoComment[]> = {
    "content-horizon-announcement": [
      { id: "comment-1", body: "Le message est très clair. Peut-on ajouter un exemple client ?", deletedAt: null, createdAt: iso(-2, 14), author: { fullName: "Samia Benali" } },
      { id: "comment-2", body: "Oui, je l’intègre dans la prochaine version.", deletedAt: null, createdAt: iso(-2, 16), author: { fullName: "Alix Martin" } },
    ],
  };
  private history: Record<string, DemoHistory[]> = Object.fromEntries(
    contents.map((item) => [item.id, [{ id: `history-${item.id}`, action: "CONTENT_CREATED", metadata: {}, createdAt: item.updatedAt, actor: { fullName: item.author.fullName } }]]),
  );

  async request<T>(path: string, init: RequestInit = {}, _tenant?: TenantRequest): Promise<T> {
    void _tenant;
    const url = new URL(path, "https://demo.flowpilot.local");
    const method = (init.method ?? "GET").toUpperCase();
    const body = init.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};
    const result = this.route(url, method, body);
    return structuredClone(result) as T;
  }

  private route(url: URL, method: string, body: Record<string, unknown>): unknown {
    const path = url.pathname;
    if (method === "GET" && path === "/v1/me") return demoMe;
    if (path === "/v1/brand-profile") return method === "GET" ? brandProfile : { ...brandProfile, ...body };
    if (path === "/v1/workspace-members" && method === "GET") return members;
    if (path === "/v1/notifications" && method === "GET") return { items: this.notifications };
    if (path === "/v1/notifications/read-all" && method === "POST") {
      this.notifications = this.notifications.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() }));
      return { updated: this.notifications.length };
    }
    if (path === "/v1/ai/status" && method === "GET") return { provider: "demo", configured: true, model: "flowpilot-demo" };
    if (path === "/v1/ai/generate/linkedin" && method === "POST") return this.generateVariants(body);
    if (path === "/v1/campaigns") return this.campaignCollection(method, body);

    const campaignMatch = path.match(/^\/v1\/campaigns\/([^/]+)(\/archive)?$/);
    if (campaignMatch) return this.campaignItem(campaignMatch[1]!, Boolean(campaignMatch[2]), method, body);

    if (path === "/v1/content" && method === "GET") return this.contentCollection(url);
    if (path === "/v1/content" && method === "POST") return this.createContent(body);
    if (path === "/v1/calendar" && method === "GET") return this.calendar(url);
    if (path === "/v1/director/overview" && method === "GET") return this.directorOverview();
    if (path === "/v1/director/recommendations" && method === "GET") return { items: this.recommendations, total: this.recommendations.length, page: 1, pageSize: 8 };
    if (path === "/v1/director/analyses" && method === "POST") return { id: "demo-analysis", status: "COMPLETED", reused: false };

    const recommendationMatch = path.match(/^\/v1\/director\/recommendations\/([^/]+)\/(view|accept|dismiss|prepare-draft)$/);
    if (recommendationMatch) return this.recommendationAction(recommendationMatch[1]!, recommendationMatch[2]!);

    const commentsMatch = path.match(/^\/v1\/content\/([^/]+)\/comments$/);
    if (commentsMatch) return this.contentComments(commentsMatch[1]!, method, body);
    const historyMatch = path.match(/^\/v1\/content\/([^/]+)\/history$/);
    if (historyMatch && method === "GET") return this.history[historyMatch[1]!] ?? [];
    const contentActionMatch = path.match(/^\/v1\/content\/([^/]+)\/(duplicate|transitions|assign|calendar-date)$/);
    if (contentActionMatch) return this.contentAction(contentActionMatch[1]!, contentActionMatch[2]!, body);
    const contentMatch = path.match(/^\/v1\/content\/([^/]+)$/);
    if (contentMatch) return this.contentItem(contentMatch[1]!, method, body);

    throw new DataTransportError(404, "DEMO_ROUTE_NOT_FOUND", `Route de démonstration non gérée : ${method} ${path}`);
  }

  private campaignCollection(method: string, body: Record<string, unknown>) {
    if (method === "GET") return this.campaigns.filter((item) => item.status !== "ARCHIVED");
    const item: Campaign = { id: crypto.randomUUID(), name: String(body.name), color: String(body.color), status: "ACTIVE", _count: { contentItems: 0 } };
    this.campaigns.push(item);
    return item;
  }

  private campaignItem(id: string, archive: boolean, method: string, body: Record<string, unknown>) {
    const item = this.campaigns.find((entry) => entry.id === id);
    if (!item) return this.notFound("Campagne");
    if (archive && method === "POST") item.status = "ARCHIVED";
    else if (method === "PUT") Object.assign(item, body);
    return item;
  }

  private contentCollection(url: URL) {
    const query = url.searchParams.get("q")?.toLocaleLowerCase("fr") ?? "";
    const status = url.searchParams.get("status");
    return { items: this.contents.filter((item) => (!query || `${item.title} ${item.body}`.toLocaleLowerCase("fr").includes(query)) && (!status || item.status === status)) };
  }

  private createContent(body: Record<string, unknown>) {
    const item: DemoContent = {
      id: crypto.randomUUID(), title: String(body.title), body: String(body.body), status: "DRAFT",
      hashtags: Array.isArray(body.hashtags) ? body.hashtags.map(String) : [], timezone: "Europe/Paris",
      campaignId: typeof body.campaignId === "string" ? body.campaignId : null, assigneeId: null, reviewerId: null,
      author: { id: "demo-user-alix", fullName: "Alix Martin", avatarPath: null }, assignee: null, reviewer: null,
      campaign: null, updatedAt: new Date().toISOString(), _count: { comments: 0 },
    };
    this.contents.unshift(item);
    this.history[item.id] = [{ id: crypto.randomUUID(), action: "CONTENT_CREATED", metadata: {}, createdAt: item.updatedAt, actor: { fullName: "Alix Martin" } }];
    return item;
  }

  private contentItem(id: string, method: string, body: Record<string, unknown>) {
    const item = this.contents.find((entry) => entry.id === id);
    if (!item) return this.notFound("Contenu");
    if (method === "PUT") Object.assign(item, body, { updatedAt: new Date().toISOString() });
    return item;
  }

  private contentAction(id: string, action: string, body: Record<string, unknown>) {
    const item = this.contents.find((entry) => entry.id === id);
    if (!item) return this.notFound("Contenu");
    if (action === "duplicate") return this.createContent({ ...item, title: `${item.title} — copie` });
    if (action === "transitions") item.status = body.to as ContentItem["status"];
    if (action === "assign") Object.assign(item, body);
    if (action === "calendar-date") Object.assign(item, body);
    item.updatedAt = new Date().toISOString();
    this.history[id] = [{ id: crypto.randomUUID(), action: action === "transitions" ? "STATUS_CHANGED" : "CONTENT_UPDATED", metadata: body, createdAt: item.updatedAt, actor: { fullName: "Alix Martin" } }, ...(this.history[id] ?? [])];
    return item;
  }

  private contentComments(id: string, method: string, body: Record<string, unknown>) {
    if (method === "GET") return this.comments[id] ?? [];
    const comment: DemoComment = { id: crypto.randomUUID(), body: String(body.body), deletedAt: null, createdAt: new Date().toISOString(), author: { fullName: "Alix Martin" } };
    this.comments[id] = [...(this.comments[id] ?? []), comment];
    return comment;
  }

  private calendar(url: URL) {
    const from = new Date(url.searchParams.get("from") ?? 0).getTime();
    const to = new Date(url.searchParams.get("to") ?? "2999-01-01").getTime();
    const items: CalendarItem[] = this.contents
      .filter((item) => item.scheduledAt && new Date(item.scheduledAt).getTime() >= from && new Date(item.scheduledAt).getTime() < to)
      .map((item) => ({ id: item.id, title: item.title, status: item.status, platform: "LINKEDIN", scheduledAt: item.scheduledAt ?? null, timezone: item.timezone, updatedAt: item.updatedAt, author: { ...item.author, avatarPath: item.author.avatarPath ?? null }, assignee: item.assignee ? { ...item.assignee, avatarPath: null } : null, campaign: item.campaign ?? null, _count: item._count }));
    return { items };
  }

  private directorOverview(): DirectorOverview {
    const active = this.recommendations.filter((item) => !["DISMISSED", "COMPLETED"].includes(item.status));
    return {
      analysis: { id: "demo-analysis", status: "COMPLETED", provider: "demo", model: "flowpilot-demo", createdAt: iso(-1), completedAt: iso(-1, 11), errorCode: null },
      state: "COMPLETED", provider: "demo", topRecommendations: active,
      priorities: { LOW: 0, MEDIUM: active.filter((item) => item.priority === "MEDIUM").length, HIGH: active.filter((item) => item.priority === "HIGH").length, CRITICAL: 0 },
      risks: active.filter((item) => item.type.includes("RISK")), opportunities: active.filter((item) => item.type.includes("OPPORTUNITY")),
      freshness: { state: "FRESH", ageSeconds: 900 },
    };
  }

  private recommendationAction(id: string, action: string) {
    const item = this.recommendations.find((entry) => entry.id === id);
    if (!item) return this.notFound("Recommandation");
    if (action === "view" && item.status === "NEW") item.status = "VIEWED";
    if (action === "accept") item.status = "ACCEPTED";
    if (action === "dismiss") item.status = "DISMISSED";
    if (action === "prepare-draft") return { subject: item.title, angle: item.summary, objective: "Développer la notoriété", audience: "Dirigeants de PME", platform: "LINKEDIN", campaign: item.campaignId ? { id: item.campaignId, name: this.campaigns.find((campaign) => campaign.id === item.campaignId)?.name ?? "Campagne" } : null, suggestedAt: item.suggestedAt, context: `${item.summary}\n\n${item.rationale}`, recommendationId: item.id };
    return item;
  }

  private generateVariants(body: Record<string, unknown>) {
    const brief = String(body.brief ?? "Votre idée");
    const variants: ContentVariant[] = ["DIRECT_CONCISE", "EXPERT_EDUCATIONAL", "HUMAN_ENGAGING"].map((style, index) => ({
      id: `demo-variant-${index + 1}`, style: style as ContentVariant["style"], angle: ["Le constat essentiel", "La méthode en trois étapes", "L’histoire derrière le projet"][index]!, hook: index === 0 ? "Et si le vrai problème n’était pas le manque de contenu ?" : brief.slice(0, 140), body: "Une proposition structurée à partir de votre brief et du Brand Profile d’Atelier Nova.", cta: "Quel est votre prochain cap ?", hashtags: ["#communication", "#strategie"], rationale: "Angle cohérent avec votre objectif.", confidence: "0.90", warnings: [],
    }));
    return { generationId: "demo-generation", variants };
  }

  private notFound(resource: string): never {
    throw new DataTransportError(404, "DEMO_NOT_FOUND", `${resource} introuvable.`);
  }
}

export const demoTenant = { organizationId, workspaceId };

export const demoMe = {
  user: { id: "demo-user-alix", supabaseAuthId: "demo-auth-alix", email: "alix@atelier-nova.demo", fullName: "Alix Martin", onboardingDone: true },
  memberships: [{ role: { key: "ADMIN", name: "Administratrice" }, organization: { id: organizationId, name: "Atelier Nova", slug: "atelier-nova", workspaces: [{ id: workspaceId, name: "Communication", slug: "communication", isDefault: true }] } }],
};

export const brandProfile = {
  id: "demo-brand-profile", organizationId, workspaceId,
  productsServices: ["Conseil en stratégie de communication", "Ateliers de positionnement", "Accompagnement éditorial"],
  targetAudiences: ["Dirigeants de PME", "Responsables marketing et communication"],
  formalityLevel: "BALANCED", emojiUsage: "LIGHT",
  mission: "Aider les organisations à transformer leurs convictions en communication claire et utile.",
  values: ["Clarté", "Exigence", "Transmission"], primaryLanguage: "fr",
};
