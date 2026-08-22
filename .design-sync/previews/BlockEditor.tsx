import { BlockEditor } from "gd-website";

const credentials = [
  { id: "cred-1", name: "STRIPE_SECRET_KEY" },
  { id: "cred-2", name: "TWILIO_AUTH_TOKEN" },
];

const upload = async () => ({
  status: "success" as const,
  message: null,
  path: "projects/northwind/dispatch-flow.png",
  name: "dispatch-flow.png",
  size: 84213,
});

const noop = () => {};

export function MixedBlocks() {
  return (
    <div className="max-w-xl p-6">
      <BlockEditor
        blocks={[
          { type: "heading", level: 2, text: "Dispatch agent — week 3" },
          {
            type: "text",
            text: "Reads inbound carrier email and drafts a booking before a human confirms it.",
          },
          {
            type: "bullet",
            items: [
              "Parse inbound email for load details",
              "Match against open lanes",
              "Draft the booking for review",
            ],
          },
          {
            type: "callout",
            tone: "key",
            text: "Human confirmation is required before any booking goes out.",
          },
        ]}
        onChange={noop}
        credentials={credentials}
        upload={upload}
        signedUrls={{}}
      />
    </div>
  );
}

export function WithCredentialAndImage() {
  return (
    <div className="max-w-xl p-6">
      <BlockEditor
        blocks={[
          {
            type: "credential",
            credentialId: "cred-1",
            name: "STRIPE_SECRET_KEY",
          },
          { type: "image", path: "projects/northwind/dispatch-flow.png", alt: "" },
          { type: "divider" },
        ]}
        onChange={noop}
        credentials={credentials}
        upload={upload}
        signedUrls={{}}
      />
    </div>
  );
}

export function Empty() {
  return (
    <div className="max-w-xl p-6">
      <BlockEditor
        blocks={[]}
        onChange={noop}
        credentials={credentials}
        upload={upload}
        signedUrls={{}}
        allowedTypes={["callout", "image", "file", "credential"]}
        addLabel="Add a callout, image, file or credential"
      />
    </div>
  );
}
