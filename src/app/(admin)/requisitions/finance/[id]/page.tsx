"use client";

import React, { useEffect, useState, useCallback } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import FinanceDirectorViewForm from "@/components/requisition/FinanceDirectorViewForm";
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

export default function FinanceDirectorViewPage() {
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
  const [pendingFunding, setPendingFunding] = useState<"YES" | "NO" | null>(null);

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

  const openConfirm = (funding: "YES" | "NO") => {
    setPendingFunding(funding);
    setConfirmOpen(true);
  };

  const submitFunding = async () => {
    if (!item || !pendingFunding) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const status = pendingFunding === "YES" ? "FINANCEDIRECTOR_APPROVED" : "FINANCEDIRECTOR_REJECTED";
      const today = new Date().toISOString().split("T")[0];
      const payload = {
        ...item,
        fundingAvailable: pendingFunding,
        requisitionStatus: status,
        financeDirector: pendingFunding === "YES" ? "APPROVED" : "REJECTED",
        financeDate: today,
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
        <FinanceDirectorViewForm requisition={item} submitting={submitting} error={submitError} onSubmit={openConfirm} onCancel={() => router.push("/requisitions/finance")} />
      )}

      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} className="max-w-[560px] p-6 lg:p-10">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-sky-800">Confirm Finance Decision</h3>
          {item && (
            <p className="text-sm text-gray-700 mb-4">Requisition #{item.id}</p>
          )}
          {pendingFunding && (
            <div className="flex items-center gap-2 mb-4 text-black">
              {pendingFunding === "YES" ? (
                <span className="text-emerald-700 flex items-center gap-1"><CheckLineIcon /> Funding Available</span>
              ) : (
                <span className="text-red-700 flex items-center gap-1"><CloseLineIcon /> Funding Not Available</span>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-6 text-sm text-black mb-4">
            <div>
              <div className="border border-gray-300 rounded px-3 py-2 bg-gray-50">{pendingFunding === "YES" ? "APPROVED" : "REJECTED"}</div>
              <div className="mt-1 text-gray-600">Finance Director</div>
            </div>
            <div>
              <div className="border border-gray-300 rounded px-3 py-2 bg-gray-50">{new Date().toISOString().split("T")[0]}</div>
              <div className="mt-1 text-gray-600">Finance Date</div>
            </div>
          </div>
          {submitError && <p className="text-red-600 mb-3 text-sm">{submitError}</p>}
          <div className="mt-2 flex justify-end gap-3">
            <button className="rounded-full px-4 py-2 text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50" onClick={() => setConfirmOpen(false)}>Cancel</button>
            <button className="rounded-full px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700" onClick={submitFunding} disabled={submitting}>{submitting ? "Submitting..." : "Submit"}</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={successOpen} onClose={() => setSuccessOpen(false)} className="max-w-[520px] p-6 lg:p-10">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-emerald-800">Decision Saved</h3>
          {item && pendingFunding && (
            <p className="text-sm text-gray-700 mb-4">Requisition #{item.id} set to {pendingFunding === "YES" ? "FINANCEDIRECTOR_APPROVED" : "FINANCEDIRECTOR_REJECTED"}</p>
          )}
          <div className="mt-2 flex justify-end gap-3">
            <button className="rounded-full px-4 py-2 text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50" onClick={() => setSuccessOpen(false)}>Close</button>
            <button className="rounded-full px-4 py-2 text-white bg-sky-600 hover:bg-sky-700" onClick={() => router.push("/requisitions/finance")}>Go to Queue</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}