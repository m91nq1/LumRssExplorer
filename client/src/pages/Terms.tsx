import { Link } from "wouter";
import { ArrowLeft, Newspaper, FileText, User, Shield, Scale, Brain, ExternalLink, CreditCard, XCircle, AlertTriangle, Gavel, RefreshCw, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const sections = [
  { id: "introduction", label: "Introduction & Acceptance", icon: FileText },
  { id: "use-of-service", label: "Use of the Service", icon: User },
  { id: "accounts", label: "Accounts & Security", icon: Shield },
  { id: "acceptable-use", label: "Acceptable Use Policy", icon: Scale },
  { id: "content-ip", label: "Content & Intellectual Property", icon: FileText },
  { id: "ai-accuracy", label: "AI & Information Accuracy", icon: Brain },
  { id: "third-party", label: "Third-Party Links & Services", icon: ExternalLink },
  { id: "payments", label: "Plans, Payments & Changes", icon: CreditCard },
  { id: "termination", label: "Termination", icon: XCircle },
  { id: "liability", label: "Limitation of Liability", icon: AlertTriangle },
  { id: "governing-law", label: "Governing Law & Disputes", icon: Gavel },
  { id: "changes", label: "Changes to the Terms", icon: RefreshCw },
  { id: "contact", label: "Contact", icon: Mail },
];

export default function Terms() {
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
            <h1 className="text-lg font-semibold text-white">Terms of Service</h1>
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
              Introduction & Acceptance
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                Welcome to LUM News. By accessing or using our service, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the service.
              </p>
              <h3 className="text-lg font-medium text-white mt-6">Definitions</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-white">"Service"</strong> — The LUM News website, applications, and related features.</li>
                <li><strong className="text-white">"User"</strong> — Any individual who accesses or uses the Service.</li>
                <li><strong className="text-white">"Content"</strong> — All text, images, data, and materials available through the Service, including third-party news articles and AI-generated summaries.</li>
              </ul>
            </div>
          </section>

          <section id="use-of-service">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <User className="w-6 h-6 text-indigo-400" />
              Use of the Service
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>LUM News is provided for <strong className="text-white">personal and professional informational purposes only</strong>. The Service is not intended to provide:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Medical advice</li>
                <li>Financial or investment advice</li>
                <li>Legal advice</li>
              </ul>
              <p className="mt-4">
                Always consult qualified professionals for advice in these areas.
              </p>
              <h3 className="text-lg font-medium text-white mt-6">Age Requirements</h3>
              <p>
                You must be at least 16 years of age (or the age of majority in your jurisdiction) to use the Service. By using LUM News, you represent that you meet this requirement.
              </p>
              <h3 className="text-lg font-medium text-white mt-6">Account Registration</h3>
              <p>
                When creating an account, you agree to provide accurate and complete information and to keep your login credentials secure.
              </p>
            </div>
          </section>

          <section id="accounts">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <Shield className="w-6 h-6 text-indigo-400" />
              Accounts & Security
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>You are responsible for:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized access or security breaches</li>
              </ul>
              <p className="mt-4">
                We reserve the right to suspend or terminate accounts that we believe have been compromised.
              </p>
            </div>
          </section>

          <section id="acceptable-use">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <Scale className="w-6 h-6 text-indigo-400" />
              Acceptable Use Policy
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>You agree <strong className="text-white">NOT</strong> to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Scrape, bulk download, or use automated tools to access the Service beyond normal use</li>
                <li>Reverse engineer, decompile, or attempt to extract source code from the Service</li>
                <li>Circumvent security measures or access controls</li>
                <li>Use the Service to harass, abuse, or harm others</li>
                <li>Engage in any illegal activity through the Service</li>
                <li>Use the Service to generate or spread disinformation, hate speech, or illegal content</li>
                <li>Impersonate others or misrepresent your affiliation</li>
              </ul>
              <p className="mt-4">
                Reasonable personal and analytical use of the Service is permitted within these boundaries.
              </p>
            </div>
          </section>

          <section id="content-ip">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <FileText className="w-6 h-6 text-indigo-400" />
              Content & Intellectual Property
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <h3 className="text-lg font-medium text-white">Third-Party Content</h3>
              <p>
                LUM News aggregates news articles from third-party sources. <strong className="text-white">Copyright remains with the original publishers.</strong> We provide links and summaries for informational purposes only.
              </p>
              
              <h3 className="text-lg font-medium text-white mt-6">AI-Generated Content</h3>
              <p>
                AI summaries, sentiment analysis, and visualizations are provided for convenience and should not be treated as authoritative. Always refer to original sources.
              </p>
              
              <h3 className="text-lg font-medium text-white mt-6">LUM News Property</h3>
              <p>
                The LUM News brand, logo, user interface, and original code/assets are our property. You may not copy, modify, or distribute these without permission.
              </p>
              
              <h3 className="text-lg font-medium text-white mt-6">License to Use</h3>
              <p>
                We grant you a <strong className="text-white">limited, non-exclusive, non-transferable license</strong> to access and use the Service for personal or internal business purposes, subject to these Terms.
              </p>
            </div>
          </section>

          <section id="ai-accuracy">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <Brain className="w-6 h-6 text-indigo-400" />
              AI & Information Accuracy
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <p className="text-amber-200">
                  <strong>Disclaimer:</strong> AI-generated summaries and sentiment analysis may contain errors or inaccuracies. The Service is not responsible for the accuracy or completeness of third-party news content or AI-generated output.
                </p>
              </div>
              <p className="mt-4">
                We encourage users to verify important information by consulting the original news sources linked in each article.
              </p>
            </div>
          </section>

          <section id="third-party">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <ExternalLink className="w-6 h-6 text-indigo-400" />
              Third-Party Links & Services
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                LUM News contains links to external websites and uses third-party APIs for news content. We are not responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>The content, accuracy, or policies of external websites</li>
                <li>Availability or changes to third-party services</li>
                <li>Any damages arising from your use of third-party sites or services</li>
              </ul>
            </div>
          </section>

          <section id="payments">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-indigo-400" />
              Plans, Payments & Changes
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                LUM News is currently provided <strong className="text-white">free of charge</strong>. However, we reserve the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Introduce paid subscription tiers or premium features in the future</li>
                <li>Change or discontinue features with reasonable notice</li>
                <li>Modify pricing plans for new subscribers</li>
              </ul>
              <p className="mt-4">
                We will notify users of significant changes to pricing or features in advance.
              </p>
            </div>
          </section>

          <section id="termination">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <XCircle className="w-6 h-6 text-indigo-400" />
              Termination
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>We may suspend or terminate your account if you:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violate these Terms of Service</li>
                <li>Abuse the Service or other users</li>
                <li>Pose a security or legal risk</li>
              </ul>
              <p className="mt-4">
                You may stop using the Service at any time or request account deletion by contacting us.
              </p>
            </div>
          </section>

          <section id="liability">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-indigo-400" />
              Limitation of Liability & Disclaimer
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="uppercase text-xs text-gray-400 mb-2">Legal Disclaimer</p>
                <p>
                  THE SERVICE IS PROVIDED <strong className="text-white">"AS IS"</strong> AND <strong className="text-white">"AS AVAILABLE"</strong> WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
                </p>
              </div>
              <p>We do not warrant that:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>The Service will be uninterrupted or error-free</li>
                <li>All information will be accurate or complete</li>
                <li>The Service will meet your specific requirements</li>
              </ul>
              <p className="mt-4">
                To the maximum extent permitted by law, LUM News shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.
              </p>
              <p className="mt-4 font-medium text-white">
                The Service does not provide legal, financial, or medical advice.
              </p>
            </div>
          </section>

          <section id="governing-law">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <Gavel className="w-6 h-6 text-indigo-400" />
              Governing Law & Dispute Resolution
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                These Terms are governed by the laws of <strong className="text-white">[Your Country/Region]</strong>, without regard to conflict of law principles.
              </p>
              <p className="mt-4">
                In the event of a dispute, both parties agree to attempt informal resolution before pursuing litigation. Any legal action must be brought in the courts of the governing jurisdiction.
              </p>
            </div>
          </section>

          <section id="changes">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <RefreshCw className="w-6 h-6 text-indigo-400" />
              Changes to the Terms
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                We may update these Terms from time to time. When we make changes, we will update the "Last updated" date at the top of this page.
              </p>
              <p>
                Continued use of LUM News after changes are posted constitutes your acceptance of the updated Terms.
              </p>
            </div>
          </section>

          <section id="contact">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <Mail className="w-6 h-6 text-indigo-400" />
              Contact
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                For questions about these Terms or to report abuse, please contact us at:
              </p>
              <p className="text-indigo-400 font-medium">legal@lumnews.app</p>
            </div>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 text-center">
          <Link href="/privacy">
            <Button variant="outline" className="border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10" data-testid="link-privacy">
              View Privacy Policy
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
