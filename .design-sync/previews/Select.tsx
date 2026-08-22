import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "gd-website";

export function Closed() {
  return (
    <div className="bg-background p-10">
      <Select defaultValue="building">
        <SelectTrigger className="w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="discovery">Discovery</SelectItem>
          <SelectItem value="building">Building</SelectItem>
          <SelectItem value="review">In review</SelectItem>
          <SelectItem value="live">Live</SelectItem>
          <SelectItem value="retainer">Retainer</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function Open() {
  return (
    <div className="bg-background p-10">
      <Select defaultValue="review" defaultOpen>
        <SelectTrigger className="w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="discovery">Discovery</SelectItem>
          <SelectItem value="building">Building</SelectItem>
          <SelectItem value="review">In review</SelectItem>
          <SelectItem value="live">Live</SelectItem>
          <SelectItem value="retainer">Retainer</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function Small() {
  return (
    <div className="bg-background p-10">
      <Select defaultValue="usd">
        <SelectTrigger size="sm" className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="usd">USD</SelectItem>
          <SelectItem value="pkr">PKR</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
