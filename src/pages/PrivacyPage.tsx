export function PrivacyPage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: 18 March 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
          <p className="text-base leading-relaxed">
            JustAWheelOfLife ("we", "us", "our") operates at justawheeloflife.com. This Privacy
            Policy explains what personal data we collect, how we use it, and your rights regarding
            that data. By using the Service you agree to the collection and use of information in
            accordance with this policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">2. Data We Collect</h2>
          <p className="text-base leading-relaxed mb-2">We collect the following categories of data:</p>
          <ul className="list-disc list-inside space-y-2 text-base leading-relaxed">
            <li>
              <strong>Account data:</strong> your email address and an encrypted password hash,
              managed via Supabase Auth. We never store plaintext passwords.
            </li>
            <li>
              <strong>Wheel data:</strong> wheel names, category names, scores (1–10), action item
              text and optional deadlines, and snapshot names and dates that you create within the
              Service.
            </li>
            <li>
              <strong>Profile data:</strong> optional display name and avatar image you choose to
              upload.
            </li>
            <li>
              <strong>Usage data:</strong> Vercel (our hosting provider) may collect anonymised
              access logs including IP address, pages visited, and timestamps as part of standard
              infrastructure operation.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">3. How We Use Your Data</h2>
          <p className="text-base leading-relaxed">
            We use your data exclusively to provide the wheel of life service: to display your
            wheels and scores, to enable you to track your progress over time through snapshots, to
            support account recovery, and to maintain Service security. We do not sell, rent, or
            share your personal data with third parties for marketing or advertising purposes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">4. Data Storage</h2>
          <p className="text-base leading-relaxed">
            Your data is stored in Supabase Cloud, which is hosted on AWS infrastructure in the EU
            region. Avatar images are stored in Supabase Storage on the same infrastructure. All
            data at rest is encrypted by the hosting provider. Data in transit is encrypted via
            TLS.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">5. Data Retention</h2>
          <p className="text-base leading-relaxed">
            We retain your personal data for as long as your account is active. If you wish to
            have your data deleted, you may request deletion by contacting us at the email address
            below. We will action deletion requests within 30 days. Note that some anonymised or
            aggregated information may be retained for operational purposes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">6. Your Rights (GDPR)</h2>
          <p className="text-base leading-relaxed">
            If you are located in the European Economic Area, you have the following rights
            regarding your personal data: the right to access the data we hold about you; the
            right to correct inaccurate data; the right to export your data in a portable format;
            and the right to request deletion of your data. To exercise any of these rights,
            contact us at{' '}
            <a
              href="mailto:contact@justawheeloflife.com"
              className="text-primary hover:underline"
            >
              contact@justawheeloflife.com
            </a>
            .
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">7. Cookies</h2>
          <p className="text-base leading-relaxed">
            We use functional cookies only. Specifically, Supabase Auth stores a session token
            cookie to keep you logged in between visits. We do not use advertising cookies,
            tracking cookies, or third-party analytics cookies. You may disable cookies in your
            browser settings, but doing so will prevent you from staying logged in.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">8. Children</h2>
          <p className="text-base leading-relaxed">
            The Service is not directed at or intended for use by individuals under the age of 16.
            We do not knowingly collect personal data from minors. If you believe a minor has
            provided us with personal data, please contact us and we will take steps to delete that
            information promptly.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">9. Changes to This Policy</h2>
          <p className="text-base leading-relaxed">
            We may update this Privacy Policy from time to time. When we do, we will revise the
            "Last updated" date at the top of this page. Your continued use of the Service after
            changes are posted constitutes your acceptance of the revised policy. We encourage you
            to review this policy periodically.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">10. Contact</h2>
          <p className="text-base leading-relaxed">
            If you have any questions about this Privacy Policy or wish to exercise your data
            rights, please contact us at{' '}
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
