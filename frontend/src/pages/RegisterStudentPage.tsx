import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, UserPlus, ArrowRight, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { api } from '../services/api';
import { StudentCreate } from '../types/student';

export const RegisterStudentPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<StudentCreate>({
    student_id: '',
    first_name: '',
    last_name: '',
    email: '',
    course: '',
    year_of_study: 1,
    gpa: 3.5,
    enrollment_status: 'active',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload: StudentCreate = {
        ...formData,
        student_id: formData.student_id.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        course: formData.course.trim(),
        year_of_study: Number(formData.year_of_study),
        gpa: formData.gpa !== null && formData.gpa !== undefined && String(formData.gpa) !== '' ? Number(formData.gpa) : null,
      };

      await api.createStudent(payload);
      toast.success('Student registered', {
        description: `Student ${payload.first_name} ${payload.last_name} (${payload.student_id}) was saved through the API.`,
      });
      navigate('/students');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not register student.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout
      title="Register student"
      subtitle="Add a student using the fields defined by your FastAPI service."
    >
      {/* Back button */}
      <div className="mb-5">
        <Button variant="ghost" size="sm" asChild className="px-2 text-muted-foreground">
          <Link to="/students">
            <ChevronLeft />
            Back to directory
          </Link>
        </Button>
      </div>

      <Card className="max-w-3xl">
        {/* Header */}
        <div className="border-b border-border px-5 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-accent text-primary">
              <UserPlus size={18} />
            </span>
            <div>
              <h2 className="font-display text-sm font-bold text-foreground">Student details</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Fields and validation are enforced directly by the backend FastAPI schema.
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-7">
          {error && (
            <Alert variant="destructive" title="Student could not be saved">
              {error}
            </Alert>
          )}

          <div className="mb-5 rounded-md bg-muted/60 px-3.5 py-3 text-[11px] text-muted-foreground">
            Form fields validated against backend schema · <span className="font-medium">POST /api/v1/students/</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Campus Student ID <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. STU-2024-001"
                  className="mt-1.5"
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Unique identification code for the student.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Department / Degree Course <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Cloud DevOps Engineering"
                  className="mt-1.5"
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  First name <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Jane"
                  className="mt-1.5"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Last name <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Doe"
                  className="mt-1.5"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Email address <span className="text-destructive">*</span>
                </label>
                <Input
                  type="email"
                  required
                  placeholder="e.g. jane.doe@university.edu"
                  className="mt-1.5"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Academic year of study (1-8) <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  min={1}
                  max={8}
                  required
                  className="mt-1.5"
                  value={formData.year_of_study}
                  onChange={(e) => setFormData({ ...formData, year_of_study: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Grade Point Average (GPA 0.0 - 4.0)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  max={4}
                  placeholder="e.g. 3.85"
                  className="mt-1.5"
                  value={formData.gpa ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      gpa: e.target.value === '' ? null : parseFloat(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Enrollment status
                </label>
                <select
                  className="mt-1.5 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                  value={formData.enrollment_status || 'active'}
                  onChange={(e) => setFormData({ ...formData, enrollment_status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="graduated">Graduated</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-5">
              <Button type="button" variant="outline" asChild>
                <Link to="/students">Cancel</Link>
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <LoaderCircle className="size-4 animate-spin" />}
                Register student
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </AppLayout>
  );
};
