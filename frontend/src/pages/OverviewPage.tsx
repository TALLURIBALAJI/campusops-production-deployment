import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  UsersRound,
  GraduationCap,
  Activity,
  Database,
  RefreshCw,
  Plus,
  ArrowRight,
  ArrowUpRight,
  Server,
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { api, getApiBaseUrl } from '../services/api';
import { Student, HealthResponse } from '../types/student';

export const OverviewPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getStudents();
      setStudents(res.students);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch student data.';
      setError(message);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await api.getHealth();
      setHealth(res);
    } catch {
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchHealth();
  }, []);

  const handleRefresh = () => {
    fetchData();
    fetchHealth();
  };

  // Departments ranked by student count
  const departmentsRanking = useMemo(() => {
    const counts = new Map<string, number>();
    for (const student of students) {
      const dept = student.course || 'Unassigned';
      counts.set(dept, (counts.get(dept) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [students]);

  // Recent 5 students
  const recentStudents = useMemo(() => {
    return [...students]
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [students]);

  // Monthly enrollment calculations for chart
  const monthlyChartData = useMemo(() => {
    const monthlyMap = new Map<string, number>();
    for (const student of students) {
      if (!student.created_at) continue;
      const d = new Date(student.created_at);
      if (isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);
    }

    const sortedEntries = Array.from(monthlyMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-8);
    if (sortedEntries.length === 0) return [];

    const maxCount = Math.max(1, ...sortedEntries.map(([, count]) => count));
    return sortedEntries.map(([key, count], idx) => {
      const date = new Date(`${key}-01T00:00:00`);
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
      const x = sortedEntries.length < 2 ? 50 : 8 + (idx * 84) / (sortedEntries.length - 1);
      const y = 85 - (count / maxCount) * 65;
      return { label: monthLabel, count, x, y };
    });
  }, [students]);

  const hasChartData = monthlyChartData.length > 0;
  const polylinePoints = monthlyChartData.map((pt) => `${pt.x},${pt.y}`).join(' ');

  const isHealthy = health?.status?.toLowerCase() === 'healthy' || health?.status?.toLowerCase() === 'ok';
  const isDbConnected = health?.database === 'connected';

  const baseUrl = getApiBaseUrl();

  return (
    <AppLayout
      title="Overview"
      subtitle="A clear, live view of student registrations and campus services."
    >
      {/* Control Bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-emerald-500" />
          <span>Live API data</span>
          {lastUpdated && (
            <span>
              · Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading || healthLoading}
          >
            <RefreshCw className={loading || healthLoading ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Button size="sm" asChild>
            <Link to="/students/new">
              <Plus />
              Add student
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" title="Student records could not be loaded">
          {error}
        </Alert>
      )}

      {/* KPI Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total students"
          value={loading ? '' : students.length}
          icon={UsersRound}
          note="Records returned by the student API"
          loading={loading}
          tone="indigo"
        />
        <StatCard
          label="Departments"
          value={loading ? '' : departmentsRanking.length}
          icon={GraduationCap}
          note="Distinct departments in live records"
          loading={loading}
          tone="blue"
        />
        <StatCard
          label="API service"
          value={healthLoading ? 'Checking' : isHealthy ? 'Healthy' : 'Offline'}
          icon={Activity}
          note={healthLoading ? 'Checking /health endpoint' : isHealthy ? 'Responding to health checks' : 'Unable to reach backend'}
          loading={healthLoading}
          tone={isHealthy ? 'green' : 'amber'}
        />
        <StatCard
          label="Database status"
          value={
            healthLoading
              ? 'Checking'
              : isDbConnected
              ? 'Connected'
              : health?.database
              ? String(health.database)
              : 'API-managed'
          }
          icon={Database}
          note="Database details depend on the health response"
          tone="indigo"
        />
      </div>

      {/* Grid Row 1: Enrollment activity & By Department */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.85fr)]">
        {/* Enrollment Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Enrollment activity</CardTitle>
            <Badge variant="secondary">Monthly</Badge>
          </CardHeader>
          <div className="px-5 pb-5 pt-4 sm:px-6">
            <div className="mb-3 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{hasChartData ? 'Registrations per month' : 'Registration dates not available'}</span>
              <span>{hasChartData ? 'From live records' : 'Chart appears when records include a date'}</span>
            </div>

            <div className="relative h-[220px] w-full">
              {/* Grid Lines */}
              <div className="absolute inset-x-0 top-0 flex h-full flex-col justify-between" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="border-t border-dashed border-border/80" />
                ))}
              </div>

              {hasChartData && (
                <svg
                  className="absolute inset-0 size-full overflow-visible"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  role="img"
                  aria-label="Monthly student registrations"
                >
                  <defs>
                    <linearGradient id="enrollment-fill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" className="text-primary" stopColor="currentColor" stopOpacity="0.18" />
                      <stop offset="100%" className="text-primary" stopColor="currentColor" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <polygon
                    points={`0,100 ${polylinePoints} 100,100`}
                    fill="url(#enrollment-fill)"
                  />
                  <polyline
                    points={polylinePoints}
                    fill="none"
                    className="text-primary"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {monthlyChartData.map((pt) => (
                    <circle
                      key={pt.label}
                      cx={pt.x}
                      cy={pt.y}
                      r="2"
                      className="text-primary"
                      fill="currentColor"
                      stroke="var(--background)"
                      strokeWidth="1"
                    />
                  ))}
                </svg>
              )}
            </div>

            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
              {hasChartData ? (
                monthlyChartData.map((pt) => <span key={pt.label}>{pt.label}</span>)
              ) : (
                <span>—</span>
              )}
            </div>
          </div>
        </Card>

        {/* By Department */}
        <Card>
          <CardHeader>
            <CardTitle>By department</CardTitle>
            <GraduationCap className="size-4 text-muted-foreground" />
          </CardHeader>
          {loading ? (
            <div className="space-y-4 p-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-5 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : departmentsRanking.length > 0 ? (
            <div className="divide-y divide-border">
              {departmentsRanking.map(([dept, count], idx) => (
                <div key={dept} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
                  <span className="flex size-7 items-center justify-center rounded-md bg-secondary text-[11px] font-bold text-secondary-foreground">
                    {idx + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">
                    {dept}
                  </span>
                  <span className="text-xs font-bold tabular-nums text-muted-foreground">
                    {count} {count === 1 ? 'student' : 'students'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <GraduationCap className="mx-auto size-7 text-muted-foreground/60" />
              <p className="mt-3 text-xs font-semibold">No department data</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Departments will appear when student records are registered.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Grid Row 2: Recent registrations & Service health */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.85fr)]">
        {/* Recent Registrations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent registrations</CardTitle>
            <Link
              to="/students"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              View directory <ArrowRight size={14} />
            </Link>
          </CardHeader>
          {loading ? (
            <div className="space-y-4 p-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : recentStudents.length > 0 ? (
            <div className="divide-y divide-border">
              {recentStudents.map((student) => {
                const fullName = `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Student record';
                const initial = (student.first_name?.[0] || fullName[0] || 'S').toUpperCase();
                const formattedDate = student.created_at
                  ? new Date(student.created_at).toLocaleDateString()
                  : 'Date unavailable';

                return (
                  <div
                    key={student.student_id || student.id}
                    className="flex items-center gap-3 px-5 py-3.5 sm:px-6 transition-colors hover:bg-muted/40"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                      {initial}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {fullName}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {student.email || student.course || 'No email provided'}
                      </p>
                    </div>
                    <span className="shrink-0 text-right text-[10px] text-muted-foreground">
                      {formattedDate}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <UsersRound className="mx-auto size-7 text-muted-foreground/60" />
              <p className="mt-3 text-xs font-semibold">No student records yet</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                New registrations will appear here after they are saved.
              </p>
              <Button size="sm" asChild className="mt-4">
                <Link to="/students/new">
                  <Plus />
                  Register a student
                </Link>
              </Button>
            </div>
          )}
        </Card>

        {/* Service Health Card */}
        <Card>
          <CardHeader>
            <CardTitle>Service health</CardTitle>
            <Link
              to="/system"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="View system health"
            >
              <ArrowUpRight size={16} />
            </Link>
          </CardHeader>
          <div className="px-5 sm:px-6">
            {/* FastAPI Service Row */}
            <div className="flex items-center gap-3 border-b border-border py-4">
              <span className="flex size-8 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                <Server size={16} />
              </span>
              <span className="flex-1 text-xs font-semibold">FastAPI service</span>
              {healthLoading ? (
                <Badge variant="secondary">Checking</Badge>
              ) : isHealthy ? (
                <Badge variant="success">Operational</Badge>
              ) : (
                <Badge variant="destructive">Unavailable</Badge>
              )}
            </div>

            {/* Database Row */}
            <div className="flex items-center gap-3 py-4">
              <span className="flex size-8 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                <Database size={16} />
              </span>
              <span className="flex-1 text-xs font-semibold">Database</span>
              {healthLoading ? (
                <Badge variant="secondary">Checking</Badge>
              ) : isDbConnected ? (
                <Badge variant="success">Connected</Badge>
              ) : (
                <Badge variant="secondary">Via API</Badge>
              )}
            </div>
          </div>

          {/* Connection summary */}
          <div className="mx-5 mb-5 rounded-md bg-muted/70 px-3.5 py-3 sm:mx-6">
            <p className="text-[10px] font-semibold uppercase text-muted-foreground">API connection</p>
            <p className="mt-1 break-all font-mono text-[11px] font-medium text-foreground">
              {baseUrl || 'Same-origin / proxy'}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {healthLoading
                ? 'Checking...'
                : isHealthy
                ? 'Responding normally'
                : 'Connection failed or not started'}
            </p>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};
