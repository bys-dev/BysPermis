import { redirect } from "next/navigation";

// Depuis Next 15, `params` est une promesse : la page doit être asynchrone.
export default async function ReserverPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  redirect(`/reserver/${sessionId}/donnees`);
}
