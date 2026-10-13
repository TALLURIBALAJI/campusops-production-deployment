import React from 'react';
import { Settings2, Activity, ShieldCheck, Check } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { getApiBaseUrl } from '../services/api';

export const SettingsPage: React.FC = () => {
  const baseUrl = getApiBaseUrl();
  const isConfigured = Boolean(baseUrl);

  return (
    <AppLayout
      title="Settings"
      subtitle="Deployment details and the frontend’s connection to campus services."
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        {/* Deployment Architecture */}
        <Card>
          <CardHeader>
            <CardTitle>Deployment architecture</CardTitle>
            <Settings2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <div className="divide-y divide-border px-5 sm:px-6">
            {[
              ['Frontend', 'React + TypeScript + Vite'],
              ['API Service', 'FastAPI (Python stack)'],
              ['Database', 'PostgreSQL (SQLAlchemy ORM)'],
              ['Reverse Proxy', 'Nginx reverse proxy'],
              ['Containerization', 'Docker & Docker Compose'],
              ['CI/CD Automation', 'Jenkins Pipeline'],
              ['Target Cloud', 'AWS EC2 Deployment'],
            ].map(([label, val]) => (
              <div key={label} className="flex flex-wrap justify-between gap-3 py-3.5">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-right text-xs font-semibold text-foreground">{val}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* API Connection */}
        <Card>
          <CardHeader>
            <CardTitle>API connection</CardTitle>
            <Activity className="size-4 text-muted-foreground" />
          </CardHeader>
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <span
                className={`size-2 rounded-full ${
                  isConfigured ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              {isConfigured ? 'Address configured' : 'Using default proxy'}
            </div>

            <div className="mt-4 rounded-md bg-muted/70 p-3.5">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">
                VITE_API_BASE_URL
              </p>
              <p className="mt-1.5 break-all font-mono text-xs text-foreground font-medium">
                {baseUrl || 'http://localhost:8000 (Default)'}
              </p>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              This address is read from the frontend environment during build and runtime. Keep the FastAPI service independently hosted and verify CORS permits browser requests.
            </p>
          </div>
        </Card>
      </div>

      {/* Service Boundaries */}
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Service boundaries</CardTitle>
          <ShieldCheck className="size-4 text-muted-foreground" />
        </CardHeader>
        <div className="grid gap-0 divide-y divide-border px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-0">
          {[
            [
              'Frontend only',
              'CampusOps UI contains no database credentials and never replaces the backend business logic.',
            ],
            [
              'API-owned schema',
              'Registration and edit forms read available field names and validation rules directly from the FastAPI schema.',
            ],
            [
              'Safe service status',
              'Database health is displayed only when the live backend /health response reports it explicitly.',
            ],
          ].map(([title, desc], idx) => (
            <div key={title} className={`py-5 sm:px-6 sm:py-6 ${idx === 0 ? 'sm:pl-6' : ''}`}>
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Check className="size-4 text-emerald-600" />
                {title}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </AppLayout>
  );
};
