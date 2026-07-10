import "dotenv/config";
import { PrismaClient, RoleScope } from "@prisma/client";

const prisma = new PrismaClient();

const permissions = [
  ["organization.read", "Consulter l’organisation"],
  ["organization.update", "Modifier l’organisation"],
  ["organization.delete", "Supprimer l’organisation"],
  ["workspace.create", "Créer des workspaces"],
  ["workspace.read", "Consulter les workspaces"],
  ["workspace.update", "Modifier les workspaces"],
  ["workspace.delete", "Supprimer les workspaces"],
  ["team.manage", "Gérer les équipes"],
  ["member.read", "Consulter les membres"],
  ["member.invite", "Inviter des membres"],
  ["member.manage", "Gérer les rôles des membres"],
  ["content.read", "Consulter les contenus"],
  ["content.create", "Créer des contenus"],
  ["content.update", "Modifier les contenus"],
  ["content.delete", "Supprimer les contenus"],
  ["content.approve", "Valider les contenus"],
  ["content.publish", "Publier les contenus"],
  ["analytics.read", "Consulter les statistiques"],
  ["ai.use", "Utiliser les fonctions IA"],
  ["ai.configure", "Configurer les agents IA"],
  ["billing.manage", "Gérer la facturation"],
  ["feature_flag.manage", "Gérer les fonctionnalités"],
] as const;

const roleDefinitions = [
  { key: "SUPER_ADMIN", name: "Super administrateur", scope: RoleScope.PLATFORM },
  { key: "OWNER", name: "Propriétaire", scope: RoleScope.ORGANIZATION },
  { key: "ADMIN", name: "Administrateur", scope: RoleScope.ORGANIZATION },
  { key: "MANAGER", name: "Manager", scope: RoleScope.WORKSPACE },
  { key: "EDITOR", name: "Éditeur", scope: RoleScope.WORKSPACE },
  { key: "AUTHOR", name: "Auteur", scope: RoleScope.TEAM },
  { key: "VIEWER", name: "Lecteur", scope: RoleScope.TEAM },
] as const;

const grants: Record<(typeof roleDefinitions)[number]["key"], readonly string[] | "all"> = {
  SUPER_ADMIN: "all",
  OWNER: "all",
  ADMIN: permissions
    .map(([key]) => key)
    .filter((key) => !["organization.delete", "billing.manage"].includes(key)),
  MANAGER: [
    "organization.read",
    "workspace.read",
    "workspace.update",
    "team.manage",
    "member.read",
    "member.invite",
    "content.read",
    "content.create",
    "content.update",
    "content.delete",
    "content.approve",
    "content.publish",
    "analytics.read",
    "ai.use",
  ],
  EDITOR: [
    "organization.read",
    "workspace.read",
    "member.read",
    "content.read",
    "content.create",
    "content.update",
    "content.delete",
    "content.approve",
    "analytics.read",
    "ai.use",
  ],
  AUTHOR: [
    "organization.read",
    "workspace.read",
    "member.read",
    "content.read",
    "content.create",
    "content.update",
    "analytics.read",
    "ai.use",
  ],
  VIEWER: ["organization.read", "workspace.read", "member.read", "content.read", "analytics.read"],
};

async function main() {
  const permissionRecords = new Map<string, string>();
  for (const [key, name] of permissions) {
    const [resource, action] = key.split(".");
    const permission = await prisma.permission.upsert({
      where: { key },
      update: { name, resource: resource!, action: action! },
      create: { key, name, resource: resource!, action: action! },
    });
    permissionRecords.set(key, permission.id);
  }

  for (const definition of roleDefinitions) {
    const role = await prisma.role.upsert({
      where: { systemKey: definition.key },
      update: { name: definition.name, scope: definition.scope },
      create: {
        systemKey: definition.key,
        key: definition.key,
        name: definition.name,
        scope: definition.scope,
        isSystem: true,
      },
    });
    const grantedKeys =
      grants[definition.key] === "all" ? [...permissionRecords.keys()] : grants[definition.key];
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId: role.id } }),
      prisma.rolePermission.createMany({
        data: grantedKeys.map((key) => ({ roleId: role.id, permissionId: permissionRecords.get(key)! })),
        skipDuplicates: true,
      }),
    ]);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
