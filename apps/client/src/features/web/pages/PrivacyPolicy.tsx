import React, { useState } from "react";
import {
  ArrowLeft,
  Shield,
  Lock,
  Eye,
  Database,
  UserCheck,
  Mail,
  Send,
} from "lucide-react";
import { Link } from "wouter";
// import Footer from "@/features/dashboard/components/Footer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import worshipImage from "@assets/Group 1171275221 1_1753809462960.png";
import Footer from "../components/Footer";

export default function PrivacyPolicy() {
  const [privacyForm, setPrivacyForm] = useState({
    name: "",
    email: "",
    company: "",
    inquiry: "",
    priority: "",
    dataType: "",
  });

  const handlePrivacySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Privacy inquiry submitted:", privacyForm);
    alert(
      "Privacy inquiry submitted successfully! Our privacy team will respond within 48 hours.",
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/contact">
              <div className="flex items-center text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="[font-family:'Lufga-Medium',Helvetica] font-medium">
                  Back to Contact
                </span>
              </div>
            </Link>
            <div className="flex items-center">
              <Shield className="w-6 h-6 text-[#fd348f] mr-2" />
              <span className="[font-family:'Lufga-Bold',Helvetica] font-bold text-xl text-gray-900">
                Privacy Policy
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-6 lg:px-8 py-12">
        <div>
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-br from-[#fd348f] to-[#e62d7a] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-4xl md:text-5xl text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-lg text-gray-600 max-w-2xl mx-auto">
              Your privacy is fundamental to everything we do at Q-worship.
              Learn how we protect and handle your data with transparency and
              care.
            </p>
            <div className="mt-6 text-sm text-gray-500 [font-family:'Lufga-Medium',Helvetica] font-medium">
              Last updated: January 29, 2025
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-12">
            {/* Information We Collect */}
            <section>
              <div className="flex items-center mb-6">
                <Database className="w-6 h-6 text-[#fd348f] mr-3" />
                <h2 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900">
                  Information We Collect
                </h2>
              </div>
              <div className="bg-gray-50 rounded-xl p-8 space-y-6">
                <div>
                  <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-lg text-gray-900 mb-3">
                    Account Information
                  </h3>
                  <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed">
                    When you create a Q-worship account, we collect your name,
                    email address, church affiliation, and role within your
                    organization. This information helps us provide personalized
                    worship presentation tools and connect you with relevant
                    features.
                  </p>
                </div>
                <div>
                  <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-lg text-gray-900 mb-3">
                    Usage Data
                  </h3>
                  <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed">
                    We collect information about how you use Q-worship,
                    including presentation activities, Bible verse searches, AI
                    assistant interactions, and feature usage patterns. This
                    helps us improve our platform and provide better worship
                    experiences.
                  </p>
                </div>
                <div>
                  <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-lg text-gray-900 mb-3">
                    Content Data
                  </h3>
                  <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed">
                    Your worship presentations, custom slides, uploaded media,
                    and sermon notes are stored securely in our cloud
                    infrastructure. We never access your content without
                    explicit permission or legal requirement.
                  </p>
                </div>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section>
              <div className="flex items-center mb-6">
                <UserCheck className="w-6 h-6 text-[#4ECDC4] mr-3" />
                <h2 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900">
                  How We Use Your Information
                </h2>
              </div>
              <div className="bg-gradient-to-br from-[#4ECDC4]/5 to-[#4ECDC4]/10 rounded-xl p-8 border border-[#4ECDC4]/20">
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-[#4ECDC4] rounded-full mt-2 mr-4 flex-shrink-0"></div>
                    <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed">
                      <strong className="text-gray-900">
                        Service Delivery:
                      </strong>{" "}
                      Provide worship presentation tools, AI-powered Bible
                      companion, and cloud-based storage for your church
                      content.
                    </p>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-[#4ECDC4] rounded-full mt-2 mr-4 flex-shrink-0"></div>
                    <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed">
                      <strong className="text-gray-900">
                        Platform Improvement:
                      </strong>{" "}
                      Analyze usage patterns to enhance features, develop new
                      worship tools, and optimize user experience.
                    </p>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-[#4ECDC4] rounded-full mt-2 mr-4 flex-shrink-0"></div>
                    <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed">
                      <strong className="text-gray-900">Communication:</strong>{" "}
                      Send important updates about your account, new features,
                      and worship technology insights relevant to your ministry.
                    </p>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-[#4ECDC4] rounded-full mt-2 mr-4 flex-shrink-0"></div>
                    <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed">
                      <strong className="text-gray-900">Support:</strong>{" "}
                      Provide technical assistance, troubleshoot issues, and
                      help you maximize your worship presentation capabilities.
                    </p>
                  </li>
                </ul>
              </div>
            </section>

            {/* Data Security */}
            <section>
              <div className="flex items-center mb-6">
                <Lock className="w-6 h-6 text-[#7a5af8] mr-3" />
                <h2 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900">
                  Data Security & Protection
                </h2>
              </div>
              <div className="bg-gradient-to-br from-[#7a5af8]/5 to-[#7a5af8]/10 rounded-xl p-8 border border-[#7a5af8]/20">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-lg text-gray-900 mb-4">
                      Encryption Standards
                    </h3>
                    <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed">
                      All data transmitted to and from Q-worship is protected
                      using industry-standard TLS encryption. Your stored
                      content is encrypted at rest using AES-256 encryption
                      standards.
                    </p>
                  </div>
                  <div>
                    <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-lg text-gray-900 mb-4">
                      Access Controls
                    </h3>
                    <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed">
                      We implement strict access controls and authentication
                      measures. Only authorized personnel can access your data,
                      and all access is logged and monitored for security
                      purposes.
                    </p>
                  </div>
                  <div>
                    <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-lg text-gray-900 mb-4">
                      Infrastructure Security
                    </h3>
                    <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed">
                      Q-worship is hosted on secure cloud infrastructure with
                      24/7 monitoring, regular security audits, and automated
                      backup systems to ensure your worship content is always
                      protected.
                    </p>
                  </div>
                  <div>
                    <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-lg text-gray-900 mb-4">
                      Compliance
                    </h3>
                    <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed">
                      We comply with GDPR, CCPA, and other applicable privacy
                      regulations. Regular compliance audits ensure we maintain
                      the highest standards of data protection.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <div className="flex items-center mb-6">
                <Eye className="w-6 h-6 text-[#fd348f] mr-3" />
                <h2 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900">
                  Your Privacy Rights
                </h2>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-8">
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-[#fd348f] rounded-lg flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <div>
                      <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-lg text-gray-900 mb-2">
                        Access Your Data
                      </h3>
                      <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600">
                        Request a complete copy of all personal data we hold
                        about you, including account information and usage
                        patterns.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-[#4ECDC4] rounded-lg flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    <div>
                      <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-lg text-gray-900 mb-2">
                        Correct Inaccuracies
                      </h3>
                      <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600">
                        Update or correct any inaccurate personal information in
                        your Q-worship account at any time.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-[#7a5af8] rounded-lg flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                      <span className="text-white text-sm font-bold">3</span>
                    </div>
                    <div>
                      <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-lg text-gray-900 mb-2">
                        Delete Your Data
                      </h3>
                      <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600">
                        Request deletion of your personal data and account.
                        We'll securely remove all information within 30 days.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Contact Information */}
            <section className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8">
              <div className="flex items-center mb-6">
                <Mail className="w-6 h-6 text-[#fd348f] mr-3" />
                <h2 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900">
                  Questions About Privacy?
                </h2>
              </div>
              <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed mb-6">
                If you have questions about this Privacy Policy or how we handle
                your data, our privacy team is here to help. We're committed to
                transparency and will respond to all inquiries within 48 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="bg-[#fd348f] hover:bg-[#e62d7a] text-white px-6 py-3 rounded-lg [font-family:'Lufga-Medium',Helvetica] font-medium transition-colors">
                      Contact Privacy Team
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg lg:w-[1200px] lg:max-w-none lg:h-[800px] w-full max-h-[90vh] overflow-y-auto p-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
                      {/* Form Section */}
                      <div className="p-8 flex flex-col">
                        <DialogHeader className="mb-6">
                          <DialogTitle className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900 flex items-center">
                            <Shield className="w-6 h-6 mr-3 text-[#fd348f]" />
                            Privacy Team Contact
                          </DialogTitle>
                          <DialogDescription className="[font-family:'Lufga-Regular',Helvetica] text-gray-600">
                            Have questions about our privacy practices or need
                            help with your data rights? Our privacy team is here
                            to help.
                          </DialogDescription>
                        </DialogHeader>

                        <form
                          onSubmit={handlePrivacySubmit}
                          className="space-y-6 flex-1"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label
                                htmlFor="privacy-name"
                                className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                              >
                                Name
                              </Label>
                              <Input
                                id="privacy-name"
                                value={privacyForm.name}
                                onChange={(e) =>
                                  setPrivacyForm({
                                    ...privacyForm,
                                    name: e.target.value,
                                  })
                                }
                                required
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label
                                htmlFor="privacy-email"
                                className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                              >
                                Email
                              </Label>
                              <Input
                                id="privacy-email"
                                type="email"
                                value={privacyForm.email}
                                onChange={(e) =>
                                  setPrivacyForm({
                                    ...privacyForm,
                                    email: e.target.value,
                                  })
                                }
                                required
                                className="mt-1"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label
                                htmlFor="privacy-company"
                                className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                              >
                                Organization
                              </Label>
                              <Input
                                id="privacy-company"
                                value={privacyForm.company}
                                onChange={(e) =>
                                  setPrivacyForm({
                                    ...privacyForm,
                                    company: e.target.value,
                                  })
                                }
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label
                                htmlFor="privacy-priority"
                                className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                              >
                                Priority Level
                              </Label>
                              <Select
                                onValueChange={(value) =>
                                  setPrivacyForm({
                                    ...privacyForm,
                                    priority: value,
                                  })
                                }
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select priority level" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">
                                    Low - General inquiry
                                  </SelectItem>
                                  <SelectItem value="medium">
                                    Medium - Data access request
                                  </SelectItem>
                                  <SelectItem value="high">
                                    High - Privacy concern
                                  </SelectItem>
                                  <SelectItem value="urgent">
                                    Urgent - Data breach report
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <Label
                              htmlFor="privacy-datatype"
                              className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                            >
                              Data Type (if applicable)
                            </Label>
                            <Select
                              onValueChange={(value) =>
                                setPrivacyForm({
                                  ...privacyForm,
                                  dataType: value,
                                })
                              }
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select data type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="account">
                                  Account information
                                </SelectItem>
                                <SelectItem value="presentations">
                                  Presentation content
                                </SelectItem>
                                <SelectItem value="usage">
                                  Usage analytics
                                </SelectItem>
                                <SelectItem value="billing">
                                  Billing data
                                </SelectItem>
                                <SelectItem value="all">
                                  All personal data
                                </SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label
                              htmlFor="privacy-inquiry"
                              className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                            >
                              Privacy Inquiry Details
                            </Label>
                            <Textarea
                              id="privacy-inquiry"
                              value={privacyForm.inquiry}
                              onChange={(e) =>
                                setPrivacyForm({
                                  ...privacyForm,
                                  inquiry: e.target.value,
                                })
                              }
                              className="mt-1 min-h-[100px]"
                              placeholder="Please describe your privacy question, data request, or concern in detail..."
                              required
                            />
                          </div>
                          <Button
                            type="submit"
                            className="w-full bg-[#fd348f] hover:bg-[#e62d7a] text-white [font-family:'Lufga-Medium',Helvetica] font-medium"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Submit Privacy Inquiry
                          </Button>
                        </form>
                      </div>

                      {/* Image Section */}
                      <div className="hidden lg:block relative">
                        <img
                          src={worshipImage}
                          alt="Worship Experience"
                          className="w-full h-full object-cover rounded-r-lg"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-r-lg"></div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <a
                  href="mailto:privacy@qworship.com"
                  className="border border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-3 rounded-lg [font-family:'Lufga-Medium',Helvetica] font-medium transition-colors text-center"
                >
                  privacy@qworship.com
                </a>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
