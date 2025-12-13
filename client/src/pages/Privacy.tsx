import { Link } from "wouter";
import { ArrowLeft, Newspaper, Shield, Database, Eye, Share2, Clock, Lock, UserCheck, Globe, Mail, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const sections = [
  { id: "introduction", label: "Introduction", icon: FileText },
  { id: "information-collected", label: "Information We Collect", icon: Database },
  { id: "how-we-use", label: "How We Use Your Information", icon: Eye },
  { id: "ai-third-party", label: "AI & Third-Party Services", icon: Globe },
  { id: "cookies", label: "Cookies & Tracking", icon: Shield },
  { id: "data-sharing", label: "Data Sharing & Disclosure", icon: Share2 },
  { id: "data-retention", label: "Data Retention", icon: Clock },
  { id: "security", label: "Security", icon: Lock },
  { id: "your-rights", label: "Your Rights & Choices", icon: UserCheck },
  { id: "international", label: "International Transfers", icon: Globe },
  { id: "contact", label: "Contact Us", icon: Mail },
  { id: "changes", label: "Changes to This Policy", icon: FileText },
];

export default function Privacy() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0a1f] text-gray-200">
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0f0a1f]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0f0a1f]/60">
        <div className="container flex h-14 items-center gap-4">
          <Link href="/home">
            <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-white/10" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Newspaper className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-white">Privacy Policy</h1>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-4xl mx-auto px-6">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-8">
          <p className="text-amber-200 text-sm">
            <strong>Notice:</strong> This document is provided for information only and does not constitute legal advice. Please consult a qualified lawyer before relying on it.
          </p>
        </div>

        <div className="text-sm text-gray-400 mb-8">
          Last updated: December 13, 2025
        </div>

        <nav className="bg-white/5 rounded-xl p-6 mb-10 border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">Table of Contents</h2>
          <div className="grid md:grid-cols-2 gap-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className="flex items-center gap-2 text-left text-gray-300 hover:text-indigo-400 transition-colors py-1.5 px-2 rounded hover:bg-white/5"
                data-testid={`toc-${section.id}`}
              >
                <section.icon className="w-4 h-4 text-indigo-400" />
                <span className="text-sm">{section.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="space-y-12">
          <section id="introduction">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <FileText className="w-6 h-6 text-indigo-400" />
              Introduction
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                Welcome to LUM News, an AI-assisted global news aggregation and analysis platform. LUM News collects, organizes, and presents news articles from dozens of trusted sources worldwide, helping you understand global events through multiple perspectives.
              </p>
              <p>
                This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our service. We are committed to being transparent about our data practices and respecting your privacy.
              </p>
            </div>
          </section>

          <section id="information-collected">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <Database className="w-6 h-6 text-indigo-400" />
              Information We Collect
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <h3 className="text-lg font-medium text-white">Account Information</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Email address</li>
                <li>Display name</li>
                <li>Password (stored as a secure hash, never in plain text)</li>
                <li>Profile information you choose to provide</li>
              </ul>

              <h3 className="text-lg font-medium text-white mt-6">Usage Data</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Pages visited and features used</li>
                <li>Filters and search queries applied</li>
                <li>Articles clicked, bookmarked, or marked as read</li>
                <li>Device and browser information</li>
                <li>Approximate location (based on IP address, if used for regional content)</li>
              </ul>

              <h3 className="text-lg font-medium text-white mt-6">Content Preferences</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Selected topics and categories of interest</li>
                <li>Preferred regions for news coverage</li>
                <li>Saved stories and bookmarks</li>
                <li>Alert and digest settings</li>
              </ul>

              <h3 className="text-lg font-medium text-white mt-6">Communication Data</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Email address for digests and alerts</li>
                <li>Support messages and inquiries</li>
              </ul>

              <p className="mt-4 text-gray-400 italic">
                Note: LUM News aggregates news articles from third-party sources (via APIs and RSS feeds). We do not own this content—it remains the property of the original publishers.
              </p>
            </div>
          </section>

          <section id="how-we-use">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <Eye className="w-6 h-6 text-indigo-400" />
              How We Use Your Information
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-white">Provide and operate the service</strong> — Display stories, personalize your feed based on preferences, and enable bookmarking and reading history.</li>
                <li><strong className="text-white">Improve the product</strong> — Analyze usage patterns to develop new features and enhance existing functionality.</li>
                <li><strong className="text-white">Send communications</strong> — Account-related emails (verification, security alerts) and optional digests/alerts based on your topic and region preferences.</li>
                <li><strong className="text-white">Ensure security</strong> — Prevent abuse, fraud, and unauthorized access to protect you and other users.</li>
              </ul>
            </div>
          </section>

          <section id="ai-third-party">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <Globe className="w-6 h-6 text-indigo-400" />
              AI & Third-Party Services
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>LUM News uses artificial intelligence and third-party services to enhance your experience:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-white">AI Models</strong> — We may use AI for clustering related articles, generating summaries, and analyzing sentiment across different sources.</li>
                <li><strong className="text-white">News APIs</strong> — We aggregate content from providers like NewsAPI.org, Newsdata.io, and Mediastack.</li>
                <li><strong className="text-white">Email Services</strong> — We use Resend to deliver email digests and notifications.</li>
                <li><strong className="text-white">Analytics & Error Logging</strong> — We may use analytics and error monitoring services to improve reliability.</li>
              </ul>
              <p className="mt-4">
                These third-party providers are bound by their own privacy terms and policies. We only share the minimum data necessary for them to provide their services.
              </p>
              <p className="text-amber-200/80 mt-4">
                <strong>Important:</strong> AI-generated summaries and sentiment analysis are created from third-party news articles and may not be perfectly accurate. Always verify important information with original sources.
              </p>
            </div>
          </section>

          <section id="cookies">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <Shield className="w-6 h-6 text-indigo-400" />
              Cookies & Tracking
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>We use cookies and similar technologies for:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-white">Authentication</strong> — Keeping you logged in across sessions.</li>
                <li><strong className="text-white">Preferences</strong> — Remembering your selected topics, regions, and theme settings.</li>
                <li><strong className="text-white">Analytics</strong> — Understanding how the service is used to make improvements.</li>
              </ul>
              <p className="mt-4">
                You can control cookies through your browser settings. Disabling cookies may affect some functionality of the service.
              </p>
            </div>
          </section>

          <section id="data-sharing">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <Share2 className="w-6 h-6 text-indigo-400" />
              Data Sharing & Disclosure
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p className="font-medium text-white">We do not sell your personal data.</p>
              <p>We may share data in the following circumstances:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-white">Service Providers</strong> — Hosting, email delivery, analytics, and error monitoring services that help us operate LUM News.</li>
                <li><strong className="text-white">Legal Requirements</strong> — When required by law or to protect our rights, safety, or property.</li>
                <li><strong className="text-white">Aggregated Statistics</strong> — We may share anonymous, aggregated data publicly (e.g., total users, most popular topics) that cannot identify individuals.</li>
              </ul>
            </div>
          </section>

          <section id="data-retention">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <Clock className="w-6 h-6 text-indigo-400" />
              Data Retention
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-white">Account Data</strong> — Retained while your account is active, plus a reasonable period after deletion for backup and legal purposes.</li>
                <li><strong className="text-white">Usage Logs</strong> — Retained for a limited period (typically 90 days) before being summarized or deleted.</li>
                <li><strong className="text-white">Email Preferences & Bookmarks</strong> — Retained as long as your account exists or until you remove them.</li>
              </ul>
            </div>
          </section>

          <section id="security">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <Lock className="w-6 h-6 text-indigo-400" />
              Security
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>We implement reasonable security measures to protect your information:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Encryption of data in transit (HTTPS/TLS)</li>
                <li>Secure password hashing</li>
                <li>Access controls limiting who can access user data</li>
                <li>Regular security reviews</li>
              </ul>
              <p className="mt-4 text-gray-400">
                While we strive to protect your data, no system is 100% secure. We cannot guarantee absolute security.
              </p>
            </div>
          </section>

          <section id="your-rights">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <UserCheck className="w-6 h-6 text-indigo-400" />
              Your Rights & Choices
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-white">Access</strong> — View and download your account information.</li>
                <li><strong className="text-white">Update</strong> — Modify your profile, topics, and region preferences at any time.</li>
                <li><strong className="text-white">Opt Out</strong> — Unsubscribe from email digests and alerts.</li>
                <li><strong className="text-white">Delete</strong> — Request deletion of your account and associated data by contacting us.</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, visit your Settings page or contact us at the email below.
              </p>
            </div>
          </section>

          <section id="international">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <Globe className="w-6 h-6 text-indigo-400" />
              International Transfers
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                Your data may be stored and processed in countries other than your own, depending on where our hosting and third-party service providers operate. We take steps to ensure appropriate safeguards are in place for international data transfers.
              </p>
            </div>
          </section>

          <section id="contact">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <Mail className="w-6 h-6 text-indigo-400" />
              Contact Us
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                If you have questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <p className="text-indigo-400 font-medium">privacy@lumnews.app</p>
            </div>
          </section>

          <section id="changes">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <FileText className="w-6 h-6 text-indigo-400" />
              Changes to This Policy
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                We may update this Privacy Policy from time to time. When we make changes, we will update the "Last updated" date at the top of this page. We encourage you to review this policy periodically.
              </p>
              <p>
                Continued use of LUM News after changes are posted constitutes acceptance of the updated policy.
              </p>
            </div>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 text-center">
          <Link href="/terms">
            <Button variant="outline" className="border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10" data-testid="link-terms">
              View Terms of Service
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
