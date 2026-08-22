import { MemberFields } from "gd-website";

export function NewMember() {
  return (
    <div className="bg-background max-w-2xl p-6">
      <MemberFields defaults={{}} errors={{}} />
    </div>
  );
}

export function EditWithErrors() {
  return (
    <div className="bg-background max-w-2xl p-6">
      <MemberFields
        defaults={{
          fullName: "Rehan Malik",
          email: "rehan@gammadevelopers.ai",
          jobTitle: "Delivery engineer",
          phone: "",
          role: "member",
          employmentType: "employee",
          startDate: "2025-03-10",
          salaryAmount: "",
          cnic: "",
          bankAccountTitle: "",
          bankName: "",
          bankAccountNumber: "",
        }}
        errors={{
          phone: "Enter a valid phone number.",
          salaryAmount: "Enter a number, not text.",
        }}
      />
    </div>
  );
}

export function LockedEmail() {
  return (
    <div className="bg-background max-w-2xl p-6">
      <MemberFields
        defaults={{
          fullName: "Sana Iqbal",
          email: "sana@gammadevelopers.ai",
          jobTitle: "Finance lead",
          role: "finance",
        }}
        errors={{}}
        lockEmail
      />
    </div>
  );
}
