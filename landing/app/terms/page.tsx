import type { Metadata } from "next";
import { LegalDoc, LegalSection } from "@/components/legal-doc";
import { siteConfig } from "@/data/site-config";

export const metadata: Metadata = {
  title: "Terms of Use | Kinova",
  description:
    "The terms that govern your use of the Kinova app, including subscriptions and a health disclaimer.",
};

function Mail() {
  return (
    <a
      href={`mailto:${siteConfig.email}`}
      className="text-white underline decoration-white/25 underline-offset-4 transition hover:decoration-white"
    >
      {siteConfig.email}
    </a>
  );
}

export default function TermsPage() {
  return (
    <LegalDoc
      eyebrow="Terms"
      title="Terms of Use"
      updated="June 14, 2026"
      intro={
        <p>
          These Terms of Use (&quot;Terms&quot;) govern your use of the Kinova
          mobile app and website (&quot;Kinova&quot;), operated by an independent
          developer based in the Republic of Kazakhstan. By using Kinova you agree
          to these Terms. If you do not agree, do not use the app.
        </p>
      }
    >
      <LegalSection title="1. Eligibility & accounts">
        <p>
          You must be at least 13 years old (or the minimum age required in your
          country) to use Kinova. You are responsible for your account, for
          keeping your credentials secure, and for the activity that happens under
          your account.
        </p>
      </LegalSection>

      <LegalSection title="2. Subscriptions & billing">
        <p>
          Kinova offers a free plan and two paid subscriptions:
        </p>
        <ul className="ml-5 list-disc space-y-2">
          <li>
            <strong className="text-white/85">Free</strong> — $0.
          </li>
          <li>
            <strong className="text-white/85">Pro</strong> — $6.99 / month or
            $49.99 / year.
          </li>
          <li>
            <strong className="text-white/85">Premium</strong> — $12.99 / month
            or $99.99 / year.
          </li>
        </ul>
        <p>
          Paid subscriptions are auto-renewing. Payment is charged to your Apple
          App Store or Google Play account at confirmation of purchase, and your
          subscription renews for the same period unless you cancel at least 24
          hours before the end of the current period. You manage or cancel your
          subscription in your App Store or Google Play account settings; deleting
          the app does not cancel it. Prices are shown in your local currency and
          may vary by region and over time; we will give notice of price changes
          as required. Refunds are handled by Apple or Google under their store
          policies.
        </p>
      </LegalSection>

      <LegalSection title="3. Health & fitness disclaimer">
        <p>
          Kinova provides general fitness information and is not a medical device
          or a substitute for professional medical advice, diagnosis, or
          treatment. Consult a qualified physician before starting any exercise
          program, especially if you have a health condition or injury. You train
          at your own risk; stop and seek medical attention if you experience pain
          or discomfort. Kinova is not responsible for any injury or health
          consequence arising from use of the app.
        </p>
      </LegalSection>

      <LegalSection title="4. Acceptable use">
        <p>
          Use Kinova only for lawful, personal purposes. Do not reverse-engineer,
          disrupt, abuse, or attempt to gain unauthorized access to the service,
          and do not misuse other users&apos; data.
        </p>
      </LegalSection>

      <LegalSection title="5. Intellectual property">
        <p>
          Kinova, including its software, design, and content, is owned by us and
          protected by law. We grant you a personal, non-transferable,
          non-exclusive license to use the app. Your training data and notes
          remain yours.
        </p>
      </LegalSection>

      <LegalSection title="6. Apple App Store">
        <p>
          If you download Kinova from the Apple App Store, these Terms are between
          you and Kinova only, not Apple. Apple is not responsible for the app or
          its support, and Kinova is solely responsible for the app and any
          claims relating to it. Apple and its subsidiaries are third-party
          beneficiaries of these Terms and may enforce them against you.
        </p>
      </LegalSection>

      <LegalSection title="7. Disclaimers & limitation of liability">
        <p>
          Kinova is provided &quot;as is&quot; without warranties of any kind. To
          the maximum extent permitted by law, we are not liable for indirect,
          incidental, or consequential damages, and our total liability is limited
          to the amount you paid us in the 12 months before the claim.
        </p>
      </LegalSection>

      <LegalSection title="8. Termination">
        <p>
          You may stop using Kinova and delete your account at any time. We may
          suspend or terminate access if you violate these Terms or to protect the
          service.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes to these Terms">
        <p>
          We may update these Terms as the app evolves. We will revise the
          &quot;Last updated&quot; date above and, for material changes, provide a
          more prominent notice. Continued use after changes means you accept
          them.
        </p>
      </LegalSection>

      <LegalSection title="10. Governing law & contact">
        <p>
          These Terms are governed by the laws of the Republic of Kazakhstan,
          without regard to conflict-of-laws rules. Questions: <Mail />.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
