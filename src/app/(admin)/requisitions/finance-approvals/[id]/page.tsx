"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import Image from "next/image";
import { Modal } from "@/components/ui/modal";
const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9090";

type Approval = {
  id: number;
  requisitionId?: number;
  requisition?: { id?: number } | null;
  approvalTo?: string;
  approvalDate?: string;
  approvalReference?: string;
  approvalSubject?: string;
  legalSignature?: string;
  legalSignatureDate?: string;
  legalComments?: string;
  technicalSignature?: string;
  technicalSignatureDate?: string;
  technicalComments?: string;
  financialSignature?: string;
  financialSignatureDate?: string;
  financialComments?: string;
  commercialSignature?: string;
  commercialSignatureDate?: string;
  commercialComments?: string;
  businessDevelopmentSignature?: string;
  businessDevelopmentSignatureDate?: string;
  businessDevelopmentComments?: string;
  procurementSignature?: string;
  procurementSignatureDate?: string;
  procurementComments?: string;
  approvalStatus?: string;
};

export default function FinanceApprovalViewPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

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

  const currentDateStandard = new Date().toISOString().split("T")[0];
  const formatDisplayDate = (dateString?: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    const month = d.toLocaleString("en-US", { month: "long" });
    const day = d.getDate();
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };
  const currentDateDisplay = formatDisplayDate(new Date().toISOString());

  const [item, setItem] = useState<Approval | null>(null);
  const [formData, setFormData] = useState({
    financialSignature: "APPROVE",
    financialSignatureDate: currentDateStandard,
    financialComments: "",
    decision: "APPROVE" as "APPROVE" | "REJECT",
  });
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState<string | null>(null);
  const [signaturePath, setSignaturePath] = useState<string | null>(null);
  const [legalPreviewUrl, setLegalPreviewUrl] = useState<string | null>(null);
  const [technicalPreviewUrl, setTechnicalPreviewUrl] = useState<string | null>(null);
  const [commercialPreviewUrl, setCommercialPreviewUrl] = useState<string | null>(null);
  const [bdPreviewUrl, setBdPreviewUrl] = useState<string | null>(null);
  const [procPreviewUrl, setProcPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/approvals/${id}`, { headers: authHeaders() });
        if (!res.ok) throw new Error(await res.text());
        const data: Approval = await res.json();
        setItem(data || null);
      } catch (e: unknown) {
        setMessage({ type: "error", text: e instanceof Error ? e.message : "Error loading" });
      }
    };
    load();
  }, [id, authHeaders]);

  useEffect(() => {
    const load = async (value: string | undefined | null, setUrl: (v: string | null) => void) => {
      try {
        const v = String(value || "").trim();
        if (!v) return;
        const match = v.match(/\/file\/([0-9]+)/);
        const sigId = match?.[1];
        if (!sigId) return;
        const imgRes = await fetch(`/api/signature/file/${encodeURIComponent(sigId)}`, { headers: authHeaders() });
        if (!imgRes.ok) return;
        const blob = await imgRes.blob();
        const url = URL.createObjectURL(blob);
        setUrl(url);
      } catch {}
    };
    load(item?.legalSignature, setLegalPreviewUrl);
    load(item?.technicalSignature, setTechnicalPreviewUrl);
    load(item?.commercialSignature, setCommercialPreviewUrl);
    load(item?.businessDevelopmentSignature, setBdPreviewUrl);
    load(item?.procurementSignature, setProcPreviewUrl);
  }, [item, authHeaders]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target as { name: string; value: string };
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setConfirmOpen(true);
  };

  const getEmail = () => {
    if (typeof window === "undefined") return "";
    return (localStorage.getItem("email") || sessionStorage.getItem("email") || "").trim();
  };

  const signFinance = async () => {
    try {
      setMessage(null);
      const email = getEmail();
      if (!email) throw new Error("Missing user email");
      const pathRes = await fetch(`/api/signature/user/email?email=${encodeURIComponent(email)}`, { headers: authHeaders() });
      if (!pathRes.ok) throw new Error(await pathRes.text());
      const pathText = await pathRes.text();
      const path = String(pathText || "").trim();
      if (!path) throw new Error("Signature path not found");
      setSignaturePath(path);
      const match = path.match(/\/file\/([0-9]+)/);
      const sigId = match?.[1];
      if (!sigId) throw new Error("Invalid signature path");
      const imgRes = await fetch(`/api/signature/file/${encodeURIComponent(sigId)}`, { headers: authHeaders() });
      if (!imgRes.ok) throw new Error(await imgRes.text());
      const blob = await imgRes.blob();
      const url = URL.createObjectURL(blob);
      setSignaturePreviewUrl(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage({ type: "error", text: `Failed to load signature: ${msg}` });
    }
  };

  const confirmSubmit = async () => {
    setMessage(null);
    setConfirmError(null);
    setConfirmSubmitting(true);
    try {
      const status = formData.decision === "APPROVE" ? "FINANCIAL_APPROVED" : "FINANCIAL_REJECTED";
      const updateBody: Record<string, unknown> = {
        financialSignatureDate: currentDateStandard,
        financialComments: formData.financialComments,
        approvalStatus: status,
      };
      if (signaturePath) updateBody.financialSignature = signaturePath;
      const res = await fetch(`${BASE_URL}/api/v1/approvals/update/${id}`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(updateBody),
      });
      if (!res.ok) throw new Error(await res.text());
      setConfirmOpen(false);
      setMessage({ type: "success", text: "Decision submitted successfully" });
      router.push("/requisitions/finance-approvals");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setConfirmError(msg);
    } finally {
      setConfirmSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-8 bg-white border-2 border-black shadow-lg rounded-sm p-10 text-gray-900">
      <div className="border border-black rounded-sm overflow-hidden mb-8">
        <div className="flex justify-end pr-4 pt-4">
          <Image src="/images/powertel.png" alt="PowerTel Logo" width={140} height={60} />
        </div>
        <div className="bg-blue-200 border-t border-b border-black py-3 text-center">
          <h1 className="text-lg font-bold underline text-black uppercase">Contract Approval Form</h1>
        </div>
        <div className="p-6 text-sm text-black space-y-3">
          <div className="flex items-center gap-4">
            <span className="font-semibold w-20">TO:</span>
            <div className="flex-1 mr-2">
              <Input readOnly value={item?.approvalTo || ""} className="border border-gray-400 text-gray-500 bg-gray-200" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-semibold w-20">Date:</span>
            <span className="flex-1 mr-2 border border-gray-400 text-black bg-white p-2">{currentDateDisplay}</span>
          </div>
          <div className="flex items-start gap-4">
            <span className="font-semibold w-20">RE:</span>
            <div className="flex-1 mr-2">
              <TextArea readOnly value={item?.approvalReference || item?.approvalSubject || ""} className="border border-gray-400 text-gray-500 bg-gray-200" rows={4} />
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-black">
        <div className="border border-black p-4">
          <h2 className="font-semibold mb-3 text-black">1. Legal Department</h2>
          <div className="grid grid-cols-2 gap-4">
            {legalPreviewUrl ? (
              <div className="border border-gray-400 bg-white p-2 h-12 w-full relative rounded-md">
                <Image src={legalPreviewUrl} alt="Legal Signature" fill sizes="100%" className="object-contain" />
              </div>
            ) : (
              <Input readOnly value={String(item?.legalSignature || "").startsWith("/") ? "" : (item?.legalSignature || "")} className="border border-gray-400 text-gray-500 bg-gray-200" />
            )}
            <span className="border border-gray-400 text-gray-500 bg-gray-200 p-2">{formatDisplayDate(item?.legalSignatureDate)}</span>
          </div>
          <TextArea readOnly value={item?.legalComments || ""} className="mt-3 border border-gray-400 text-gray-500 bg-gray-200" />
        </div>

        <div className="border border-black p-4">
          <h2 className="font-semibold mb-3 text-black">2. Technical Department</h2>
          <div className="grid grid-cols-2 gap-4">
            {technicalPreviewUrl ? (
              <div className="border border-gray-400 bg-white p-2 h-12 w-full relative rounded-md">
                <Image src={technicalPreviewUrl} alt="Technical Signature" fill sizes="100%" className="object-contain" />
              </div>
            ) : (
              <Input readOnly value={String(item?.technicalSignature || "").startsWith("/") ? "" : (item?.technicalSignature || "")} className="border border-gray-400 text-gray-500 bg-gray-200" />
            )}
            <span className="border border-gray-400 text-gray-500 bg-gray-200 p-2">{formatDisplayDate(item?.technicalSignatureDate)}</span>
          </div>
          <TextArea readOnly value={item?.technicalComments || ""} className="mt-3 border border-gray-400 text-gray-500 bg-gray-200" />
        </div>

        <div className="border border-black p-4">
          <h2 className="font-semibold mb-3 text-black">3. Financial Department</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              {signaturePreviewUrl ? (
                <div className="border border-gray-400 bg-white p-2 h-12 w-full relative rounded-md">
                  <Image src={signaturePreviewUrl} alt="Signature" fill sizes="100%" className="object-contain" />
                </div>
              ) : (
                <Button size="sm" className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md" onClick={signFinance}>Sign</Button>
              )}
              <select name="decision" value={formData.decision} onChange={handleChange} className="border border-gray-400 text-black bg-white rounded-md">
                <option value="APPROVE">APPROVE</option>
                <option value="REJECT">REJECT</option>
              </select>
            </div>
            <span className="border border-gray-400 text-black bg-white p-2 rounded-md">{currentDateDisplay}</span>
          </div>
          <TextArea name="financialComments" value={formData.financialComments} onChange={handleChange} placeholder="Financial Department Comments" className="mt-3 border border-gray-400 text-black bg-white rounded-md" />
        </div>

        <div className="border border-black p-4">
          <h2 className="font-semibold mb-3 text-black">4. Commercial Department</h2>
          <div className="grid grid-cols-2 gap-4">
            {commercialPreviewUrl ? (
              <div className="border border-gray-400 bg-white p-2 h-12 w-full relative rounded-md">
                <Image src={commercialPreviewUrl} alt="Commercial Signature" fill sizes="100%" className="object-contain" />
              </div>
            ) : (
              <Input readOnly value={String(item?.commercialSignature || "").startsWith("/") ? "" : (item?.commercialSignature || "")} className="border border-gray-400 text-gray-500 bg-gray-200" />
            )}
            <span className="border border-gray-400 text-gray-500 bg-gray-200 p-2">{formatDisplayDate(item?.commercialSignatureDate)}</span>
          </div>
          <TextArea readOnly value={item?.commercialComments || ""} className="mt-3 border border-gray-400 text-gray-500 bg-gray-200" />
        </div>

        <div className="border border-black p-4">
          <h2 className="font-semibold mb-3 text-black">5. Business Development</h2>
          <div className="grid grid-cols-2 gap-4">
            {bdPreviewUrl ? (
              <div className="border border-gray-400 bg-white p-2 h-12 w-full relative rounded-md">
                <Image src={bdPreviewUrl} alt="Business Development Signature" fill sizes="100%" className="object-contain" />
              </div>
            ) : (
              <Input readOnly value={String(item?.businessDevelopmentSignature || "").startsWith("/") ? "" : (item?.businessDevelopmentSignature || "")} className="border border-gray-400 text-gray-500 bg-gray-200" />
            )}
            <span className="border border-gray-400 text-gray-500 bg-gray-200 p-2">{formatDisplayDate(item?.businessDevelopmentSignatureDate)}</span>
          </div>
          <TextArea readOnly value={item?.businessDevelopmentComments || ""} className="mt-3 border border-gray-400 text-gray-500 bg-gray-200" />
        </div>

        <div className="border border-black p-4">
          <h2 className="font-semibold mb-3 text-black">6. Procurement Department</h2>
          <div className="grid grid-cols-2 gap-4">
            {procPreviewUrl ? (
              <div className="border border-gray-400 bg-white p-2 h-12 w-full relative rounded-md">
                <Image src={procPreviewUrl} alt="Procurement Signature" fill sizes="100%" className="object-contain" />
              </div>
            ) : (
              <Input readOnly value={String(item?.procurementSignature || "").startsWith("/") ? "" : (item?.procurementSignature || "")} className="border border-gray-400 text-gray-500 bg-gray-200" />
            )}
            <span className="border border-gray-400 text-gray-500 bg-gray-200 p-2">{formatDisplayDate(item?.procurementSignatureDate)}</span>
          </div>
          <TextArea readOnly value={item?.procurementComments || ""} className="mt-3 border border-gray-400 text-gray-500 bg-gray-200" />
        </div>

        {message && (
          <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>{message.text}</p>
        )}

        <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-700 text-white font-semibold mt-6">
          Submit Finance Decision
        </Button>
      </form>

      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} className="max-w-[560px] p-6 lg:p-10">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-sky-800">Confirm Finance Approval</h3>
          <p className="text-sm text-gray-700 mb-4">Decision: {formData.decision === "APPROVE" ? "APPROVE" : "REJECT"}</p>
          <div className="mt-2 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={confirmSubmit} disabled={confirmSubmitting}>{confirmSubmitting ? "Submitting..." : "Confirm"}</Button>
          </div>
          {confirmError && <p className="text-sm text-red-600 mt-3">{confirmError}</p>}
        </div>
      </Modal>
    </div>
  );
}