import { redirect } from "next/navigation";

export default function ReserverPage({ params }: { params: { sessionId: string } }) {
  redirect(`/reserver/${params.sessionId}/donnees`);
}
