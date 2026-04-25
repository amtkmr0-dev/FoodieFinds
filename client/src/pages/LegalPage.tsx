import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChevronLeft, Shield } from "lucide-react";
import { useLocation, useParams } from "wouter";

const legalPages = {
  terms: {
    title: "Terms and Conditions",
    updated: "Last updated: April 2026",
    sections: [
      {
        heading: "Platform Use",
        body: "LINKY provides a social calling and creator discovery experience. By using the app, users agree to use the service responsibly, follow platform rules, and avoid misuse, harassment, impersonation, or unlawful activity.",
      },
      {
        heading: "Accounts and Verification",
        body: "Users may be asked to verify a mobile number or device before using certain features. Account information should be accurate and kept up to date.",
      },
      {
        heading: "Payments and Wallet",
        body: "Wallet balances, recharge packs, bonuses, call charges, and payment methods are shown before transactions where applicable. Users should review all details before confirming a recharge or call.",
      },
    ],
  },
  "terms-of-use": {
    title: "Terms of Use",
    updated: "Last updated: April 2026",
    sections: [
      {
        heading: "Acceptable Use",
        body: "Users must not abuse calls, messages, creator tools, reporting systems, payments, or any app feature. Automated scraping, spam, fraud, and attempts to bypass controls are not permitted.",
      },
      {
        heading: "User Responsibility",
        body: "Users are responsible for the activity on their account and for complying with applicable laws while using LINKY.",
      },
      {
        heading: "Service Changes",
        body: "Features, pricing, availability, and policies may be updated as the product evolves. Important changes should be reflected inside the app or related notices.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    updated: "Last updated: April 2026",
    sections: [
      {
        heading: "Information We Collect",
        body: "The app may collect account details, mobile number, device identifiers, wallet activity, call metadata, creator interactions, and support requests needed to operate the service.",
      },
      {
        heading: "How Information Is Used",
        body: "Information is used to provide app features, protect users, process wallet activity, improve reliability, prevent abuse, and respond to support or compliance needs.",
      },
      {
        heading: "User Controls",
        body: "Users may update profile details, language preferences, notification settings, and support requests from the app where available.",
      },
    ],
  },
  refund: {
    title: "Refund/Cancellation Policy",
    updated: "Last updated: April 2026",
    sections: [
      {
        heading: "Recharge Payments",
        body: "Successful wallet recharges are generally credited immediately. If a recharge is charged but not credited, users should contact support with transaction details.",
      },
      {
        heading: "Call Charges",
        body: "Calls are charged according to the displayed rate and billing rules. Partial minutes may be rounded up when shown in the call screen.",
      },
      {
        heading: "Refund Review",
        body: "Refund or adjustment requests may be reviewed for duplicate payments, technical failures, failed crediting, or other exceptional cases.",
      },
    ],
  },
  community: {
    title: "Community Guidelines",
    updated: "Last updated: April 2026",
    sections: [
      {
        heading: "Respectful Interaction",
        body: "Users and creators should communicate respectfully. Harassment, hate speech, threats, explicit abuse, exploitation, and repeated unwanted contact are not allowed.",
      },
      {
        heading: "Safe Use",
        body: "Do not share sensitive personal information, payment credentials, passwords, OTPs, or private documents during calls or chats.",
      },
      {
        heading: "Reporting",
        body: "Users should report unsafe behavior, suspicious accounts, payment issues, or policy violations through the app support and reporting tools.",
      },
    ],
  },
  moderation: {
    title: "Content Moderation",
    updated: "Last updated: April 2026",
    sections: [
      {
        heading: "Review Process",
        body: "The platform may review profiles, reports, creator activity, and support tickets to detect policy violations and protect users.",
      },
      {
        heading: "Actions",
        body: "Depending on severity, actions may include warnings, feature limits, temporary suspension, creator approval review, rejection, or account bans.",
      },
      {
        heading: "Appeals",
        body: "Users or creators may contact support if they believe a moderation action was taken in error.",
      },
    ],
  },
  compliance: {
    title: "Compliance Statement",
    updated: "Last updated: April 2026",
    sections: [
      {
        heading: "General Compliance",
        body: "LINKY aims to operate with appropriate user safety, payment transparency, privacy, and platform integrity controls.",
      },
      {
        heading: "Creator and User Controls",
        body: "The app includes approval flows, wallet records, reporting tools, support access, and admin controls intended to support responsible operations.",
      },
      {
        heading: "Policy Updates",
        body: "Compliance content may be updated as product, legal, operational, or safety requirements change.",
      },
    ],
  },
} as const;

export default function LegalPage() {
  const [, setLocation] = useLocation();
  const { slug } = useParams<{ slug: keyof typeof legalPages }>();
  const page = slug ? legalPages[slug] : undefined;

  if (!page) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" onClick={() => setLocation("/user/account")}>
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <Card className="mt-4">
            <CardContent className="p-6">
              <p className="text-muted-foreground">This policy page is not available.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/user/account")}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold">Legal & Policies</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>{page.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{page.updated}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {page.sections.map((section) => (
              <section key={section.heading} className="space-y-2">
                <h2 className="font-semibold text-base">{section.heading}</h2>
                <p className="text-sm leading-6 text-muted-foreground">{section.body}</p>
              </section>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
