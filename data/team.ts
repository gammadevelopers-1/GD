import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/data/auth";
import type { EmploymentType, TeamRole } from "@/lib/team/records";

export type TeamAccountState = "active" | "invited" | "created" | "archived";

export type TeamMember = {
  id: string;
  fullName: string;
  email: string | null;
  role: TeamRole;
  jobTitle: string | null;
  phone: string | null;
  isActive: boolean;
  archivedAt: string | null;
  invitedAt: string | null;
  activatedAt: string | null;
  createdAt: string;
  projectCount: number;
  state: TeamAccountState;
};

export type TeamEmployment = {
  employmentType: EmploymentType | null;
  startDate: string | null;
  salaryAmount: number | null;
  salaryCurrency: string;
  cnic: string | null;
  bankAccountTitle: string | null;
  bankAccountNumber: string | null;
  bankName: string | null;
};

export type TeamDocument = {
  id: string;
  documentType: string;
  fileName: string;
  storagePath: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
  url: string | null;
};

export type TeamPerson = TeamMember & {
  employment: TeamEmployment;
  documents: TeamDocument[];
  projects: Array<{ id: string; name: string; responsibility: string | null }>;
  deleteBlocker: string | null;
};

const DOCUMENTS_BUCKET = "app-private-documents";

function accountState(row: {
  archived_at: unknown;
  is_active: unknown;
  activated_at: unknown;
  invited_at: unknown;
}): TeamAccountState {
  if (row.archived_at || !row.is_active) return "archived";
  if (row.activated_at) return "active";
  if (row.invited_at) return "invited";
  return "created";
}

function toMember(
  row: Record<string, unknown>,
  projectCount: number,
): TeamMember {
  return {
    id: String(row.id),
    fullName: String(row.full_name),
    email: row.email ? String(row.email) : null,
    role: String(row.role) as TeamRole,
    jobTitle: row.job_title ? String(row.job_title) : null,
    phone: row.phone ? String(row.phone) : null,
    isActive: Boolean(row.is_active),
    archivedAt: row.archived_at ? String(row.archived_at) : null,
    invitedAt: row.invited_at ? String(row.invited_at) : null,
    activatedAt: row.activated_at ? String(row.activated_at) : null,
    createdAt: String(row.created_at),
    projectCount,
    state: accountState(
      row as {
        archived_at: unknown;
        is_active: unknown;
        activated_at: unknown;
        invited_at: unknown;
      },
    ),
  };
}

export const getTeamDirectory = cache(
  async (viewer: Viewer): Promise<TeamMember[]> => {
    if (viewer.role !== "owner") return [];

    const supabase = await createClient();
    const [profilesResult, membershipResult] = await Promise.all([
      supabase
        .from("app_profiles")
        .select(
          "id, full_name, email, role, job_title, phone, is_active, archived_at, invited_at, activated_at, created_at",
        )
        .order("full_name"),
      supabase
        .from("app_project_members")
        .select("profile_id, project_id")
        .is("archived_at", null),
    ]);

    const counts = new Map<string, number>();
    for (const row of membershipResult.data ?? []) {
      const key = String(row.profile_id);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return (profilesResult.data ?? []).map((row) =>
      toMember(row, counts.get(String(row.id)) ?? 0),
    );
  },
);

export const getTeamPerson = cache(
  async (profileId: string, viewer: Viewer): Promise<TeamPerson | null> => {
    if (viewer.role !== "owner") return null;

    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("app_profiles")
      .select(
        "id, full_name, email, role, job_title, phone, is_active, archived_at, invited_at, activated_at, created_at",
      )
      .eq("id", profileId)
      .maybeSingle();

    if (!profile) return null;

    const [employmentResult, documentsResult, membershipResult, blockerResult] =
      await Promise.all([
        supabase
          .from("app_employment_private")
          .select(
            "employment_type, start_date, salary_amount, salary_currency, cnic, bank_account_title, bank_account_number, bank_name",
          )
          .eq("profile_id", profileId)
          .maybeSingle(),
        supabase
          .from("app_documents")
          .select(
            "id, document_type, file_name, storage_path, mime_type, size_bytes, created_at",
          )
          .eq("profile_id", profileId)
          .is("archived_at", null)
          .order("created_at", { ascending: false }),
        supabase
          .from("app_project_members")
          .select("project_id, responsibility, app_projects(id, name)")
          .eq("profile_id", profileId)
          .is("archived_at", null),
        supabase.rpc("app_team_member_deletable", { target: profileId }),
      ]);

    const documentRows = documentsResult.data ?? [];
    const signed = new Map<string, string>();

    if (documentRows.length) {
      const { data } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .createSignedUrls(
          documentRows.map((row) => String(row.storage_path)),
          60 * 10,
        );
      for (const entry of data ?? []) {
        if (entry.path && entry.signedUrl) signed.set(entry.path, entry.signedUrl);
      }
    }

    const employment = employmentResult.data;

    return {
      ...toMember(profile, (membershipResult.data ?? []).length),
      employment: {
        employmentType: employment?.employment_type
          ? (String(employment.employment_type) as EmploymentType)
          : null,
        startDate: employment?.start_date ? String(employment.start_date) : null,
        salaryAmount:
          employment?.salary_amount === null ||
          employment?.salary_amount === undefined
            ? null
            : Number(employment.salary_amount),
        salaryCurrency: String(employment?.salary_currency ?? "PKR"),
        cnic: employment?.cnic ? String(employment.cnic) : null,
        bankAccountTitle: employment?.bank_account_title
          ? String(employment.bank_account_title)
          : null,
        bankAccountNumber: employment?.bank_account_number
          ? String(employment.bank_account_number)
          : null,
        bankName: employment?.bank_name ? String(employment.bank_name) : null,
      },
      documents: documentRows.map((row) => ({
        id: String(row.id),
        documentType: String(row.document_type),
        fileName: String(row.file_name),
        storagePath: String(row.storage_path),
        mimeType: row.mime_type ? String(row.mime_type) : null,
        sizeBytes:
          row.size_bytes === null || row.size_bytes === undefined
            ? null
            : Number(row.size_bytes),
        createdAt: String(row.created_at),
        url: signed.get(String(row.storage_path)) ?? null,
      })),
      deleteBlocker: blockerResult.data
        ? String(blockerResult.data)
        : blockerResult.error
          ? "that could not be checked"
          : null,
      projects: (membershipResult.data ?? []).flatMap((row) => {
        const project = row.app_projects as unknown as {
          id: string;
          name: string;
        } | null;
        if (!project) return [];
        return [
          {
            id: String(project.id),
            name: String(project.name),
            responsibility: row.responsibility
              ? String(row.responsibility)
              : null,
          },
        ];
      }),
    };
  },
);
