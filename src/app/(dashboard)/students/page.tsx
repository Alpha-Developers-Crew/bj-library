"use client";

import { useEffect, useState, useCallback } from "react";
import { getStudents, deleteStudent } from "@/lib/actions/students";
import DataTable from "@/components/DataTable";
import Link from "next/link";
import { Plus, Eye, Pencil, Trash2, Search } from "lucide-react";
import { isBefore } from "date-fns";

interface Student {
  id: string; name: string; mobile: string; joinDate: Date; expiryDate: Date; activeStatus: boolean;
  assignments: { id: string; seat: { seatNumber: number }; timeSlot: { name: string } }[];
}

const filterBtns = [
  { key: "all", label: "All Students" },
  { key: "active", label: "Active" },
  { key: "expired", label: "Expired" },
];

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStudents(search || undefined, filter !== "all" ? filter : undefined);
      setStudents(data as Student[]);
    } catch {}
    setLoading(false);
  }, [search, filter]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const handleSearch = () => loadStudents();

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteStudent(deleteId);
    setDeleteId(null); loadStudents();
  };

  const columns = [
    {
      key: "name", label: "Name",
      render: (item: Student) => (
        <Link href={`/students/${item.id}`} className="text-primary hover:text-primary font-medium transition-colors">{item.name}</Link>
      ),
    },
    { key: "mobile", label: "Mobile" },
    {
      key: "assignments", label: "Slots",
      render: (item: Student) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-primary/15 text-primary text-xs font-medium">{item.assignments.length} slot(s)</span>
      ),
    },
    {
      key: "expiryDate", label: "Expiry",
      render: (item: Student) => {
        const expired = isBefore(new Date(item.expiryDate), new Date());
        return <span className={`text-sm font-medium ${expired ? "text-danger" : "text-text-secondary"}`}>{new Date(item.expiryDate).toLocaleDateString("en-IN")}</span>;
      },
    },
    {
      key: "activeStatus", label: "Status",
      render: (item: Student) => {
        const expired = isBefore(new Date(item.expiryDate), new Date());
        return (
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
            expired ? "bg-danger/15 text-danger border border-danger/25" : "bg-primary/15 text-primary border border-primary/25"
          }`}>
            {expired ? "Expired" : "Active"}
          </span>
        );
      },
    },
    {
      key: "actions", label: "Actions",
      render: (item: Student) => (
        <div className="flex items-center gap-1.5">
          <Link href={`/students/${item.id}`} className="p-2 rounded-lg hover:bg-hover transition-colors">
            <Eye className="w-4 h-4 text-text-muted" />
          </Link>
          <Link href={`/students/${item.id}?edit=true`} className="p-2 rounded-lg hover:bg-primary/15 transition-colors">
            <Pencil className="w-4 h-4 text-primary" />
          </Link>
          <button onClick={() => setDeleteId(item.id)} className="p-2 rounded-lg hover:bg-danger/15 transition-colors">
            <Trash2 className="w-4 h-4 text-danger" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {filterBtns.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                filter === f.key
                  ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/25"
                  : "bg-surface border border-border text-text-secondary hover:border-primary hover:text-primary"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <Link href="/students/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-medium hover:from-primary-dark hover:to-[#A67A2A] transition-all duration-300 shadow-lg shadow-primary/25">
          <Plus className="w-4 h-4" /> Add Student
        </Link>
      </div>

      <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
        <div className="flex gap-2 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input type="text" placeholder="Search by name, mobile, father name..." value={search}
              onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300" />
          </div>
          <button onClick={handleSearch}
            className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-medium shadow-lg shadow-primary/25 hover:from-primary-dark hover:to-[#A67A2A] transition-all duration-300">
            Search
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <DataTable columns={columns} data={students} searchable={false} pageSize={15} emptyMessage="No students found" />
        )}
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setDeleteId(null)} />
          <div className="relative bg-surface rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-text mb-2">Delete Student</h3>
            <p className="text-text-muted mb-6">Are you sure you want to delete this student? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-5 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-hover transition-colors">Cancel</button>
              <button onClick={handleDelete}
                className="px-5 py-2.5 bg-gradient-to-r from-danger to-danger-dark text-white rounded-xl text-sm font-medium shadow-lg shadow-danger/25 hover:from-danger-dark hover:to-danger-darker transition-all duration-300">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
