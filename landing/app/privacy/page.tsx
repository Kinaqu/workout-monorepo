import type { Metadata } from "next";
import { LegalDoc, LegalSection } from "@/components/legal-doc";
import { siteConfig } from "@/data/site-config";

export const metadata: Metadata = {
  title: "Privacy Policy | Kinova",
  description:
    "How Kinova collects, uses, shares, and protects your personal data.",
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

export default function PrivacyPage() {
  return (
    <LegalDoc
      eyebrow="Privacy"
      title="Privacy Policy"
      updated="June 14, 2026"
      intro={
        <p>
          This Privacy Policy explains how Kinova (&quot;Kinova&quot;,
          &quot;we&quot;, &quot;us&quot;) collects, uses, shares, and protects
          personal data when you use the Kinova mobile app and website. Kinova is
          operated by an independent developer based in the Republic of
          Kazakhstan. By using Kinova you agree to this policy.
        </p>
      }
    >
      <LegalSection title="1. Who we are">
        <p>
          Kinova is an adaptive bodyweight-training app. The data controller is
          the operator of Kinova, based in the Republic of Kazakhstan. For any
          privacy question or request, contact us at <Mail />.
        </p>
      </LegalSection>

      <LegalSection title="2. Information we collect">
        <p>We collect only what we need to run the service:</p>
        <ul className="ml-5 list-disc space-y-2">
          <li>
            <strong className="text-white/85">Account data.</strong> Your name
            and email address, handled through our authentication provider when
            you create an account or sign in.
          </li>
          <li>
            <strong className="text-white/85">Training data.</strong> Workouts
            you log, goals, available equipment, schedule, progress, and any
            free-text notes you add about your sessions.
          </li>
          <li>
            <strong className="text-white/85">Usage and device data.</strong>
            {" "}
            App interactions, crash reports, app version, device model, and
            operating system, used for analytics and reliability.
          </li>
          <li>
            <strong className="text-white/85">Subscription status.</strong>
            {" "}
            Whether you have an active Free, Pro, or Premium plan. Payments are
            processed by Apple or Google — we never receive your full card
            details.
          </li>
        </ul>
        <p>Kinova does not integrate with Apple Health and does not collect health-record data.</p>
      </LegalSection>

      <LegalSection title="3. How we use your information">
        <ul className="ml-5 list-disc space-y-2">
          <li>Operate the app and generate your daily and weekly workouts.</li>
          <li>
            Adapt your plan — advance, hold, or regress targets based on logged
            sessions (Pro).
          </li>
          <li>
            Power the personal AI coach that reviews your sessions and notes and
            explains changes (Premium).
          </li>
          <li>Manage your account, subscription, and provide support.</li>
          <li>Analyze usage and fix crashes to improve the app.</li>
          <li>Meet legal obligations and protect against abuse.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Premium AI processing">
        <p>
          If you use Premium, your training data and notes are sent to a
          third-party AI provider so the coach can generate feedback,
          explanations, and form guidance. We share only what is needed for that
          purpose and do not authorize the provider to use your content to train
          its general-purpose models. AI features are available only on the
          Premium plan.
        </p>
      </LegalSection>

      <LegalSection title="5. How we share information">
        <p>
          We do not sell your personal data. We share it only with service
          providers acting on our behalf:
        </p>
        <ul className="ml-5 list-disc space-y-2">
          <li>Authentication, hosting, and database providers.</li>
          <li>Analytics and crash-reporting providers.</li>
          <li>The AI provider described above (Premium only).</li>
          <li>
            Apple and Google, who process subscription payments through their
            stores.
          </li>
          <li>
            Authorities where required by law, and a successor in the event of a
            merger or acquisition.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Data retention">
        <p>
          We keep your data while your account is active. When you delete your
          account or ask us to erase your data, we remove it within a reasonable
          period, except where we must retain limited records to meet legal
          obligations. Backups are purged on a rolling schedule.
        </p>
      </LegalSection>

      <LegalSection title="7. Security">
        <p>
          We use reasonable technical and organizational measures to protect your
          data, including encryption in transit and access controls. No method of
          transmission or storage is completely secure, so we cannot guarantee
          absolute security.
        </p>
      </LegalSection>

      <LegalSection title="8. Your rights">
        <p>
          You can request access to, correction of, export of, or deletion of
          your personal data, and you can withdraw consent at any time. To
          exercise any right, email <Mail /> and we will respond as required by
          applicable law. We honor the rights granted by the EU/UK GDPR and the
          California CCPA/CPRA for users in those regions, regardless of where we
          operate.
        </p>
      </LegalSection>

      <LegalSection title="9. International transfers">
        <p>
          Kinova operates from Kazakhstan and uses service providers that may
          process data in other countries. Where data crosses borders, we rely on
          appropriate safeguards consistent with applicable data-protection law.
        </p>
      </LegalSection>

      <LegalSection title="10. Children">
        <p>
          Kinova is not directed to children under 13 (or under the minimum age
          required in your country), and we do not knowingly collect their data.
          If you believe a child has provided us personal data, contact <Mail />{" "}
          and we will delete it.
        </p>
      </LegalSection>

      <LegalSection title="11. Changes to this policy">
        <p>
          We may update this policy as the app evolves. We will revise the
          &quot;Last updated&quot; date above and, for material changes, provide a
          more prominent notice.
        </p>
      </LegalSection>

      <LegalSection title="12. Governing law & contact">
        <p>
          This policy is governed by the laws of the Republic of Kazakhstan,
          including the Law &quot;On Personal Data and its Protection&quot;,
          together with the GDPR and CCPA where they apply to you. Questions or
          requests: <Mail />.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
