import Card from "@/components/ui/Card";

interface Stat {
  label: string;
  value: string;
}

export default function StatsOverview({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="text-center">
          <p className="text-2xl font-bold text-palace-primary">{stat.value}</p>
          <p className="text-sm text-foreground/60 mt-1">{stat.label}</p>
        </Card>
      ))}
    </div>
  );
}
