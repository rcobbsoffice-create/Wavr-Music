import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy | WAVR Music",
  description: "Learn how WAVR Music uses cookies and similar technologies to improve your experience.",
};

export default function CookiesPage() {
  const lastUpdated = "April 27, 2024";
  
  return (
    <div className="bg-gray-950 min-h-screen text-gray-400">
      <section className="pt-32 pb-24 border-b border-gray-900">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-6">Cookie Policy</h1>
          <p className="text-sm">Last Updated: {lastUpdated}</p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 prose prose-invert prose-red">
          <div className="space-y-12">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">1. What are Cookies?</h2>
              <p className="leading-relaxed">
                Cookies are small text files that are stored on your device when you visit a website. They are widely used to make websites work more efficiently and to provide information to the owners of the site.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-6">2. How We Use Cookies</h2>
              <p className="mb-4">WAVR uses cookies for several purposes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Essential Cookies:</strong> These are necessary for the platform to function, such as keeping you logged in.</li>
                <li><strong>Analytics Cookies:</strong> These help us understand how visitors interact with our site by collecting and reporting information anonymously.</li>
                <li><strong>Preference Cookies:</strong> These allow the site to remember choices you make (such as your theme preference).</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-6">3. Third-Party Cookies</h2>
              <p className="leading-relaxed">
                We may use third-party services like Google Analytics and Stripe, which also set cookies on your device to provide their respective services.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-6">4. Managing Your Cookies</h2>
              <p className="leading-relaxed">
                Most web browsers allow you to control cookies through their settings preferences. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience or lose the ability to access certain services.
              </p>
            </div>

            <div className="pt-10 border-t border-gray-900">
              <p className="text-sm">If you have any questions about our use of cookies, please contact us at <a href="mailto:privacy@wavr.music" className="text-purple-400 hover:underline">privacy@wavr.music</a>.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
