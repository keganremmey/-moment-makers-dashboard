import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClientByToken } from "@/lib/data";
import { DashboardNav } from "@/components/DashboardNav";

export async function generateMetadata(
  props: LayoutProps<"/d/[token]">
): Promise<Metadata> {
  const { token } = await props.params;
  const client = await getClientByToken(token);

  if (!client) {
    return { title: "Moment Makers" };
  }

  return {
    title: `${client.identity_names?.[0] ?? client.name} — Moment Makers`,
  };
}

export default async function DashboardLayout(
  props: LayoutProps<"/d/[token]">
) {
  const { token } = await props.params;
  const client = await getClientByToken(token);

  if (!client) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-4">
        <div className="flex items-baseline gap-3">
          <span className="forte-mark text-3xl">𝑓𝑓</span>
          <div>
            <h1 className="font-display text-3xl uppercase tracking-tight leading-none text-paper">
              {client.identity_names?.[0] ?? client.name}
            </h1>
            <p className="label">{client.program}</p>
          </div>
        </div>
        <DashboardNav token={token} />
      </header>
      <main className="flex-1">{props.children}</main>
    </div>
  );
}
