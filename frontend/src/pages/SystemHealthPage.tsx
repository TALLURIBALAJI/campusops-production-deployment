import React, { useState, useEffect } from 'react';
import { Server, Database, RefreshCw, Clock3, Activity } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { api, getApiBaseUrl } from '../services/api';
import { HealthResponse } from '../types/student';

export const SystemHealthPage: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getHealth();
      setHealthData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not reach health check endpoint.';
      setError(msg);
      setHealthData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const isHealthy = healthData?.status?.toLowerCase() === 'healthy' || healthData?.status?.toLowerCase() === 'ok';
  const isDbConnected = healthData?.database === 'connected';
  const baseUrl = getApiBaseUrl();

  return (
    <AppLayout
      title="System health"
      subtitle="Check the FastAPI health endpoint and review details returned by your service."
    >
      {/* Status Bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={`size-2 rounded-full ${
              loading ? 'animate-pulse bg-warning' : isHealthy ? 'bg-success' : 'bg-destructive'
            }`}
          />
          <span>
            {loading
              ? 'Checking services...'
              : isHealthy
              ? 'Health endpoint responding'
              : 'Health check unavailable'}
          </span>
        </div>

        <Button variant="outline" size="sm" onClick={fetchHealth} disabled={loading}>
          <RefreshCw className={loading ? 'animate-spin' : ''} />
          Run check
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" title="Could not reach the health endpoint">
          {error}
        </Alert>
      )}

      {/* Services Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* FastAPI Card */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-primary">
              <Server size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-muted-foreground">Application API</p>
              <p className="mt-1 font-display text-lg font-bold text-foreground">FastAPI</p>
              <p className="mt-1.5 break-all text-xs text-muted-foreground font-mono">
                {baseUrl || 'Same-origin / proxy (localhost:8000)'}
              </p>
            </div>
            {loading ? (
              <Badge variant="secondary">Checking</Badge>
            ) : isHealthy ? (
              <Badge variant="success">Operational</Badge>
            ) : (
              <Badge variant="destructive">Unavailable</Badge>
            )}
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">Health endpoint</span>
              <span className="font-mono font-medium">GET /health</span>
            </div>
            <div className="mt-2.5 flex justify-between text-[11px]">
              <span className="text-muted-foreground">Students endpoint</span>
              <span className="font-mono font-medium">/api/v1/students/</span>
            </div>
            <div className="mt-2.5 flex justify-between text-[11px]">
              <span className="text-muted-foreground">Swagger docs</span>
              <span className="font-mono font-medium">/docs</span>
            </div>
          </div>
        </Card>

        {/* PostgreSQL Database Card */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <Database size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-muted-foreground">PostgreSQL database</p>
              <p className="mt-1 font-display text-lg font-bold text-foreground">
                {loading
                  ? 'Checking...'
                  : isDbConnected
                  ? 'Connected'
                  : healthData?.database || 'Health response only'}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {healthData?.database_message ||
                  (isDbConnected
                    ? 'Database verified by FastAPI health check.'
                    : 'Database connectivity reported via /health.')}
              </p>
            </div>
            {loading ? (
              <Badge variant="secondary">Checking</Badge>
            ) : isDbConnected ? (
              <Badge variant="success">Connected</Badge>
            ) : (
              <Badge variant="secondary">Via API</Badge>
            )}
          </div>

          <div className="mt-5 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
            CampusOps frontend connects through the API layer. Database status is strictly derived from the live FastAPI health check.
          </div>
        </Card>
      </div>

      {/* Raw Health Response */}
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Health response</CardTitle>
          <Clock3 className="size-4 text-muted-foreground" />
        </CardHeader>
        <div className="p-5 sm:p-6">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="size-3.5 animate-spin" />
              Checking GET /health...
            </div>
          ) : healthData ? (
            <pre className="overflow-x-auto rounded-md bg-muted/70 p-4 font-mono text-xs leading-relaxed text-foreground">
              {JSON.stringify(healthData, null, 2)}
            </pre>
          ) : (
            <p className="text-xs text-muted-foreground">No successful response to display.</p>
          )}
        </div>
      </Card>

      {/* Connection Details */}
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Connection details</CardTitle>
          <Activity className="size-4 text-muted-foreground" />
        </CardHeader>
        <div className="divide-y divide-border px-5 sm:px-6">
          {[
            ['API base URL', baseUrl || 'Same-origin / proxy'],
            ['API prefix', '/api/v1'],
            ['Student endpoint', '/api/v1/students/'],
            ['Health endpoint', '/health'],
            ['Environment', healthData?.environment || 'development'],
          ].map(([label, val]) => (
            <div key={label} className="flex flex-wrap justify-between gap-2 py-3.5 text-xs">
              <span className="text-muted-foreground">{label}</span>
              <span className="break-all font-mono font-medium text-foreground">{val}</span>
            </div>
          ))}
        </div>
      </Card>
    </AppLayout>
  );
};
