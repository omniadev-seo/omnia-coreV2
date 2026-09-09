import { auth } from "@/auth";
import { getMember } from "@/config/members";
import { readableClients } from "@/config/clients";
import type { Client } from "@/types";

/**
 * Renvoie les clients que la personne connectee a le droit de voir.
 *
 * Le filtrage se fait ici, cote serveur, avant tout envoi au navigateur.
 * Masquer des lignes cote navigateur serait une illusion : les donnees
 * resteraient lisibles dans les outils developpeur.
 */
export async function clientsInScope(): Promise<Client[]> {
  const session = await auth();
  const member = getMember(session?.user?.email);
  if (!member) return [];

  const clients = readableClients();
  if (member.scope === "*") return clients;

  return clients.filter((c) => member.scope.includes(c.id));
}
