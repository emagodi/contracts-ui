"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { ArrowUpIcon, PencilIcon, TrashBinIcon } from "@/icons";
 

export default function UserInfoCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const updateSignatureModal = useModal();
  const deleteSignatureModal = useModal();
  const formRef = useRef<HTMLFormElement | null>(null);
  type User = { firstname?: string; lastname?: string; email?: string; phone?: string; role?: string; roles?: unknown[]; authorities?: unknown[] };
  const [user, setUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sigUrl, setSigUrl] = useState<string | null>(null);
  const [sigId, setSigId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccessOpen, setDeleteSuccessOpen] = useState(false);
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const updateRef = useRef<HTMLInputElement | null>(null);
  

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

  const getUserId = () => {
    if (typeof window === "undefined") return "";
    return (localStorage.getItem("user_id") || sessionStorage.getItem("user_id") || "").trim();
  };

  const getEmail = () => {
    if (!user?.email && typeof window !== "undefined") {
      return (localStorage.getItem("email") || sessionStorage.getItem("email") || "").trim();
    }
    return String(user?.email || "").trim();
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const id = getUserId();
        if (!id) {
          const fallback: User = {
            firstname: localStorage.getItem("firstname") || sessionStorage.getItem("firstname") || "",
            lastname: localStorage.getItem("lastname") || sessionStorage.getItem("lastname") || "",
            email: localStorage.getItem("email") || sessionStorage.getItem("email") || "",
            phone: localStorage.getItem("phone") || sessionStorage.getItem("phone") || "",
            role: localStorage.getItem("role") || sessionStorage.getItem("role") || "",
            roles: (() => {
              try {
                const r = localStorage.getItem("roles") || sessionStorage.getItem("roles") || "";
                return r ? JSON.parse(r) : [];
              } catch {
                return [];
              }
            })(),
          };
          setUser(fallback);
          return;
        }
        const res = await fetch(`/api/auth/user/id/${encodeURIComponent(id)}`, { headers: authHeaders() });
        if (!res.ok) {
          const fallback: User = {
            firstname: localStorage.getItem("firstname") || sessionStorage.getItem("firstname") || "",
            lastname: localStorage.getItem("lastname") || sessionStorage.getItem("lastname") || "",
            email: localStorage.getItem("email") || sessionStorage.getItem("email") || "",
            phone: localStorage.getItem("phone") || sessionStorage.getItem("phone") || "",
            role: localStorage.getItem("role") || sessionStorage.getItem("role") || "",
            roles: (() => {
              try {
                const r = localStorage.getItem("roles") || sessionStorage.getItem("roles") || "";
                return r ? JSON.parse(r) : [];
              } catch {
                return [];
              }
            })(),
          };
          setUser(fallback);
          return;
        }
        const data = await res.json().catch(() => ({} as User));
        setUser((data || {}) as User);
      } catch {
        const fallback: User = {
          firstname: localStorage.getItem("firstname") || sessionStorage.getItem("firstname") || "",
          lastname: localStorage.getItem("lastname") || sessionStorage.getItem("lastname") || "",
          email: localStorage.getItem("email") || sessionStorage.getItem("email") || "",
          phone: localStorage.getItem("phone") || sessionStorage.getItem("phone") || "",
          role: localStorage.getItem("role") || sessionStorage.getItem("role") || "",
          roles: (() => {
            try {
              const r = localStorage.getItem("roles") || sessionStorage.getItem("roles") || "";
              return r ? JSON.parse(r) : [];
            } catch {
              return [];
            }
          })(),
        };
        setUser(fallback);
      }
    };
    loadUser();
  }, [authHeaders]);

  const loadSignature = useCallback(async () => {
    const email = getEmail();
    if (!email) return;
    const res = await fetch(`/api/signature/user/email?email=${encodeURIComponent(email)}`, { headers: authHeaders() });
    if (!res.ok) {
      setSigUrl(null);
      setSigId(null);
      return;
    }
    const text = await res.text().catch(() => "");
    const m = /\/file\/(\d+)/.exec(String(text || ""));
    const id = m?.[1];
    if (!id) return;
    setSigId(id);
    const img = await fetch(`/api/signature/file/${id}`, { headers: authHeaders() });
    if (!img.ok) return;
    const blob = await img.blob();
    setSigUrl(URL.createObjectURL(blob));
  }, [authHeaders, user]);

  useEffect(() => { loadSignature(); }, [loadSignature]);

  const normalizeRole = (val: unknown): string | null => {
    if (typeof val === "string") {
      const upper = val.toUpperCase();
      return upper.startsWith("ROLE_") ? upper.replace("ROLE_", "") : upper;
    }
    if (val && typeof val === "object") {
      const name = (val as Record<string, unknown>).name;
      if (typeof name === "string") {
        const upper = name.toUpperCase();
        return upper.startsWith("ROLE_") ? upper.replace("ROLE_", "") : upper;
      }
    }
    return null;
  };

  const roleDisplay = useMemo(() => {
    const direct = normalizeRole(user?.role || null);
    if (direct) return direct || null;
    const preferFrom = (list: unknown): string | null => {
      const arr: unknown[] = Array.isArray(list) ? list : [];
      for (const item of arr) {
        let s: string | null = null;
        if (typeof item === "string") s = item;
        else if (item && typeof item === "object") {
          const a = (item as Record<string, unknown>).authority;
          if (typeof a === "string") s = a;
        }
        if (s) {
          const up = s.toUpperCase();
          if (up.startsWith("ROLE_")) return up.replace("ROLE_", "");
        }
      }
      return null;
    };
    const fromAuthorities = preferFrom(user?.authorities || (user as unknown as { authorities?: unknown[] })?.authorities);
    if (fromAuthorities) return fromAuthorities;
    const fromRoles = preferFrom(user?.roles);
    if (fromRoles) return fromRoles;
    const stored = (typeof window !== "undefined" ? (localStorage.getItem("role") || sessionStorage.getItem("role") || "") : "").toString();
    const normalizedStored = stored ? normalizeRole(stored) : null;
    return normalizedStored || "USER";
  }, [user]);

  const onUploadClick = () => uploadRef.current?.click();
  const onUpdateClick = () => updateSignatureModal.openModal();

  const onUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const email = getEmail();
    if (!email) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/signature/upload/${encodeURIComponent(email)}`, { method: "POST", headers: authHeaders(), body: fd });
    if (res.ok) loadSignature();
  };

  const onUpdateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const email = getEmail();
    if (!email) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/signature/update/${encodeURIComponent(email)}`, { method: "PUT", headers: authHeaders(), body: fd });
    if (res.ok) {
      loadSignature();
      updateSignatureModal.closeModal();
    }
  };

  const onDeleteSignature = async () => {
    const id = sigId;
    if (!id) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/signature/${encodeURIComponent(id)}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok && res.status !== 404) {
        const text = await res.text().catch(() => "");
        setDeleteError(text || "Failed to delete");
        return;
      }
      setSigUrl((prev) => {
        if (prev) {
          try { URL.revokeObjectURL(prev); } catch {}
        }
        return null;
      });
      setSigId(null);
      deleteSignatureModal.closeModal();
      setDeleteSuccessOpen(true);
    } finally {
      setDeleting(false);
    }
  };

  

  const handleSave = async (e?: React.FormEvent<HTMLFormElement>) => {
    try {
      setErrorMsg(null);
      if (e) e.preventDefault();
      if (!formRef.current) {
        closeModal();
        return;
      }
      const id = getUserId();
      if (!id) {
        setErrorMsg("Missing user id");
        return;
      }
      const fd = new FormData(formRef.current);
      const payload = {
        firstname: String(fd.get("firstname") || "").trim(),
        lastname: String(fd.get("lastname") || "").trim(),
        email: String(fd.get("email") || "").trim(),
        phone: String(fd.get("phone") || "").trim(),
        role: roleDisplay,
      };
      setSubmitting(true);
      const res = await fetch(`/api/auth/update/id/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setSubmitting(false);
      if (!res.ok) throw new Error(await res.text());
      const updated = (await res.json().catch(() => payload)) as User;
      localStorage.setItem("firstname", String(updated.firstname || payload.firstname));
      localStorage.setItem("lastname", String(updated.lastname || payload.lastname));
      localStorage.setItem("email", String(updated.email || payload.email));
      localStorage.setItem("phone", String(updated.phone || payload.phone));
      localStorage.setItem("role", String(updated.role || payload.role));
      setUser((prev) => ({ ...(prev || {}), ...updated }));
      closeModal();
    } catch (err: unknown) {
      setSubmitting(false);
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Personal Information
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">First Name</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{String(user?.firstname || "")}</p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Last Name</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{String(user?.lastname || "")}</p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Email address</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{String(user?.email || "")}</p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Phone
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{String(user?.phone || "")}</p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Role</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{roleDisplay}</p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Signature</p>
              <div className="flex items-center gap-3">
                {sigUrl ? (
                  <img src={sigUrl} alt="signature" className="h-10 w-auto rounded" />
                ) : (
                  <span className="text-xs text-gray-400">No signature</span>
                )}
                <button onClick={onUploadClick} className="rounded border px-2 py-1 text-xs">
                  <ArrowUpIcon className="w-4 h-4 text-green-600" />
                  <span className="sr-only">Upload</span>
                </button>
                <button onClick={onUpdateClick} className="rounded border px-2 py-1 text-xs">
                  <PencilIcon className="w-4 h-4 text-yellow-500" />
                  <span className="sr-only">Update</span>
                </button>
                <button onClick={() => deleteSignatureModal.openModal()} className="rounded border px-2 py-1 text-xs">
                  <TrashBinIcon className="w-4 h-4 text-red-500" />
                  <span className="sr-only">Delete</span>
                </button>
                <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={onUploadChange} />
                <input ref={updateRef} type="file" accept="image/*" className="hidden" onChange={onUpdateChange} />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={openModal}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
        >
          <svg
            className="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
              fill=""
            />
          </svg>
          Edit
        </button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>
          <form ref={formRef} onSubmit={handleSave} className="flex flex-col">
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div className="mt-7">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Personal Information
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>First Name</Label>
                    <Input name="firstname" type="text" defaultValue={String(user?.firstname || "")} />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Last Name</Label>
                    <Input name="lastname" type="text" defaultValue={String(user?.lastname || "")} />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Email Address</Label>
                    <Input name="email" type="text" defaultValue={String(user?.email || "")} />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Phone</Label>
                    <Input name="phone" type="text" defaultValue={String(user?.phone || "")} />
                  </div>

                  
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" type="submit" disabled={submitting}>
                Save Changes
              </Button>
              {errorMsg && (
                <span className="text-xs text-error-500">{errorMsg}</span>
              )}
            </div>
          </form>
        </div>
      </Modal>

      <Modal isOpen={updateSignatureModal.isOpen} onClose={updateSignatureModal.closeModal} className="max-w-[500px] m-4">
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-10">
            <h4 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">Update Signature</h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Choose a new image to replace your current signature.</p>
          </div>
          <div className="flex items-center justify-end gap-3 px-2">
            <Button size="sm" variant="outline" onClick={updateSignatureModal.closeModal}>Cancel</Button>
            <Button size="sm" onClick={() => updateRef.current?.click()}>Pick Image</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteSignatureModal.isOpen} onClose={deleteSignatureModal.closeModal} className="max-w-[500px] m-4">
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-10">
            <h4 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">Delete Signature</h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">This action will permanently remove your signature image.</p>
          </div>
          <div className="flex items-center justify-end gap-3 px-2">
            <Button size="sm" variant="outline" onClick={deleteSignatureModal.closeModal}>Cancel</Button>
            <Button size="sm" onClick={onDeleteSignature} disabled={deleting}>{deleting ? "Deleting..." : "Delete"}</Button>
          </div>
          {deleteError && <p className="px-2 mt-3 text-sm text-error-500">{deleteError}</p>}
        </div>
      </Modal>

      <Modal isOpen={deleteSuccessOpen} onClose={() => setDeleteSuccessOpen(false)} className="max-w-[500px] m-4">
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-10">
            <h4 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">Signature Deleted</h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Your signature has been removed.</p>
          </div>
          <div className="flex items-center justify-end gap-3 px-2">
            <Button size="sm" variant="outline" onClick={() => setDeleteSuccessOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
