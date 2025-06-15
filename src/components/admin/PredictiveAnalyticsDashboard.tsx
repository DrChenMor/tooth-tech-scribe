
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { generatePredictiveInsights, getForecastData } from '@/services/advancedAnalytics';
import PredictiveInsightsDashboard from './PredictiveInsightsDashboard';
import { Brain, Zap } from 'lucide-react';

const PredictiveAnalyticsDashboard = () => {
  const { data: insights = [], isLoading: insightsLoading } = useQuery({
    queryKey: ['predictive-insights'],
    queryFn: generatePredictiveInsights,
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const { data: forecastData = [], isLoading: forecastLoading } = useQuery({
    queryKey: ['forecast-data'],
    queryFn: getForecastData,
    refetchInterval: 3600000, // Refresh every hour
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6" />
            Predictive Analytics
          </h2>
          <p className="text-muted-foreground">
            AI-powered insights and performance predictions
          </p>
        </div>
      </div>

      <PredictiveInsightsDashboard
        insights={insights}
        forecastData={forecastData}
        isLoading={insightsLoading || forecastLoading}
      />
    </div>
  );
};

export default PredictiveAnalyticsDashboard;
