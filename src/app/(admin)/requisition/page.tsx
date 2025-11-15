import RequisitionForm from "@/components/requisition/RequisitionForm";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Requisition | Contract Management",
  description: "Create and submit a requisition",
};

export default function RequisitionPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Requisition" />
      <RequisitionForm />
    </div>
  );
}