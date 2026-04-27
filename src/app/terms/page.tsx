import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | WAVR Music",
  description: "Read the terms and conditions for using the WAVR Music platform.",
};

export default function TermsPage() {
  const lastUpdated = "April 27, 2024";
  
  return (
    <div className="bg-gray-950 min-h-screen text-gray-400">
      <section className="pt-32 pb-24 border-b border-gray-900">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-6">Terms of Service</h1>
          <p className="text-sm">Last Updated: {lastUpdated}</p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 prose prose-invert prose-red">
          <div className="space-y-12">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">1. Agreement to Terms</h2>
              <p className="leading-relaxed">
                By accessing or using WAVR Music (the "Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Platform.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-6">2. User Accounts</h2>
              <p className="leading-relaxed">
                To use certain features of the Platform, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must be at least 18 years old to create an account.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-6">3. Content Ownership & Licensing</h2>
              <p className="mb-4">As a producer on WAVR, you retain all rights to the music you upload, subject to the licenses you grant to buyers through the Platform.</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You represent and warrant that you own or have the necessary licenses for all content you upload.</li>
                <li>WAVR is a marketplace and is not responsible for copyright disputes between users.</li>
                <li>Buyers obtain licenses directly from you based on the terms specified at the time of purchase.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-6">4. Payments & Fees</h2>
              <p className="leading-relaxed">
                WAVR charges a transaction fee on all sales as specified in our pricing plans. Payments are processed via Stripe Connect. You are responsible for any taxes associated with your earnings on the Platform.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-6">5. Prohibited Conduct</h2>
              <p className="leading-relaxed">
                You agree not to use the Platform for any unlawful purpose, to infringe on the intellectual property of others, or to upload malicious code. We reserve the right to terminate accounts that violate these terms.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-6">6. Limitation of Liability</h2>
              <p className="leading-relaxed">
                WAVR is provided "as is" without any warranties. We are not liable for any damages arising from your use of the Platform or for any disputes between producers and buyers.
              </p>
            </div>

            <div className="pt-10 border-t border-gray-900">
              <p className="text-sm">For questions regarding these terms, please contact <a href="mailto:legal@wavr.music" className="text-purple-400 hover:underline">legal@wavr.music</a>.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
