"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireClientViewer } from "@/data/portal";
import {
  type SimpleFormState,
  formError,
  formSuccess,
} from "@/lib/projects/form-state";
import { isUuid } from "@/lib/projects/validation";

function refresh(publicId: string) {
  revalidatePath(`/portal/${publicId}`);
}

export async function setItemDone(
  publicId: string,
  cardId: string,
  done: boolean,
): Promise<SimpleFormState> {
  await requireClientViewer();
  if (!isUuid(cardId)) return formError("That item could not be found.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_client_set_item_done", {
    target_card_id: cardId,
    done,
  });

  if (error) return formError("That could not be saved.");

  refresh(publicId);
  return formSuccess(done ? "Marked done." : "Marked not done.");
}

export async function saveWeekIdeas(
  publicId: string,
  weekId: string,
  doc: string,
): Promise<SimpleFormState> {
  await requireClientViewer();
  if (!isUuid(weekId)) return formError("That week could not be found.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(doc);
  } catch {
    return formError("Those notes could not be read.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_client_save_week_idea", {
    target_week_id: weekId,
    new_doc: parsed,
  });

  if (error) return formError("Those notes could not be saved.");

  refresh(publicId);
  return formSuccess("Saved.");
}
