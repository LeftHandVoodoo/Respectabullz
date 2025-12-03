import { Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useHeatCyclePrediction } from '@/hooks/useExternalStuds';
import { formatDate } from '@/lib/utils';

interface HeatCyclePredictionCardProps {
  dogId: string;
  dogName: string;
}

const confidenceColors = {
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  high: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

export function HeatCyclePredictionCard({ dogId, dogName }: HeatCyclePredictionCardProps) {
  const { data: prediction, isLoading } = useHeatCyclePrediction(dogId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Calculating prediction...</div>
        </CardContent>
      </Card>
    );
  }

  if (!prediction || prediction.dataPointCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Heat Cycle Prediction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
            <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Not enough data</p>
              <p className="text-muted-foreground">
                Record at least one complete heat cycle for {dogName} to generate predictions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const now = new Date();
  const isPredictedSoon = prediction.predictedNextHeat && 
    prediction.predictedNextHeat.getTime() - now.getTime() <= 30 * 24 * 60 * 60 * 1000;
  const isPredictedPast = prediction.predictedNextHeat && prediction.predictedNextHeat < now;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Heat Cycle Prediction
            </CardTitle>
            <CardDescription>
              Based on {prediction.dataPointCount} recorded cycle{prediction.dataPointCount !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Badge className={confidenceColors[prediction.confidence]}>
            {prediction.confidence} confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="p-4 border rounded-lg">
            <p className="text-xs text-muted-foreground">Average Cycle Length</p>
            <p className="text-xl font-semibold mt-1">
              {prediction.averageCycleLength 
                ? `${prediction.averageCycleLength} days`
                : 'Unknown'}
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-xs text-muted-foreground">Avg. Time Between Cycles</p>
            <p className="text-xl font-semibold mt-1">
              {prediction.averageIntervalDays 
                ? `${prediction.averageIntervalDays} days`
                : 'Unknown'}
            </p>
            {prediction.averageIntervalDays && (
              <p className="text-xs text-muted-foreground mt-1">
                (~{Math.round(prediction.averageIntervalDays / 30)} months)
              </p>
            )}
          </div>
          <div className={`p-4 border rounded-lg ${
            isPredictedPast 
              ? 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800'
              : isPredictedSoon 
              ? 'bg-pink-50 dark:bg-pink-950 border-pink-200 dark:border-pink-800'
              : ''
          }`}>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Predicted Next Heat
            </p>
            <p className="text-xl font-semibold mt-1">
              {prediction.predictedNextHeat 
                ? formatDate(prediction.predictedNextHeat)
                : 'Unknown'}
            </p>
            {isPredictedPast && (
              <Badge variant="warning" className="mt-2">
                May be in heat now
              </Badge>
            )}
            {isPredictedSoon && !isPredictedPast && (
              <Badge variant="secondary" className="mt-2">
                Coming soon
              </Badge>
            )}
          </div>
        </div>

        {prediction.confidence === 'low' && (
          <p className="text-xs text-muted-foreground mt-4">
            💡 Tip: Record more heat cycles to improve prediction accuracy. 
            3+ cycles are recommended for reliable predictions.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

