import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
} from "gd-website";

export function ConfirmDialog() {
  return (
    <Dialog defaultOpen>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revoke access</DialogTitle>
          <DialogDescription>
            Revoke access for Marcus Elliot? He loses this project on his next
            request.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button variant="destructive">Revoke</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FormDialog() {
  return (
    <Dialog defaultOpen>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a client</DialogTitle>
          <DialogDescription>
            Create the company record before issuing portal access.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-[12px] text-black/55">Company name</span>
            <input
              defaultValue="Harbor Freight Co"
              className="w-full rounded-xl border border-black/[0.09] bg-white px-3 py-2 text-sm outline-none"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[12px] text-black/55">Website</span>
            <input
              defaultValue="https://harborfreightco.com"
              className="w-full rounded-xl border border-black/[0.09] bg-white px-3 py-2 text-sm outline-none"
            />
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Add client</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
