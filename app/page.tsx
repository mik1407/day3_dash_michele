import { MockWidget } from "@/components/widgets/mock-widget";
import { WeatherWidget } from "@/components/widgets/weather-widget";

export default function Page() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MockWidget />
        <WeatherWidget />
      </div>
    </div>
  );
}