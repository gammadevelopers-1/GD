import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "gd-website";

export function Default() {
  return (
    <div className="max-w-md p-6">
      <Card>
        <CardHeader>
          <CardTitle>Northwind Logistics</CardTitle>
          <CardDescription>
            Dispatch agent that reads inbound email and books carriers.
          </CardDescription>
          <CardAction>
            <Badge>Live</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-[13px] leading-6">
            Week 6 of 8. Two milestones remain before handover, both scheduled
            inside the retainer window.
          </p>
        </CardContent>
        <CardFooter className="gap-2">
          <Button size="sm">Open workspace</Button>
          <Button size="sm" variant="ghost">
            Share with client
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export function Metric() {
  return (
    <div className="grid max-w-2xl grid-cols-2 gap-4 p-6">
      <Card>
        <CardHeader>
          <CardDescription className="font-mono text-[9px] tracking-[0.16em] uppercase">
            Active projects
          </CardDescription>
          <CardTitle className="font-display text-[2rem] leading-none tracking-[-0.05em] tabular-nums">
            12
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription className="font-mono text-[9px] tracking-[0.16em] uppercase">
            Shipped this quarter
          </CardDescription>
          <CardTitle className="font-display text-[2rem] leading-none tracking-[-0.05em] tabular-nums">
            7
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
