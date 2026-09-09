export type Role = "direction" | "operations" | "seo";

export type Member = {
  email: string;
  name: string;
  role: Role;
  scope: "*" | string[];
};

export const MEMBERS: Member[] = [
  {
    email: "contact@omniarank.com",
    name: "Direction",
    role: "direction",
    scope: "*",
  },
  {
    email: "chenal.mathieu.kys@gmail.com",
    name: "Mathieu",
    role: "operations",
    scope: "*",
  },
];

export function getMember(email: string | null | undefined): Member | null {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  return MEMBERS.find((m) => m.email.toLowerCase() === normalized) ?? null;
}