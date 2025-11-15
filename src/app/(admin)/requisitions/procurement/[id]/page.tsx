"use client";

import React, { useEffect, useState, useCallback } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ProcurementManagerViewForm from "@/components/requisition/ProcurementManagerViewForm";
import { useParams, useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { CheckLineIcon, CloseLineIcon } from "@/icons";

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

export default function ProcurementManagerViewPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id as string | undefined;
  const [item, setItem] = useState<Requisition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<"YES" | "NO" | null>(null);

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
    const load = async () => {
      if (!idParam) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/requisitions/${idParam}`, { headers: authHeaders() });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to load requisition");
        }
        const data = await res.json();
        setItem(data as Requisition);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Error loading requisition");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [idParam, authHeaders]);

  const openConfirm = (decision: "YES" | "NO") => {
    setPendingDecision(decision);
    setConfirmOpen(true);
  };

  const submitDecision = async () => {
    if (!item || !pendingDecision) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const status = pendingDecision === "YES" ? "PROCUREMENTMANAGER_APPROVED" : "PROCUREMENTMANAGER_REJECTED";
      const today = new Date().toISOString().split("T")[0];
      const payload = {
        ...item,
        requisitionStatus: status,
        procurementComplied: pendingDecision,
        procurementManager: pendingDecision === "YES" ? "APPROVED" : "REJECTED",
        procurementDate: today,
      } as Record<string, unknown>;
      const res = await fetch(`/api/requisitions/${item.id}/update`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to submit action");
      }
      setConfirmOpen(false);
      setSuccessOpen(true);
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "Error submitting action");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="View Requisition" />
      {loading ? (
        <div className="p-5">Loading...</div>
      ) : error ? (
        <div className="p-5 text-red-600">{error}</div>
      ) : !item ? (
        <div className="p-5">No requisition found</div>
      ) : (
        <ProcurementManagerViewForm requisition={item} submitting={submitting} error={submitError} onSubmit={openConfirm} onCancel={() => router.push("/requisitions/procurement")} />
      )}

      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} className="max-w-[560px] p-6 lg:p-10">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-sky-800">Confirm Procurement Decision</h3>
          {item && (
            <p className="text-sm text-gray-700 mb-4">Requisition #{item.id}</p>
          )}
          {pendingDecision && (
            <div className="flex items-center gap-2 mb-4 text-black">
              {pendingDecision === "YES" ? (
                <span className="text-emerald-700 flex items-center gap-1"><CheckLineIcon /> Procedures Complied</span>
              ) : (
                <span className="text-red-700 flex items-center gap-1"><CloseLineIcon /> Procedures Not Complied</span>
              )}
            </div>
          )}
          <div className="mt-2 flex justify-end gap-3">
            <button className="rounded-full px-4 py-2 text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50" onClick={() => setConfirmOpen(false)}>Cancel</button>
            <button className="rounded-full px-4 py-2 text-white bg-sky-600 hover:bg-sky-700" onClick={submitDecision}>{submitting ? "Saving..." : "Confirm"}</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={successOpen} onClose={() => setSuccessOpen(false)} className="max-w-[520px] p-6 lg:p-10">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-emerald-800">Decision Saved</h3>
          {item && pendingDecision && (
            <p className="text-sm text-gray-700 mb-4">Requisition #{item.id} set to {pendingDecision === "YES" ? "PROCUREMENTMANAGER_APPROVED" : "PROCUREMENTMANAGER_REJECTED"}</p>
          )}
          <div className="mt-2 flex justify-end gap-3">
            <button className="rounded-full px-4 py-2 text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50" onClick={() => setSuccessOpen(false)}>Close</button>
            <button className="rounded-full px-4 py-2 text-white bg-sky-600 hover:bg-sky-700" onClick={() => router.push("/requisitions/procurement")}>Go to Queue</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}