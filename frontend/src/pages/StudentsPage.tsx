import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  Plus,
  Trash2,
  UsersRound,
  LoaderCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { Modal } from '../components/ui/Modal';
import { api } from '../services/api';
import { Student, StudentUpdate } from '../types/student';

const PAGE_SIZE = 8;

export const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editFormData, setEditFormData] = useState<StudentUpdate>({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getStudents();
      setStudents(res.students);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load students.';
      setError(msg);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Department options
  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of students) {
      if (s.course && s.course.trim()) {
        set.add(s.course.trim());
      }
    }
    return Array.from(set).sort();
  }, [students]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesDept = selectedDept === 'all' || s.course === selectedDept;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesDept;

      const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
      const studentId = (s.student_id || '').toLowerCase();
      const email = (s.email || '').toLowerCase();
      const course = (s.course || '').toLowerCase();

      const matchesSearch =
        fullName.includes(q) ||
        studentId.includes(q) ||
        email.includes(q) ||
        course.includes(q);

      return matchesDept && matchesSearch;
    });
  }, [students, selectedDept, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredStudents.slice(start, start + PAGE_SIZE);
  }, [filteredStudents, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDept]);

  // Handle Edit
  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setEditError(null);
    setEditFormData({
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      email: student.email || '',
      course: student.course || '',
      year_of_study: student.year_of_study || 1,
      gpa: student.gpa !== null && student.gpa !== undefined ? Number(student.gpa) : null,
      enrollment_status: student.enrollment_status || 'active',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setEditSubmitting(true);
    setEditError(null);

    const identifier = editingStudent.student_id || String(editingStudent.id);
    try {
      const updated = await api.updateStudent(identifier, editFormData);
      setStudents((prev) =>
        prev.map((s) => (s.student_id === identifier || s.id === editingStudent.id ? { ...s, ...updated } : s))
      );
      toast.success('Student updated', {
        description: `Changes to ${updated.first_name} ${updated.last_name} were saved.`,
      });
      setEditingStudent(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update student.';
      setEditError(msg);
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!deletingStudent) return;
    setDeleteSubmitting(true);
    setDeleteError(null);

    const identifier = deletingStudent.student_id || String(deletingStudent.id);
    try {
      await api.deleteStudent(identifier);
      setStudents((prev) => prev.filter((s) => s.student_id !== identifier && s.id !== deletingStudent.id));
      toast.success('Student deleted', {
        description: `Student ${deletingStudent.first_name} ${deletingStudent.last_name} was removed.`,
      });
      setDeletingStudent(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete student.';
      setDeleteError(msg);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <AppLayout
      title="Students"
      subtitle="Search, review, and manage student records returned by your API."
    >
      {/* Action Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-emerald-500" />
          <span>Live student records</span>
          <span>· {loading ? 'Loading...' : `${filteredStudents.length} shown`}</span>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchStudents} disabled={loading}>
            <RefreshCw className={loading ? 'animate-spin' : ''} />
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

      {/* Main Student Directory Card */}
      <Card>
        {/* Search & Department Filters */}
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="relative w-full sm:max-w-[320px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students..."
              className="pl-9"
              aria-label="Search students"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Department:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
              aria-label="Filter by department"
            >
              <option value="all">All departments</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3.5">Student</th>
                <th className="px-4 py-3.5">Identifier</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <LoaderCircle className="mx-auto size-5 animate-spin text-primary" />
                    <p className="mt-3 text-xs text-muted-foreground">Loading student records...</p>
                  </td>
                </tr>
              ) : paginatedStudents.length > 0 ? (
                paginatedStudents.map((student) => {
                  const fullName = `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Student record';
                  const initial = (student.first_name?.[0] || fullName[0] || 'S').toUpperCase();

                  return (
                    <tr key={student.student_id || student.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
                            {initial}
                          </span>
                          <span className="max-w-[220px] truncate text-xs font-semibold text-foreground">
                            {fullName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-muted-foreground">
                        {student.student_id || 'Not provided'}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-foreground">
                        {student.course || '—'}
                      </td>
                      <td className="max-w-[230px] truncate px-4 py-3.5 text-xs text-muted-foreground">
                        {student.email || '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(student)}
                            className="h-8 px-2.5 text-xs font-medium"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeletingStudent(student);
                              setDeleteError(null);
                            }}
                            className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            aria-label={`Delete ${fullName}`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <UsersRound className="mx-auto size-7 text-muted-foreground/60" />
                    <p className="mt-3 text-xs font-semibold text-foreground">
                      {students.length ? 'No matching students' : 'No student records yet'}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {students.length
                        ? 'Try changing the search query or department filter.'
                        : 'Register a student to see live records here.'}
                    </p>
                    {!students.length && (
                      <Button size="sm" asChild className="mt-4">
                        <Link to="/students/new">
                          <Plus />
                          Register a student
                        </Link>
                      </Button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3.5 sm:px-5">
          <p className="text-[11px] text-muted-foreground">
            {filteredStudents.length
              ? `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                  currentPage * PAGE_SIZE,
                  filteredStudents.length
                )} of ${filteredStudents.length}`
              : 'No records'}
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
              className="size-8"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-16 text-center text-[11px] text-muted-foreground font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
              className="size-8"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Edit Student Modal */}
      <Modal
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        title="Edit student"
        description="Update this student's details through the backend API."
        maxWidth="2xl"
      >
        {editError && (
          <Alert variant="destructive" title="Update failed">
            {editError}
          </Alert>
        )}

        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-foreground">First name *</label>
              <Input
                required
                className="mt-1.5"
                value={editFormData.first_name || ''}
                onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Last name *</label>
              <Input
                required
                className="mt-1.5"
                value={editFormData.last_name || ''}
                onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Email address *</label>
              <Input
                type="email"
                required
                className="mt-1.5"
                value={editFormData.email || ''}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Department / Course *</label>
              <Input
                required
                className="mt-1.5"
                value={editFormData.course || ''}
                onChange={(e) => setEditFormData({ ...editFormData, course: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Year of study (1-8) *</label>
              <Input
                type="number"
                min={1}
                max={8}
                required
                className="mt-1.5"
                value={editFormData.year_of_study || 1}
                onChange={(e) => setEditFormData({ ...editFormData, year_of_study: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">GPA (0.00 - 4.00)</label>
              <Input
                type="number"
                step="0.01"
                min={0}
                max={4}
                className="mt-1.5"
                value={editFormData.gpa !== null && editFormData.gpa !== undefined ? editFormData.gpa : ''}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    gpa: e.target.value === '' ? null : parseFloat(e.target.value),
                  })
                }
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Enrollment Status</label>
              <select
                className="mt-1.5 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={editFormData.enrollment_status || 'active'}
                onChange={(e) => setEditFormData({ ...editFormData, enrollment_status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="graduated">Graduated</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => setEditingStudent(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={editSubmitting}>
              {editSubmitting && <LoaderCircle className="size-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingStudent}
        onClose={() => setDeletingStudent(null)}
        title="Delete student?"
        description={`This will permanently remove ${
          deletingStudent ? `${deletingStudent.first_name} ${deletingStudent.last_name}` : 'this record'
        } through the API. This action cannot be undone.`}
        maxWidth="md"
      >
        {deleteError && (
          <Alert variant="destructive" title="Deletion failed">
            {deleteError}
          </Alert>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setDeletingStudent(null)} disabled={deleteSubmitting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleteSubmitting}>
            {deleteSubmitting && <LoaderCircle className="size-4 animate-spin" />}
            Delete student
          </Button>
        </div>
      </Modal>
    </AppLayout>
  );
};
