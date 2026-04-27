import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | WAVR Music",
  description: "Learn how WAVR Music collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  const lastUpdated = "April 27, 2024";
  
  return (
    <div className="bg-gray-950 min-h-screen text-gray-400">
      <section className="pt-32 pb-24 border-b border-gray-900">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-6">Privacy Policy</h1>
          <p className="text-sm">Last Updated: {lastUpdated}</p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 prose prose-invert prose-red">
          <div className="space-y-12">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">1. Introduction</h2>
              <p className="leading-relaxed">
                WAVR Music Inc. ("we," "us," or "our") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website and services.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-6">2. Data We Collect</h2>
              <p className="mb-4">We collect several types of information from and about users of our platform, including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Identity Data:</strong> Name, username, and profile photo.</li>
                <li><strong>Contact Data:</strong> Email address and billing address.</li>
                <li><strong>Financial Data:</strong> Payment card details and payout information (processed via Stripe).</li>
                <li><strong>Technical Data:</strong> IP address, browser type, and device information.</li>
                <li><strong>Usage Data:</strong> Information about how you use our website, products, and services.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-6">3. How We Use Your Data</h2>
              <p className="mb-4">We use your information to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide and maintain our platform.</li>
                <li>Process your transactions and payouts.</li>
                <li>Notify you about changes to our service.</li>
                <li>Allow you to participate in interactive features of our platform.</li>
                <li>Provide customer support.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-6">4. Data Security</h2>
              <p className="leading-relaxed">
                We have implemented appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way. All payment transactions are encrypted and processed through our third-party provider, Stripe.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-6">5. Your Legal Rights</h2>
              <p className="leading-relaxed">
                Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, or restriction of your personal data.
              </p>
            </div>

            <div className="pt-10 border-t border-gray-900">
              <p className="text-sm">If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@wavr.music" className="text-purple-400 hover:underline">privacy@wavr.music</a>.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
