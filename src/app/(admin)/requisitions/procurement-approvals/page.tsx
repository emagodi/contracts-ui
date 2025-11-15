"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Pagination from "@/components/tables/Pagination";
import { EyeIcon } from "@/icons";
import { useRouter } from "next/navigation";

type Approval = {
  id: number;
  approvalTo?: string;
  approvalSubject?: string;
  approvalReference?: string;
  businessDevelopmentComments?: string;
  approvalStatus?: string;
  createdAt?: string;
};

export default function ProcurementApprovalQueuePage() {
  const router = useRouter();
  const [items, setItems] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<"createdAt" | "id">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const getAccessToken = () => {
    if (typeof window === "undefined") return "";
    const fromLocal = localStorage.getItem("access_token");
    const fromSession = sessionStorage.getItem("access_token");
    return (fromLocal || fromSession || "").trim();
  };

  const authHeaders = useCallback((): HeadersInit => {
    const token = getAccessToken();
    const headers: Record<string, string> = { accept: "*/*" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/approvals/by-status?status=${encodeURIComponent("BUSINESS_DEVELOPMENT_APPROVED")}`, { headers: authHeaders() });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to load approvals");
        }
        const json = await res.json();
        const list: Approval[] = Array.isArray(json)
          ? (json as Approval[])
          : Array.isArray((json as { content?: unknown })?.content)
            ? ((json as { content: Approval[] }).content)
            : [];
        setItems(list);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Error loading data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authHeaders]);

  const sortedItems = useMemo(() => {
    const toTime = (v?: string) => {
      const t = v ? Date.parse(v) : NaN;
      return isNaN(t) ? 0 : t;
    };
    const arr = [...items];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "createdAt") cmp = toTime(a.createdAt) - toTime(b.createdAt);
      else cmp = Number(a.id) - Number(b.id);
      return sortDir === "desc" ? -cmp : cmp;
    });
    return arr;
  }, [items, sortKey, sortDir]);

  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [sortedItems, page, pageSize]);

  return (
    <div>
      <PageBreadcrumb pageTitle="Procurement Approval Queue" />
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-theme-xs dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.05]">
          <div>
            <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">Approvals Awaiting Procurement Decision</p>
            <p className="text-gray-500 text-theme-xs dark:text-gray-400">Filtered by status BUSINESS_DEVELOPMENT_APPROVED</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <label className="text-gray-600">Per page</label>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-700">
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <label className="text-gray-600 ml-2">Sort</label>
            <select value={`${sortKey}_${sortDir}`} onChange={(e) => { const [key, dir] = e.target.value.split("_") as ["createdAt" | "id", "asc" | "desc"]; setSortKey(key); setSortDir(dir); setPage(1); }} className="border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-700">
              <option value="createdAt_desc">Newest</option>
              <option value="createdAt_asc">Oldest</option>
              <option value="id_asc">ID ↑</option>
              <option value="id_desc">ID ↓</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-5">Loading...</div>
        ) : error ? (
          <div className="p-5 text-red-600">{error}</div>
        ) : (
          <div className="p-5">
            <Table>
              <TableHeader className="border-y border-gray-100 dark:border-white/[0.05] bg-gray-50/80">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">ID</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">To</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Reference</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Business Dev Comments</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {pagedItems.map((r) => (
                  <TableRow key={r.id} className="hover:bg-blue-50/50 transition-colors">
                    <TableCell className="px-5 py-4 text-start">{r.id}</TableCell>
                    <TableCell className="px-5 py-4 text-start">{String(r.approvalTo || "-")}</TableCell>
                    <TableCell className="px-5 py-4 text-start">{String(r.approvalReference || r.approvalSubject || "-")}</TableCell>
                    <TableCell className="px-5 py-4 text-start max-w-[380px] truncate">
                      <span title={String(r.businessDevelopmentComments || "-")}>{String(r.businessDevelopmentComments || "-")}</span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <Button size="xs" variant="outline" startIcon={<EyeIcon />} className="rounded-full text-sky-700 ring-1 ring-inset ring-sky-200 hover:bg-sky-50" onClick={() => router.push(`/requisitions/procurement-approvals/${r.id}`)}>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex items-center justify-between px-5 py-4">
          <p className="text-sm text-gray-600">Page {page} of {Math.max(1, Math.ceil(sortedItems.length / pageSize))}</p>
          <Pagination currentPage={page} totalPages={Math.max(1, Math.ceil(sortedItems.length / pageSize))} onPageChange={(p) => setPage(Math.max(1, Math.min(Math.max(1, Math.ceil(sortedItems.length / pageSize)), p)))} />
        </div>
      </div>
    </div>
  );
}