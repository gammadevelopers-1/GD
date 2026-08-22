import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/data/auth";
import type { EmploymentType, TeamRole } from "@/lib/team/records";

export type MyDocument = {
  id: string;
  documentType: string;
  fileName: string;
  createdAt: string;
  url: string | null;
};

export type MyEmployment = {
  employmentType: EmploymentType | null;
  startDate: string | null;
  salaryAmount: number | null;
  salaryCurrency: string;
  cnic: string | null;
  bankAccountTitle: string | null;
  bankAccountNumber: string | null;
  bankName: string | null;
};

export type MyProfile = {
  id: string;
  fullName: string;
  displayName: string | null;
  email: string | null;
  role: TeamRole;
  jobTitle: string | null;
  phone: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  createdAt: string;
  notifyMilestones: boolean;
  notifyWeeklySummary: boolean;
  employment: MyEmployment | null;
  documents: MyDocument[];
  projects: Array<{
    id: string;
    publicId: string;
    name: string;
    responsibility: string | null;
  }>;
};

const DOCUMENTS_BUCKET = "app-private-documents";
const AVATARS_BUCKET = "app-avatars";
const BANNERS_BUCKET = "app-banners";


async function signPicture(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bucket: string,
  path: unknown,
): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage
    .from(bucket)
    .createSignedUrl(String(path), 60 * 60);
  return data?.signedUrl ?? null;
}

export const getMyProfile = cache(
  async (viewer: Viewer): Promise<MyProfile | null> => {
    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("app_profiles")
      .select(
        "id, full_name, display_name, email, role, job_title, phone, avatar_path, banner_path, created_at, notify_milestones, notify_weekly_summary",
      )
      .eq("id", viewer.id)
      .maybeSingle();

    if (!profile) return null;

    const [employmentResult, documentsResult, membershipResult] =
      await Promise.all([
        supabase
          .from("app_employment_private")
          .select(
            "employment_type, start_date, salary_amount, salary_currency, cnic, bank_account_title, bank_account_number, bank_name",
          )
          .eq("profile_id", viewer.id)
          .maybeSingle(),
        supabase
          .from("app_documents")
          .select("id, document_type, file_name, storage_path, created_at")
          .eq("profile_id", viewer.id)
          .is("archived_at", null)
          .order("created_at", { ascending: false }),
        supabase
          .from("app_project_members")
          .select("responsibility, app_projects(id, public_id, name)")
          .eq("profile_id", viewer.id)
          .is("archived_at", null),
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
        if (entry.path && entry.signedUrl)
          signed.set(entry.path, entry.signedUrl);
      }
    }

    const [avatarUrl, bannerUrl] = await Promise.all([
      signPicture(supabase, AVATARS_BUCKET, profile.avatar_path),
      signPicture(supabase, BANNERS_BUCKET, profile.banner_path),
    ]);

    const employment = employmentResult.data;

    return {
      id: String(profile.id),
      fullName: String(profile.full_name),
      displayName: profile.display_name ? String(profile.display_name) : null,
      email: profile.email ? String(profile.email) : null,
      role: String(profile.role) as TeamRole,
      jobTitle: profile.job_title ? String(profile.job_title) : null,
      phone: profile.phone ? String(profile.phone) : null,
      avatarUrl,
      bannerUrl,
      createdAt: String(profile.created_at),
      notifyMilestones: profile.notify_milestones !== false,
      notifyWeeklySummary: profile.notify_weekly_summary !== false,
      employment: employment
        ? {
            employmentType: employment.employment_type
              ? (String(employment.employment_type) as EmploymentType)
              : null,
            startDate: employment.start_date
              ? String(employment.start_date)
              : null,
            salaryAmount:
              employment.salary_amount === null ||
              employment.salary_amount === undefined
                ? null
                : Number(employment.salary_amount),
            salaryCurrency: String(employment.salary_currency ?? "PKR"),
            cnic: employment.cnic ? String(employment.cnic) : null,
            bankAccountTitle: employment.bank_account_title
              ? String(employment.bank_account_title)
              : null,
            bankAccountNumber: employment.bank_account_number
              ? String(employment.bank_account_number)
              : null,
            bankName: employment.bank_name
              ? String(employment.bank_name)
              : null,
          }
        : null,
      documents: documentRows.map((row) => ({
        id: String(row.id),
        documentType: String(row.document_type),
        fileName: String(row.file_name),
        createdAt: String(row.created_at),
        url: signed.get(String(row.storage_path)) ?? null,
      })),
      projects: (membershipResult.data ?? []).flatMap((row) => {
        const project = row.app_projects as unknown as {
          id: string;
          public_id: string;
          name: string;
        } | null;
        if (!project) return [];
        return [
          {
            id: String(project.id),
            publicId: String(project.public_id),
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
