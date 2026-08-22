import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "gd-website";
import { Copy, MoreHorizontal, Pencil, Share2, Trash2 } from "lucide-react";

export function Closed() {
  return (
    <div className="bg-background flex items-center gap-3 p-10">
      <code className="font-mono text-[12.5px] text-black/80">
        STRIPE_SECRET_KEY
      </code>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Actions for STRIPE_SECRET_KEY"
          className="grid size-8 place-items-center rounded-lg text-black/35 transition duration-150 hover:bg-black/[0.05] hover:text-black"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            <Copy />
            Copy value
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function Open() {
  return (
    <div className="bg-background flex items-center gap-3 p-10">
      <code className="font-mono text-[12.5px] text-black/80">
        STRIPE_SECRET_KEY
      </code>
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger
          aria-label="Actions for STRIPE_SECRET_KEY"
          className="grid size-8 place-items-center rounded-lg text-black/35 transition duration-150 hover:bg-black/[0.05] hover:text-black"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            <Copy />
            Copy value
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Share2 />
            Share
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Pencil />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
