"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getMember } from "@/config/members";
import { getClient } from "@/config/clients";
import { saveOffer } from "@/lib/offers";
import type { Offer } from "@/types";

/**
 * Enregistre l'offre d'un client.
 *
 * Le controle des droits se fait ici, cote serveur : une action serveur est
 * appelable depuis le navigateur, on ne peut donc pas se contenter de masquer
 * le formulaire aux non-administrateurs.
 */
export async function updateOffer(input: Offer): Promise<{ ok: boolean; message: string }> {
  const session = await auth();
  const member = getMember(session?.user?.email);

  if (!member) return { ok: false, message: "Non connecte." };
  if (member.role !== "direction") {
    return { ok: false, message: "Seule la direction peut modifier une offre." };
  }
  if (!getClient(input.clientId)) {
    return { ok: false, message: "Client inconnu." };
  }

  try {
    await saveOffer({
      ...input,
      updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      updatedBy: member.name,
    });
  } catch (e) {
    return { ok: false, message: String(e).slice(0, 200) };
  }

  revalidatePath(`/client/${input.clientId}`);
  return { ok: true, message: "Offre enregistree." };
}