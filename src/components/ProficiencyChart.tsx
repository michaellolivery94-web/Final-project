import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ClassTopic } from "@/hooks/useTeacherInsights";

interface ProficiencyChartProps {
  topics: ClassTopic[];
}

export const ProficiencyChart = ({ topics }: ProficiencyChartProps) => {
  const getColor = (status: string) => {
    switch (status) {
      case 'critical': return 'hsl(var(--destructive))';
      case 'needs_attention': return 'hsl(var(--warning))';
      default: return 'hsl(var(--primary))';
    }
  };

  const chartData = topics.slice(0, 8).map(topic => ({
    name: topic.skill_title.length > 20 ? topic.skill_title.substring(0, 20) + '...' : topic.skill_title,
    proficiency: topic.avg_proficiency,
    status: topic.status,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lowest Proficiency Topics</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontSize: 12 }}
            />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="proficiency" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.status)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
