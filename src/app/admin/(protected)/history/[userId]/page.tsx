import { SessionHistoryDetail } from "../../components/SessionHistoryDetail";

export default async function SessionHistoryPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return <SessionHistoryDetail userId={userId} />;
}
