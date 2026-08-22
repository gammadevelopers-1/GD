import { Tabs, TabsList, TabsTrigger, TabsContent } from "gd-website";

export function DefaultVariant() {
  return (
    <div className="max-w-md p-6">
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="weeks">Weeks</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4 text-[13px] text-black/65">
          Northwind Logistics is in week 6 of the dispatch automation build.
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function LineVariant() {
  return (
    <div className="max-w-md p-6">
      <Tabs defaultValue="idea">
        <TabsList variant="line">
          <TabsTrigger value="idea">Idea board</TabsTrigger>
          <TabsTrigger value="work">Work board</TabsTrigger>
          <TabsTrigger value="carry">Carried over</TabsTrigger>
        </TabsList>
        <TabsContent value="idea" className="mt-4 text-[13px] text-black/65">
          Capture anything worth doing before it becomes a task.
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function DenseAdminTabs() {
  return (
    <div className="max-w-lg p-6">
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="retainer">Retainer</TabsTrigger>
          <TabsTrigger value="paused">Paused</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4 text-[13px] text-black/65">
          4 projects in discovery or building, 2 in review.
        </TabsContent>
      </Tabs>
    </div>
  );
}
