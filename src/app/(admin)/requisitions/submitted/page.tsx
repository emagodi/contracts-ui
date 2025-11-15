"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Pagination from "@/components/tables/Pagination";
import { Modal } from "@/components/ui/modal";
import { EyeIcon, DocsIcon, ArrowUpIcon, DownloadIcon, TrashBinIcon, PencilIcon } from "@/icons";

type Requisition = {
  id: number;
  requisitionFrom?: string;
  requisitionTo?: string;
  requisitionStatus?: string;
  contractPrice?: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  [key: string]: unknown;
};

type Attachment = {
  id: number;
  fileName: string;
  contentType?: string;
  size?: number;
  uploadedAt?: string;
  version?: number;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
};

export default function SubmittedRequisitionsPage() {
  const [items, setItems] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<"createdAt" | "id">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [viewItem, setViewItem] = useState<Requisition | null>(null);

  // Attachments modal state
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentsPage, setAttachmentsPage] = useState(1);
  const [attachmentsTotalPages, setAttachmentsTotalPages] = useState(1);
  const [attachmentsForReqId, setAttachmentsForReqId] = useState<number | null>(null);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [attachmentsError, setAttachmentsError] = useState<string | null>(null);

  const [uploadSuccessOpen, setUploadSuccessOpen] = useState(false);
  const [uploadSuccessReqId, setUploadSuccessReqId] = useState<number | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [confirmDeleteName, setConfirmDeleteName] = useState<string>("");

  const getAccessToken = () => {
    if (typeof window === "undefined") return "";
    const fromLocal = localStorage.getItem("access_token");
    const fromSession = sessionStorage.getItem("access_token");
    return (fromLocal || fromSession || "").trim();
  };

  

  const authHeaders = useCallback((): HeadersInit => {
    const token = getAccessToken();
    const headers: Record<string, string> = { accept: "*/*" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
      const url = `/api/requisitions/by-status?status=SUBMITTED`;
        const h = authHeaders();
        console.log("Auth header", (h as Record<string, string>)?.Authorization || "");
        const res = await fetch(url, { headers: h });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to load requisitions");
        }
        const data = await res.json();
        const list: Requisition[] = Array.isArray(data) ? data : [];
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
      if (sortKey === "createdAt") {
        cmp = toTime(a.createdAt) - toTime(b.createdAt);
      } else {
        cmp = Number(a.id) - Number(b.id);
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return arr;
  }, [items, sortKey, sortDir]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(sortedItems.length / pageSize)), [sortedItems.length, pageSize]);
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [sortedItems, currentPage, pageSize]);

  const openAttachments = async (reqId: number) => {
    setAttachmentsOpen(true);
    setAttachmentsForReqId(reqId);
    setAttachmentsPage(1);
    await loadAttachments(reqId, 1);
  };

  const loadAttachments = async (reqId: number, page: number) => {
    setAttachmentsLoading(true);
    setAttachmentsError(null);
    try {
      const size = 10;
      const url = `/api/attachments/requisition/${reqId}?page=${page - 1}&size=${size}`;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to load attachments");
      }
      const data = await res.json();
      const content: Attachment[] = data?.content || [];
      setAttachments(content);
      const totalPagesFromServer = typeof data?.totalPages === "number" ? data.totalPages : 1;
      setAttachmentsTotalPages(totalPagesFromServer);
    } catch (e: unknown) {
      setAttachmentsError(e instanceof Error ? e.message : "Error loading attachments");
    } finally {
      setAttachmentsLoading(false);
    }
  };

  const downloadAttachment = async (id: number, name: string) => {
    try {
      const url = `/api/attachments/${id}/download`;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) {
        const text = await res.text();
        alert(text || "Download failed");
        return;
      }
      const blob = await res.blob();
      const link = document.createElement("a");
      const href = URL.createObjectURL(blob);
      link.href = href;
      link.download = name || `attachment-${id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
    } catch {
      alert("Download error");
    }
  };

  const deleteAttachment = async (id: number) => {
    try {
      const url = `/api/attachments/${id}`;
      const res = await fetch(url, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) {
        const text = await res.text();
        alert(text || "Delete failed");
        return;
      }
      if (attachmentsForReqId) {
        await loadAttachments(attachmentsForReqId, attachmentsPage);
      }
    } catch {
      alert("Delete error");
    }
  };

  const promptDeleteAttachment = (id: number, name: string) => {
    setConfirmDeleteOpen(true);
    setConfirmDeleteId(id);
    setConfirmDeleteName(name);
  };

  const renameAttachment = async (id: number, currentName: string) => {
    try {
      const newName = window.prompt("Enter new file name", currentName) || "";
      if (!newName || newName === currentName) return;
      const url = `/api/attachments/${id}/rename`;
      const res = await fetch(url, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: newName })
      });
      if (!res.ok) {
        const text = await res.text();
        alert(text || "Rename failed");
        return;
      }
      if (attachmentsForReqId) {
        await loadAttachments(attachmentsForReqId, attachmentsPage);
      }
    } catch {
      alert("Rename error");
    }
  };

  const uploadFiles = async (reqId: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    const url = `/api/requisitions/${reqId}/upload`;
      const h = authHeaders();
      console.log("Upload auth", (h as Record<string, string>)?.Authorization || "");
      const res = await fetch(url, {
        method: "POST",
        headers: h,
        body: fd,
      });
    if (!res.ok) {
      const text = await res.text();
      alert(text || "Upload failed");
      return;
    }
    setUploadSuccessReqId(reqId);
    setUploadSuccessOpen(true);
    if (attachmentsOpen && attachmentsForReqId === reqId) {
      await loadAttachments(reqId, attachmentsPage);
    }
  };

  const triggerUpload = (reqId: number) => {
    const el = document.getElementById(`file-upload-${reqId}`) as HTMLInputElement | null;
    el?.click();
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Submitted Requisitions" />

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-theme-xs dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.05]">
          <div>
            <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">SUBMITTED Requisitions</p>
            <p className="text-gray-500 text-theme-xs dark:text-gray-400">Paginated list with actions</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <label className="text-gray-600">Per page</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-700"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <label className="text-gray-600 ml-2">Sort</label>
            <select
              value={`${sortKey}_${sortDir}`}
              onChange={(e) => {
                const [key, dir] = e.target.value.split("_") as ["createdAt" | "id", "asc" | "desc"];
                setSortKey(key);
                setSortDir(dir);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-700"
            >
              <option value="createdAt_desc">Created (Newest)</option>
              <option value="createdAt_asc">Created (Oldest)</option>
              <option value="id_desc">ID (High→Low)</option>
              <option value="id_asc">ID (Low→High)</option>
            </select>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[900px]">
            <Table>
              <TableHeader className="border-y border-gray-100 dark:border-white/[0.05] bg-gray-50/80">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">ID</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">From</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">To</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Start</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">End</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Price</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {loading ? (
                  <TableRow>
                    <TableCell className="px-5 py-4" colSpan={7}>Loading...</TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell className="px-5 py-4 text-red-600" colSpan={7}>{error}</TableCell>
                  </TableRow>
                ) : pagedItems.length === 0 ? (
                  <TableRow>
                    <TableCell className="px-5 py-4" colSpan={7}>No submitted requisitions</TableCell>
                  </TableRow>
                ) : (
                  pagedItems.map((r) => (
                    <TableRow key={r.id} className="hover:bg-blue-50/50 transition-colors">
                      <TableCell className="px-5 py-4 text-start">{r.id}</TableCell>
                      <TableCell className="px-5 py-4 text-start">{String(r.requisitionFrom || "-")}</TableCell>
                      <TableCell className="px-5 py-4 text-start">{String(r.requisitionTo || "-")}</TableCell>
                      <TableCell className="px-5 py-4 text-start">{String(r.startDate || "-")}</TableCell>
                      <TableCell className="px-5 py-4 text-start">{String(r.endDate || "-")}</TableCell>
                      <TableCell className="px-5 py-4 text-start">{String(r.contractPrice || "-")}</TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <div className="flex items-center gap-2">
                          <Button size="xs" variant="outline" startIcon={<EyeIcon />} className="rounded-full text-sky-700 ring-1 ring-inset ring-sky-200 hover:bg-sky-50" onClick={() => setViewItem(r)}>View</Button>
                          <Button size="xs" variant="outline" startIcon={<ArrowUpIcon />} className="rounded-full text-orange-600 ring-1 ring-inset ring-orange-200 hover:bg-orange-50" onClick={() => triggerUpload(r.id)}>Upload</Button>
                          <input id={`file-upload-${r.id}`} type="file" multiple className="hidden" onChange={(e) => uploadFiles(r.id, e.target.files)} />
                          <Button size="xs" variant="outline" startIcon={<DocsIcon />} className="rounded-full text-green-600 ring-1 ring-inset ring-green-200 hover:bg-green-50" onClick={() => openAttachments(r.id)}>Attachments</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-4">
          <p className="text-sm text-gray-600">Page {currentPage} of {totalPages}</p>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => setCurrentPage(Math.max(1, Math.min(totalPages, p)))} />
        </div>
      </div>

      <Modal isOpen={!!viewItem} onClose={() => setViewItem(null)} className="max-w-[600px] p-6 lg:p-10">
        {viewItem && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-700"><EyeIcon /> Requisition #{viewItem.id}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-semibold">From:</span> {String(viewItem.requisitionFrom || "-")}</div>
              <div><span className="font-semibold">To:</span> {String(viewItem.requisitionTo || "-")}</div>
              <div><span className="font-semibold">Start:</span> {String(viewItem.startDate || "-")}</div>
              <div><span className="font-semibold">End:</span> {String(viewItem.endDate || "-")}</div>
              <div><span className="font-semibold">Price:</span> {String(viewItem.contractPrice || "-")}</div>
              <div><span className="font-semibold">Status:</span> {String(viewItem.requisitionStatus || "-")}</div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button size="sm" variant="outline" className="rounded-full text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50" onClick={() => setViewItem(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={attachmentsOpen} onClose={() => setAttachmentsOpen(false)} className="max-w-[900px] p-6 lg:p-10">
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-emerald-800"><DocsIcon /> Attachments</h3>
          {attachmentsError && <p className="text-red-600 mb-3 text-sm">{attachmentsError}</p>}
            <div className="max-w-full overflow-x-auto">
            <div className="min-w-[700px]">
              <Table>
                <TableHeader className="border-y border-gray-100 dark:border-white/[0.05] bg-gray-50">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">ID</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">File Name</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Created By</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Updated By</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {attachmentsLoading ? (
                    <TableRow>
                      <TableCell className="px-5 py-4" colSpan={5}>Loading...</TableCell>
                    </TableRow>
                  ) : attachments.length === 0 ? (
                    <TableRow>
                      <TableCell className="px-5 py-4" colSpan={5}>No attachments</TableCell>
                    </TableRow>
                  ) : (
                    attachments.map((a) => (
                      <TableRow key={a.id} className="hover:bg-blue-50/50 transition-colors">
                        <TableCell className="px-5 py-4 text-start">{a.id}</TableCell>
                        <TableCell className="px-5 py-4 text-start">{a.fileName}</TableCell>
                        <TableCell className="px-5 py-4 text-start">{String(a.createdBy || "-")}</TableCell>
                        <TableCell className="px-5 py-4 text-start">{String(a.updatedBy || "-")}</TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <div className="flex items-center gap-2">
                            <Button size="xs" variant="outline" startIcon={<DownloadIcon />} className="rounded-full text-green-700 ring-1 ring-inset ring-green-200 hover:bg-green-50" onClick={() => downloadAttachment(a.id, a.fileName)}><span className="sr-only">Download</span></Button>
                            <Button size="xs" variant="outline" startIcon={<PencilIcon />} className="rounded-full text-indigo-700 ring-1 ring-inset ring-indigo-200 hover:bg-indigo-50" onClick={() => renameAttachment(a.id, a.fileName)}><span className="sr-only">Rename</span></Button>
                            <Button size="xs" variant="outline" startIcon={<TrashBinIcon />} className="rounded-full text-red-700 ring-1 ring-inset ring-red-200 hover:bg-red-50" onClick={() => promptDeleteAttachment(a.id, a.fileName)}><span className="sr-only">Delete</span></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">Page {attachmentsPage} of {attachmentsTotalPages}</div>
            <Pagination currentPage={attachmentsPage} totalPages={attachmentsTotalPages} onPageChange={async (p) => {
              if (!attachmentsForReqId) return;
              const newPage = Math.max(1, Math.min(attachmentsTotalPages, p));
              setAttachmentsPage(newPage);
              await loadAttachments(attachmentsForReqId, newPage);
            }} />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button size="sm" variant="outline" className="rounded-full text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50" onClick={() => setAttachmentsOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={uploadSuccessOpen} onClose={() => setUploadSuccessOpen(false)} className="max-w-[520px] p-6 lg:p-10">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-emerald-800">Upload Successful</h3>
          <p className="text-sm text-gray-700 mb-6">Your file(s) have been uploaded. You can view the attachments for this requisition.</p>
          <div className="mt-2 flex justify-end gap-3">
            <Button size="sm" variant="outline" className="rounded-full text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50" onClick={() => setUploadSuccessOpen(false)}>Close</Button>
            <Button size="sm" variant="outline" className="rounded-full text-green-700 ring-1 ring-inset ring-green-300 hover:bg-green-50" onClick={() => {
              if (uploadSuccessReqId) {
                setUploadSuccessOpen(false);
                openAttachments(uploadSuccessReqId);
              }
            }}>View Attachments</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} className="max-w-[520px] p-6 lg:p-10">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-red-800">Delete Attachment</h3>
          <p className="text-sm text-gray-700 mb-6">Are you sure you want to delete {confirmDeleteName}? This action cannot be undone.</p>
          <div className="mt-2 flex justify-end gap-3">
            <Button size="sm" variant="outline" className="rounded-full text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50" onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
            <Button size="sm" variant="outline" className="rounded-full text-red-700 ring-1 ring-inset ring-red-300 hover:bg-red-50" onClick={async () => {
              const id = confirmDeleteId;
              if (id) {
                await deleteAttachment(id);
              }
              setConfirmDeleteOpen(false);
            }}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}