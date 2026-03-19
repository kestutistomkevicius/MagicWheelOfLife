export function TermsPage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: 18 March 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p className="text-base leading-relaxed">
            By accessing or using JustAWheelOfLife ("the Service"), you agree to be bound by these
            Terms of Service. If you do not agree to these terms, please do not use the Service.
            These terms apply to all visitors, users, and others who access or use the Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
          <p className="text-base leading-relaxed">
            JustAWheelOfLife is a personal self-assessment tool for wheel of life coaching. It
            allows users to create custom life-area wheels, score life areas, set action items, and
            track progress over time. The Service is available in free and premium tiers. Free-tier
            users may be subject to feature limitations (such as the number of wheels they can
            create).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
          <p className="text-base leading-relaxed">
            To use the Service you must register an account using a valid email address and
            password via Supabase Auth. You are responsible for maintaining the confidentiality of
            your account credentials and for all activities that occur under your account. You must
            be at least 16 years old to register. Please notify us immediately if you suspect any
            unauthorised use of your account.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">4. User Content</h2>
          <p className="text-base leading-relaxed">
            Wheel data, category names, scores, action items, and snapshots you create belong to
            you. We store this data solely to provide the Service. We do not sell, rent, or share
            your personal data or content with third parties for marketing or advertising purposes.
            You grant us the limited right to store and process your content as necessary to
            deliver the Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">5. Acceptable Use</h2>
          <p className="text-base leading-relaxed">
            You agree not to misuse the Service. Prohibited activities include: automated scraping
            or data harvesting; impersonating any person or entity; using the Service for any
            unlawful purpose; attempting to gain unauthorised access to any part of the Service or
            its related infrastructure; and interfering with or disrupting the Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">6. Premium Tier</h2>
          <p className="text-base leading-relaxed">
            Additional features — such as more wheels and the ability to mark categories as
            important — are available via a premium subscription. Specific subscription pricing,
            billing terms, and cancellation policies will be published when payment functionality
            is enabled. By subscribing you will be subject to those additional terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">7. Service Availability</h2>
          <p className="text-base leading-relaxed">
            The Service is provided "as is" and "as available" without warranties of any kind,
            express or implied. We do not guarantee uninterrupted or error-free operation. We
            reserve the right to modify, suspend, or discontinue any feature or the Service as a
            whole at any time, with or without notice.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">8. Limitation of Liability</h2>
          <p className="text-base leading-relaxed">
            To the maximum extent permitted by applicable law, JustAWheelOfLife and its operators
            shall not be liable for any indirect, incidental, special, consequential, or punitive
            damages arising out of or related to your use of the Service. Our total aggregate
            liability for any claim arising under these terms shall not exceed the amount you paid
            for the Service in the twelve (12) months prior to the event giving rise to the claim.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">9. Governing Law</h2>
          <p className="text-base leading-relaxed">
            These Terms of Service and any disputes arising from them shall be governed by and
            construed in accordance with the laws of the Republic of Lithuania, without regard to
            conflict of law principles. Any disputes shall be resolved in the competent courts of
            Lithuania.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">10. Changes to Terms</h2>
          <p className="text-base leading-relaxed">
            We may update these Terms of Service from time to time. When we do, we will revise the
            "Last updated" date at the top of this page. Your continued use of the Service after
            changes are posted constitutes your acceptance of the revised terms. We encourage you
            to review these terms periodically.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">11. Contact</h2>
          <p className="text-base leading-relaxed">
            If you have any questions about these Terms of Service, please contact us at{' '}
            <a
              href="mailto:contact@justawheeloflife.com"
              className="text-primary hover:underline"
            >
              contact@justawheeloflife.com
            </a>
            .
          </p>
        </section>

        <div className="mt-10 pt-6 border-t">
          <a href="/" className="text-sm text-primary hover:underline">
            ← Back to home
          </a>
        </div>
      </div>
    </div>
  )
}
