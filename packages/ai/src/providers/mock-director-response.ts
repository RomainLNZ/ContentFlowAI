type LooseRecord = Record<string, unknown>;

function records(value: unknown): LooseRecord[] {
  return Array.isArray(value)
    ? value.filter((item): item is LooseRecord => Boolean(item) && typeof item === "object")
    : [];
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function number(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function dateAfter(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * 86_400_000).toISOString();
}

function base(generatedAt: string, values: LooseRecord): LooseRecord {
  return {
    kind: "RISK",
    confidence: 0.95,
    evidence: { facts: [], metrics: [] },
    suggestedAction: { kind: "REVIEW", label: "Examiner la situation" },
    campaignId: null,
    contentId: null,
    objectiveType: null,
    suggestedAt: null,
    expiresAt: dateAfter(generatedAt, 7),
    ...values,
  };
}

export function buildMockDirectorResponse(snapshot: LooseRecord): LooseRecord {
  const generatedAt = text(snapshot.generatedAt) ?? "2026-01-01T00:00:00.000Z";
  const recommendations: LooseRecord[] = [];
  const cadence = (snapshot.cadence ?? {}) as LooseRecord;
  const gaps = records(snapshot.publicationGaps);
  const campaigns = records(snapshot.campaignCoverage);
  const objectives = records(snapshot.objectiveCoverage);
  const blocked = records(snapshot.blockedContents);
  const completeness = (snapshot.brandProfileCompleteness ?? {}) as LooseRecord;
  const brand = (snapshot.brandContext ?? {}) as LooseRecord;

  if (number(completeness.score) < 80) {
    const missing = Array.isArray(completeness.missingFields)
      ? completeness.missingFields.filter((item): item is string => typeof item === "string")
      : [];
    recommendations.push(
      base(generatedAt, {
        kind: "ACTION",
        type: "BRAND_PROFILE_INCOMPLETE",
        priority: number(completeness.score) < 50 ? "HIGH" : "MEDIUM",
        title: "Compléter le profil de marque",
        summary: `Le Brand Profile est complété à ${number(completeness.score)} %.`,
        rationale: "Un contexte de marque incomplet réduit la précision des futures analyses éditoriales.",
        evidence: {
          facts: missing.length ? [`Champs manquants : ${missing.join(", ")}`] : ["Profil incomplet"],
          metrics: [{ label: "Complétude", value: `${number(completeness.score)} %` }],
        },
        suggestedAction: { kind: "COMPLETE_PROFILE", label: "Compléter le Brand Profile" },
      }),
    );
  }

  const ongoingGap = gaps
    .filter((gap) => gap.ongoing === true)
    .sort((left, right) => number(right.days) - number(left.days))[0];
  if (ongoingGap) {
    const days = number(ongoingGap.days);
    recommendations.push(
      base(generatedAt, {
        type: "EDITORIAL_GAP",
        priority: days >= 14 ? "CRITICAL" : "HIGH",
        title: "Interrompre la période de silence éditorial",
        summary: `Aucune publication n’a été détectée depuis ${days} jours.`,
        rationale: "La période sans publication dépasse le seuil de silence configuré dans le workspace.",
        evidence: {
          facts: [`Silence en cours depuis ${text(ongoingGap.from) ?? "une date inconnue"}`],
          metrics: [{ label: "Durée", value: `${days} jours` }],
        },
        suggestedAction: { kind: "PLAN", label: "Examiner le prochain créneau éditorial" },
      }),
    );
    recommendations.push(
      base(generatedAt, {
        kind: "OPPORTUNITY",
        type: "CALENDAR_SUGGESTION",
        priority: "MEDIUM",
        confidence: 0.9,
        title: "Réserver un prochain créneau éditorial",
        summary: "Le calendrier présente une période de silence qui peut accueillir un nouveau brouillon.",
        rationale:
          "Un créneau proche permet de rétablir progressivement la cadence sans planification automatique.",
        evidence: { facts: [`Période vide de ${days} jours`], metrics: [] },
        suggestedAction: { kind: "PLAN", label: "Ouvrir le calendrier" },
        suggestedAt: dateAfter(generatedAt, 1),
      }),
    );
  }

  if (cadence.isBelowTarget === true) {
    recommendations.push(
      base(generatedAt, {
        type: "CADENCE_WARNING",
        priority: "HIGH",
        title: "Rétablir la cadence de publication",
        summary: `La cadence observée est de ${number(cadence.observedWeeklyFrequency)} publication(s) par semaine pour une cible de ${number(cadence.desiredWeeklyFrequency)}.`,
        rationale:
          "La cadence calculée sur la fenêtre historique est inférieure à la préférence du workspace.",
        evidence: {
          facts: ["Cadence observée inférieure à la cible"],
          metrics: [
            { label: "Observée", value: `${number(cadence.observedWeeklyFrequency)}/semaine` },
            { label: "Cible", value: `${number(cadence.desiredWeeklyFrequency)}/semaine` },
          ],
        },
        suggestedAction: { kind: "REVIEW", label: "Revoir le rythme éditorial" },
      }),
    );
  }

  for (const campaign of campaigns.filter((item) => item.coverageState !== "COVERED").slice(0, 3)) {
    const campaignId = text(campaign.campaignId);
    recommendations.push(
      base(generatedAt, {
        type: "CAMPAIGN_GAP",
        priority: campaign.coverageState === "EMPTY" ? "HIGH" : "MEDIUM",
        title: `Renforcer la campagne ${text(campaign.name) ?? "sans nom"}`,
        summary:
          campaign.coverageState === "EMPTY"
            ? "Aucun contenu n’est associé à cette campagne dans la fenêtre analysée."
            : "La campagne ne dispose pas encore d’une couverture éditoriale suffisante.",
        rationale: "La couverture est calculée à partir des contenus liés et de leur état workflow.",
        evidence: {
          facts: [`État de couverture : ${text(campaign.coverageState) ?? "inconnu"}`],
          metrics: [{ label: "Contenus", value: String(number(campaign.contentCount)) }],
        },
        suggestedAction: { kind: "REVIEW", label: "Examiner la campagne" },
        campaignId,
      }),
    );
  }

  for (const objective of objectives.filter((item) => item.underrepresented === true).slice(0, 3)) {
    const objectiveType = text(objective.objective);
    recommendations.push(
      base(generatedAt, {
        kind: "OPPORTUNITY",
        type: "OBJECTIVE_IMBALANCE",
        priority: objective.isPrimary === true ? "HIGH" : "MEDIUM",
        title: `Rééquilibrer l’objectif ${objectiveType ?? "non défini"}`,
        summary: "Cet objectif est sous-représenté dans la fenêtre éditoriale analysée.",
        rationale:
          "La part observée est inférieure au seuil déterministe calculé par Workspace Intelligence.",
        evidence: {
          facts: [objective.isPrimary === true ? "Objectif principal" : "Objectif secondaire"],
          metrics: [{ label: "Part", value: `${Math.round(number(objective.share) * 100)} %` }],
        },
        suggestedAction: { kind: "CREATE_DRAFT", label: "Préparer un brief de brouillon" },
        objectiveType,
      }),
    );
  }

  for (const content of blocked.slice(0, 3)) {
    recommendations.push(
      base(generatedAt, {
        type: "WORKFLOW_BLOCKER",
        priority: number(content.ageHours) >= 96 ? "CRITICAL" : "HIGH",
        title: "Débloquer un contenu éditorial",
        summary: `Un contenu est bloqué dans l’état ${text(content.status) ?? "inconnu"}.`,
        rationale: `Le blocage ${text(content.reason) ?? "détecté"} dépasse le seuil configuré.`,
        evidence: {
          facts: [`Motif : ${text(content.reason) ?? "inconnu"}`],
          metrics: [{ label: "Ancienneté", value: `${number(content.ageHours)} heures` }],
        },
        suggestedAction: { kind: "UNBLOCK_WORKFLOW", label: "Examiner le contenu bloqué" },
        contentId: text(content.contentId),
      }),
    );
  }

  if (recommendations.length === 0) {
    const audience =
      records(brand.targetAudiences)[0] ??
      text(Array.isArray(brand.targetAudiences) ? brand.targetAudiences[0] : null);
    recommendations.push(
      base(generatedAt, {
        kind: "OPPORTUNITY",
        type: "CONTENT_OPPORTUNITY",
        priority: "LOW",
        confidence: 0.85,
        title: "Maintenir l’équilibre éditorial actuel",
        summary: "Aucun risque prioritaire n’est détecté dans le snapshot courant.",
        rationale: `La cadence, les campagnes et le workflow sont actuellement équilibrés${audience ? ` pour ${String(audience)}` : ""}.`,
        evidence: { facts: ["Aucun écart déterministe prioritaire"], metrics: [] },
        suggestedAction: { kind: "REVIEW", label: "Consulter le calendrier" },
      }),
    );
  }

  return { recommendations };
}
