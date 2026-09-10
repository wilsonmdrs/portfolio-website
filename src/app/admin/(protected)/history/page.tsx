import { HistoryList } from "../components/HistoryList";

export default function HistoryPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">History</h2>
      <HistoryList />
    </div>
  );
}
