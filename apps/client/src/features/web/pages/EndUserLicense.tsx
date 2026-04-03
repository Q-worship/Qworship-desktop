import React, { useState } from "react";
import {
  ArrowLeft,
  MessageSquare,
  Scale,
  Users,
  Shield,
  Download,
  AlertTriangle,
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

export default function EndUserLicense() {
  const [legalForm, setLegalForm] = useState({
    name: "",
    email: "",
    organization: "",
    inquiry: "",
    licenseType: "",
    urgency: "",
  });

  const handleLegalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Legal inquiry submitted:", legalForm);
    alert(
      "Legal inquiry submitted successfully! Our legal team will respond within 3 business days.",
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
              <MessageSquare className="w-6 h-6 text-[#7a5af8] mr-2" />
              <span className="[font-family:'Lufga-Bold',Helvetica] font-bold text-xl text-gray-900">
                End User License Agreement
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
            <div className="w-20 h-20 bg-gradient-to-br from-[#7a5af8] to-[#6949e8] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
            <h1 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-4xl md:text-5xl text-gray-900 mb-4">
              End User License Agreement
            </h1>
            <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-lg text-gray-600 max-w-2xl mx-auto">
              This agreement outlines the terms and conditions for using
              Q-worship software and services. Please read carefully before
              using our platform.
            </p>
            <div className="mt-6 text-sm text-gray-500 [font-family:'Lufga-Medium',Helvetica] font-medium">
              Effective Date: January 29, 2025 | Version 2.1
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-12">
            {/* License Grant */}
            <section>
              <div className="flex items-center mb-6">
                <Scale className="w-6 h-6 text-[#7a5af8] mr-3" />
                <h2 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900">
                  License Grant
                </h2>
              </div>
              <div className="bg-gradient-to-br from-[#7a5af8]/5 to-[#7a5af8]/10 rounded-xl p-8 border border-[#7a5af8]/20">
                <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed mb-6">
                  Devine Digital Technologies Ltd. grants you a limited,
                  non-exclusive, non-transferable, and revocable license to use
                  Q-worship software and services for your church or religious
                  organization's worship presentations and related activities.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-lg text-gray-900 mb-4">
                      Permitted Uses
                    </h3>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-[#7a5af8] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600">
                          Create and display worship presentations during church
                          services
                        </span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-[#7a5af8] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600">
                          Use AI-powered Bible companion for scripture
                          navigation
                        </span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-[#7a5af8] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600">
                          Store and organize worship content in cloud storage
                        </span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-[#7a5af8] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600">
                          Share presentations within your organization's team
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-lg text-gray-900 mb-4">
                      License Scope
                    </h3>
                    <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed">
                      This license extends to all authorized users within your
                      subscribing organization. Each user must be properly
                      registered and authenticated through your organization's
                      Q-worship account.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Usage Restrictions */}
            <section>
              <div className="flex items-center mb-6">
                <AlertTriangle className="w-6 h-6 text-[#fd348f] mr-3" />
                <h2 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900">
                  Usage Restrictions
                </h2>
              </div>
              <div className="bg-gradient-to-br from-[#fd348f]/5 to-[#fd348f]/10 rounded-xl p-8 border border-[#fd348f]/20">
                <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed mb-6">
                  To maintain the integrity and security of Q-worship services,
                  the following activities are strictly prohibited:
                </p>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-6 h-6 border-2 border-[#fd348f] rounded-full flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                      <div className="w-2 h-2 bg-[#fd348f] rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-gray-900 mb-1">
                        Commercial Redistribution
                      </h4>
                      <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 text-sm">
                        You may not sell, rent, lease, or distribute Q-worship
                        software or content to third parties for commercial
                        purposes.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 border-2 border-[#fd348f] rounded-full flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                      <div className="w-2 h-2 bg-[#fd348f] rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-gray-900 mb-1">
                        Reverse Engineering
                      </h4>
                      <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 text-sm">
                        Attempting to decompile, reverse engineer, or extract
                        source code from Q-worship software is prohibited.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 border-2 border-[#fd348f] rounded-full flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                      <div className="w-2 h-2 bg-[#fd348f] rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-gray-900 mb-1">
                        Harmful Activities
                      </h4>
                      <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 text-sm">
                        Using Q-worship for any illegal, harmful, or
                        unauthorized purposes including hacking or data mining.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 border-2 border-[#fd348f] rounded-full flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                      <div className="w-2 h-2 bg-[#fd348f] rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-gray-900 mb-1">
                        Account Sharing
                      </h4>
                      <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 text-sm">
                        Sharing login credentials or allowing unauthorized
                        access to your Q-worship account is not permitted.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Content Ownership */}
            <section>
              <div className="flex items-center mb-6">
                <Shield className="w-6 h-6 text-[#4ECDC4] mr-3" />
                <h2 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900">
                  Content Ownership & Rights
                </h2>
              </div>
              <div className="bg-gradient-to-br from-[#4ECDC4]/5 to-[#4ECDC4]/10 rounded-xl p-8 border border-[#4ECDC4]/20">
                <div className="space-y-6">
                  <div>
                    <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-lg text-gray-900 mb-3">
                      Your Content
                    </h3>
                    <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed">
                      You retain all rights to content you create or upload to
                      Q-worship, including presentations, images, and custom
                      materials. We claim no ownership over your worship
                      content. However, you grant us a limited license to store,
                      process, and display your content as necessary to provide
                      our services.
                    </p>
                  </div>
                  <div>
                    <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-lg text-gray-900 mb-3">
                      Q-worship Platform
                    </h3>
                    <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed">
                      All rights, title, and interest in Q-worship software,
                      including source code, algorithms, user interface, and
                      documentation, remain the exclusive property of Devine
                      Digital Technologies Ltd. This includes all intellectual
                      property rights and trade secrets.
                    </p>
                  </div>
                  <div>
                    <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-lg text-gray-900 mb-3">
                      Licensed Content
                    </h3>
                    <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed">
                      Q-worship includes licensed biblical texts, hymns, and
                      worship resources. These materials are licensed for use
                      within the platform only and may not be extracted or used
                      independently without proper licensing agreements.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* User Responsibilities */}
            <section>
              <div className="flex items-center mb-6">
                <Users className="w-6 h-6 text-[#7a5af8] mr-3" />
                <h2 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900">
                  User Responsibilities
                </h2>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-8">
                <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed mb-6">
                  As a Q-worship user, you are responsible for maintaining the
                  security and appropriate use of your account:
                </p>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-lg text-gray-900 mb-4">
                      Account Security
                    </h3>
                    <ul className="space-y-2">
                      <li className="flex items-center text-gray-600">
                        <div className="w-2 h-2 bg-[#7a5af8] rounded-full mr-3"></div>
                        <span className="[font-family:'Lufga-Regular',Helvetica] font-normal text-sm">
                          Maintain strong, unique passwords
                        </span>
                      </li>
                      <li className="flex items-center text-gray-600">
                        <div className="w-2 h-2 bg-[#7a5af8] rounded-full mr-3"></div>
                        <span className="[font-family:'Lufga-Regular',Helvetica] font-normal text-sm">
                          Enable two-factor authentication when available
                        </span>
                      </li>
                      <li className="flex items-center text-gray-600">
                        <div className="w-2 h-2 bg-[#7a5af8] rounded-full mr-3"></div>
                        <span className="[font-family:'Lufga-Regular',Helvetica] font-normal text-sm">
                          Report security incidents immediately
                        </span>
                      </li>
                      <li className="flex items-center text-gray-600">
                        <div className="w-2 h-2 bg-[#7a5af8] rounded-full mr-3"></div>
                        <span className="[font-family:'Lufga-Regular',Helvetica] font-normal text-sm">
                          Log out from shared or public devices
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-lg text-gray-900 mb-4">
                      Content Guidelines
                    </h3>
                    <ul className="space-y-2">
                      <li className="flex items-center text-gray-600">
                        <div className="w-2 h-2 bg-[#4ECDC4] rounded-full mr-3"></div>
                        <span className="[font-family:'Lufga-Regular',Helvetica] font-normal text-sm">
                          Ensure you have rights to uploaded content
                        </span>
                      </li>
                      <li className="flex items-center text-gray-600">
                        <div className="w-2 h-2 bg-[#4ECDC4] rounded-full mr-3"></div>
                        <span className="[font-family:'Lufga-Regular',Helvetica] font-normal text-sm">
                          Respect copyright and licensing terms
                        </span>
                      </li>
                      <li className="flex items-center text-gray-600">
                        <div className="w-2 h-2 bg-[#4ECDC4] rounded-full mr-3"></div>
                        <span className="[font-family:'Lufga-Regular',Helvetica] font-normal text-sm">
                          Maintain appropriate content standards
                        </span>
                      </li>
                      <li className="flex items-center text-gray-600">
                        <div className="w-2 h-2 bg-[#4ECDC4] rounded-full mr-3"></div>
                        <span className="[font-family:'Lufga-Regular',Helvetica] font-normal text-sm">
                          Back up important presentations regularly
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Data Export */}
            <section>
              <div className="flex items-center mb-6">
                <Download className="w-6 h-6 text-[#4ECDC4] mr-3" />
                <h2 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900">
                  Data Portability & Export
                </h2>
              </div>
              <div className="bg-gradient-to-br from-[#4ECDC4]/5 to-[#4ECDC4]/10 rounded-xl p-8 border border-[#4ECDC4]/20">
                <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed mb-6">
                  We believe your worship content should always remain
                  accessible to your organization. Q-worship provides
                  comprehensive data export capabilities to ensure you maintain
                  control over your content.
                </p>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg p-6">
                    <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-lg text-gray-900 mb-3">
                      Export Formats
                    </h3>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li className="[font-family:'Lufga-Regular',Helvetica] font-normal">
                        • PowerPoint (.pptx)
                      </li>
                      <li className="[font-family:'Lufga-Regular',Helvetica] font-normal">
                        • PDF documents
                      </li>
                      <li className="[font-family:'Lufga-Regular',Helvetica] font-normal">
                        • Image files (.jpg, .png)
                      </li>
                      <li className="[font-family:'Lufga-Regular',Helvetica] font-normal">
                        • JSON data export
                      </li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-6">
                    <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-lg text-gray-900 mb-3">
                      Export Timeline
                    </h3>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li className="[font-family:'Lufga-Regular',Helvetica] font-normal">
                        • Instant: Individual presentations
                      </li>
                      <li className="[font-family:'Lufga-Regular',Helvetica] font-normal">
                        • 24 hours: Bulk exports
                      </li>
                      <li className="[font-family:'Lufga-Regular',Helvetica] font-normal">
                        • 60 days: Account termination
                      </li>
                      <li className="[font-family:'Lufga-Regular',Helvetica] font-normal">
                        • Always: Data download rights
                      </li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-6">
                    <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-lg text-gray-900 mb-3">
                      Migration Support
                    </h3>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li className="[font-family:'Lufga-Regular',Helvetica] font-normal">
                        • Technical documentation
                      </li>
                      <li className="[font-family:'Lufga-Regular',Helvetica] font-normal">
                        • Migration assistance
                      </li>
                      <li className="[font-family:'Lufga-Regular',Helvetica] font-normal">
                        • Format conversion tools
                      </li>
                      <li className="[font-family:'Lufga-Regular',Helvetica] font-normal">
                        • Expert consultation
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section>
              <div className="bg-gray-50 rounded-xl p-8">
                <h2 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900 mb-6">
                  Limitation of Liability
                </h2>
                <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed mb-4">
                  Q-worship is provided "as is" without warranties of any kind.
                  While we strive to provide reliable service, Devine Digital
                  Technologies Ltd. shall not be liable for any indirect,
                  incidental, special, or consequential damages arising from the
                  use of our software.
                </p>
                <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed">
                  Our liability shall not exceed the amount paid by you for
                  Q-worship services in the twelve months preceding any claim.
                  This limitation applies to all claims, whether based on
                  warranty, contract, tort, or any other legal theory.
                </p>
              </div>
            </section>

            {/* Contact Section */}
            <section className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8">
              <div className="flex items-center mb-6">
                <Mail className="w-6 h-6 text-[#7a5af8] mr-3" />
                <h2 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900">
                  License Questions?
                </h2>
              </div>
              <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed mb-6">
                If you have questions about this End User License Agreement or
                need clarification about usage rights, our legal team is
                available to help. We're committed to transparency and fair
                licensing practices.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="bg-[#7a5af8] hover:bg-[#6949e8] text-white px-6 py-3 rounded-lg [font-family:'Lufga-Medium',Helvetica] font-medium transition-colors">
                      Contact Legal Team
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg lg:w-[1200px] lg:max-w-none lg:h-[800px] w-full max-h-[90vh] overflow-y-auto p-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
                      {/* Form Section */}
                      <div className="p-8 flex flex-col">
                        <DialogHeader className="mb-6">
                          <DialogTitle className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900 flex items-center">
                            <MessageSquare className="w-6 h-6 mr-3 text-[#7a5af8]" />
                            Legal Team Contact
                          </DialogTitle>
                          <DialogDescription className="[font-family:'Lufga-Regular',Helvetica] text-gray-600">
                            Need help with licensing, terms, or legal questions?
                            Our legal team is here to provide clarity and
                            support.
                          </DialogDescription>
                        </DialogHeader>

                        <form
                          onSubmit={handleLegalSubmit}
                          className="space-y-6 flex-1"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label
                                htmlFor="legal-name"
                                className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                              >
                                Name
                              </Label>
                              <Input
                                id="legal-name"
                                value={legalForm.name}
                                onChange={(e) =>
                                  setLegalForm({
                                    ...legalForm,
                                    name: e.target.value,
                                  })
                                }
                                required
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label
                                htmlFor="legal-email"
                                className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                              >
                                Email
                              </Label>
                              <Input
                                id="legal-email"
                                type="email"
                                value={legalForm.email}
                                onChange={(e) =>
                                  setLegalForm({
                                    ...legalForm,
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
                                htmlFor="legal-organization"
                                className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                              >
                                Organization
                              </Label>
                              <Input
                                id="legal-organization"
                                value={legalForm.organization}
                                onChange={(e) =>
                                  setLegalForm({
                                    ...legalForm,
                                    organization: e.target.value,
                                  })
                                }
                                className="mt-1"
                                placeholder="Church or organization name"
                              />
                            </div>
                            <div>
                              <Label
                                htmlFor="legal-urgency"
                                className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                              >
                                Urgency Level
                              </Label>
                              <Select
                                onValueChange={(value) =>
                                  setLegalForm({ ...legalForm, urgency: value })
                                }
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select urgency level" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">
                                    Low - General question
                                  </SelectItem>
                                  <SelectItem value="medium">
                                    Medium - License clarification
                                  </SelectItem>
                                  <SelectItem value="high">
                                    High - Legal concern
                                  </SelectItem>
                                  <SelectItem value="urgent">
                                    Urgent - Compliance issue
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <Label
                              htmlFor="legal-license"
                              className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                            >
                              License/Agreement Type
                            </Label>
                            <Select
                              onValueChange={(value) =>
                                setLegalForm({
                                  ...legalForm,
                                  licenseType: value,
                                })
                              }
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select license type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="eula">
                                  End User License Agreement
                                </SelectItem>
                                <SelectItem value="terms">
                                  Terms of Service
                                </SelectItem>
                                <SelectItem value="privacy">
                                  Privacy Policy
                                </SelectItem>
                                <SelectItem value="commercial">
                                  Commercial licensing
                                </SelectItem>
                                <SelectItem value="copyright">
                                  Copyright inquiry
                                </SelectItem>
                                <SelectItem value="other">
                                  Other legal matter
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label
                              htmlFor="legal-inquiry"
                              className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                            >
                              Legal Inquiry Details
                            </Label>
                            <Textarea
                              id="legal-inquiry"
                              value={legalForm.inquiry}
                              onChange={(e) =>
                                setLegalForm({
                                  ...legalForm,
                                  inquiry: e.target.value,
                                })
                              }
                              className="mt-1 min-h-[100px]"
                              placeholder="Please describe your legal question, licensing concern, or compliance inquiry in detail..."
                              required
                            />
                          </div>
                          <Button
                            type="submit"
                            className="w-full bg-[#7a5af8] hover:bg-[#6949e8] text-white [font-family:'Lufga-Medium',Helvetica] font-medium"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Submit Legal Inquiry
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
                  href="mailto:legal@qworship.com"
                  className="border border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-3 rounded-lg [font-family:'Lufga-Medium',Helvetica] font-medium transition-colors text-center"
                >
                  legal@qworship.com
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
