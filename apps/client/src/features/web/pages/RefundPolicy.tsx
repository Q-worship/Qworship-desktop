import React, { useState } from "react";
import {
  ArrowLeft,
  RotateCcw,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
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

export default function RefundPolicy() {
  const [billingForm, setBillingForm] = useState({
    name: "",
    email: "",
    orderNumber: "",
    refundReason: "",
    amount: "",
    urgency: "",
  });

  const handleBillingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Billing inquiry submitted:", billingForm);
    alert(
      "Billing inquiry submitted successfully! Our billing team will process your request within 24 hours.",
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
              <RotateCcw className="w-6 h-6 text-[#4ECDC4] mr-2" />
              <span className="[font-family:'Lufga-Bold',Helvetica] font-bold text-xl text-gray-900">
                Refund Policy
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
            <div className="w-20 h-20 bg-gradient-to-br from-[#4ECDC4] to-[#45B7B8] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <RotateCcw className="w-10 h-10 text-white" />
            </div>
            <h1 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-4xl md:text-5xl text-gray-900 mb-4">
              Refund Policy
            </h1>
            <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-lg text-gray-600 max-w-2xl mx-auto">
              We want every church to be completely satisfied with Q-worship.
              Our flexible refund policy ensures you can try our platform with
              confidence.
            </p>
            <div className="mt-6 text-sm text-gray-500 [font-family:'Lufga-Medium',Helvetica] font-medium">
              Last updated: January 29, 2025
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-12">
            {/* Money-Back Guarantee */}
            <section>
              <div className="flex items-center mb-6">
                <CheckCircle className="w-6 h-6 text-[#4ECDC4] mr-3" />
                <h2 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900">
                  30-Day Money-Back Guarantee
                </h2>
              </div>
              <div className="bg-gradient-to-br from-[#4ECDC4]/5 to-[#4ECDC4]/10 rounded-xl p-8 border border-[#4ECDC4]/20">
                <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed mb-6">
                  We believe in Q-worship's ability to transform your church's
                  worship experience. That's why we offer a comprehensive 30-day
                  money-back guarantee on all subscription plans.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-6">
                    <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-lg text-gray-900 mb-3">
                      What's Covered
                    </h3>
                    <ul className="space-y-2">
                      <li className="flex items-center text-gray-600">
                        <div className="w-2 h-2 bg-[#4ECDC4] rounded-full mr-3"></div>
                        <span className="[font-family:'Lufga-Regular',Helvetica] font-normal">
                          All monthly and annual subscription plans
                        </span>
                      </li>
                      <li className="flex items-center text-gray-600">
                        <div className="w-2 h-2 bg-[#4ECDC4] rounded-full mr-3"></div>
                        <span className="[font-family:'Lufga-Regular',Helvetica] font-normal">
                          Add-on features and premium tools
                        </span>
                      </li>
                      <li className="flex items-center text-gray-600">
                        <div className="w-2 h-2 bg-[#4ECDC4] rounded-full mr-3"></div>
                        <span className="[font-family:'Lufga-Regular',Helvetica] font-normal">
                          Training and setup services
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-6">
                    <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-lg text-gray-900 mb-3">
                      No Questions Asked
                    </h3>
                    <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed">
                      If Q-worship doesn't meet your church's needs within 30
                      days, simply contact our support team. We'll process your
                      full refund within 5-7 business days, no questions asked.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Refund Timeline */}
            <section>
              <div className="flex items-center mb-6">
                <Clock className="w-6 h-6 text-[#7a5af8] mr-3" />
                <h2 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900">
                  Refund Timeline & Process
                </h2>
              </div>
              <div className="bg-gradient-to-br from-[#7a5af8]/5 to-[#7a5af8]/10 rounded-xl p-8 border border-[#7a5af8]/20">
                <div className="space-y-8">
                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-[#7a5af8] rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <div>
                      <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-lg text-gray-900 mb-2">
                        Submit Refund Request
                      </h3>
                      <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600">
                        Contact our support team via email, phone, or through
                        your Q-worship dashboard within 30 days of your initial
                        payment or renewal.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-[#7a5af8] rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    <div>
                      <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-lg text-gray-900 mb-2">
                        Confirmation & Processing
                      </h3>
                      <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600">
                        We'll confirm your refund request within 24 hours and
                        begin processing immediately. Your subscription will
                        remain active until the end of your current billing
                        period.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-[#7a5af8] rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <span className="text-white text-sm font-bold">3</span>
                    </div>
                    <div>
                      <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-lg text-gray-900 mb-2">
                        Refund Issued
                      </h3>
                      <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600">
                        Your refund will be processed to your original payment
                        method within 5-7 business days. You'll receive an email
                        confirmation once the refund is complete.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Billing Scenarios */}
            <section>
              <div className="flex items-center mb-6">
                <CreditCard className="w-6 h-6 text-[#fd348f] mr-3" />
                <h2 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900">
                  Billing Scenarios
                </h2>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white border border-gray-200 rounded-xl p-8">
                  <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-lg text-gray-900 mb-4">
                    Monthly Subscriptions
                  </h3>
                  <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed mb-4">
                    For monthly plans, you can request a refund within 30 days
                    of any billing cycle. The refund covers the current month's
                    subscription fee.
                  </p>
                  <div className="bg-[#fd348f]/5 rounded-lg p-4">
                    <p className="[font-family:'Lufga-Medium',Helvetica] font-medium text-sm text-gray-700">
                      <strong>Example:</strong> If you're charged on the 15th
                      and request a refund on the 20th, you'll receive a full
                      refund and retain access until the next billing cycle.
                    </p>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-8">
                  <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-lg text-gray-900 mb-4">
                    Annual Subscriptions
                  </h3>
                  <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed mb-4">
                    Annual plans can be refunded within 30 days of the initial
                    purchase or renewal for a full refund, regardless of usage.
                  </p>
                  <div className="bg-[#4ECDC4]/5 rounded-lg p-4">
                    <p className="[font-family:'Lufga-Medium',Helvetica] font-medium text-sm text-gray-700">
                      <strong>Pro-rated refunds:</strong> After 30 days, annual
                      subscribers may receive pro-rated refunds in exceptional
                      circumstances.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Special Circumstances */}
            <section>
              <div className="flex items-center mb-6">
                <AlertCircle className="w-6 h-6 text-[#fd348f] mr-3" />
                <h2 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900">
                  Special Circumstances
                </h2>
              </div>
              <div className="bg-gradient-to-br from-[#fd348f]/5 to-[#fd348f]/10 rounded-xl p-8 border border-[#fd348f]/20">
                <div className="space-y-6">
                  <div>
                    <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-lg text-gray-900 mb-3">
                      Technical Issues
                    </h3>
                    <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed">
                      If you experience significant technical issues that
                      prevent you from using Q-worship effectively, we'll work
                      with you to resolve the problem. If we can't fix the issue
                      within 14 days, you're eligible for a full refund
                      regardless of how long you've been subscribed.
                    </p>
                  </div>
                  <div>
                    <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-lg text-gray-900 mb-3">
                      Service Discontinuation
                    </h3>
                    <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed">
                      In the unlikely event that Q-worship discontinues service,
                      all active subscribers will receive full refunds for any
                      unused portion of their subscription, plus 60 days to
                      export their data.
                    </p>
                  </div>
                  <div>
                    <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-lg text-gray-900 mb-3">
                      Feature Changes
                    </h3>
                    <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed">
                      If we significantly modify or remove core features that
                      were essential to your subscription, you may request a
                      pro-rated refund within 30 days of the change
                      notification.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Non-Refundable Items */}
            <section>
              <div className="bg-gray-50 rounded-xl p-8">
                <h2 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900 mb-6">
                  Non-Refundable Items
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-6 h-6 border-2 border-gray-400 rounded-full flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                    <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600">
                      <strong>Custom development work</strong> or one-time
                      consultation services (unless service is not delivered)
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 border-2 border-gray-400 rounded-full flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                    <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600">
                      <strong>Third-party integrations</strong> or add-ons
                      purchased through external vendors
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 border-2 border-gray-400 rounded-full flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                    <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600">
                      <strong>Data recovery services</strong> or premium support
                      packages (unless service is not provided)
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Contact Section */}
            <section className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8">
              <div className="flex items-center mb-6">
                <Mail className="w-6 h-6 text-[#4ECDC4] mr-3" />
                <h2 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900">
                  Need a Refund?
                </h2>
              </div>
              <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed mb-6">
                Our billing team is here to help process your refund quickly and
                efficiently. We understand that circumstances change, and we're
                committed to making the refund process as smooth as possible.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="bg-[#4ECDC4] hover:bg-[#45B7B8] text-white px-6 py-3 rounded-lg [font-family:'Lufga-Medium',Helvetica] font-medium transition-colors">
                      Contact Billing Team
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg lg:w-[1200px] lg:max-w-none lg:h-[800px] w-full max-h-[90vh] overflow-y-auto p-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
                      {/* Form Section */}
                      <div className="p-8 flex flex-col">
                        <DialogHeader className="mb-6">
                          <DialogTitle className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900 flex items-center">
                            <RotateCcw className="w-6 h-6 mr-3 text-[#4ECDC4]" />
                            Billing Team Contact
                          </DialogTitle>
                          <DialogDescription className="[font-family:'Lufga-Regular',Helvetica] text-gray-600">
                            Need help with billing, refunds, or payment issues?
                            Our billing team is ready to assist you.
                          </DialogDescription>
                        </DialogHeader>

                        <form
                          onSubmit={handleBillingSubmit}
                          className="space-y-6 flex-1"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label
                                htmlFor="billing-name"
                                className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                              >
                                Name
                              </Label>
                              <Input
                                id="billing-name"
                                value={billingForm.name}
                                onChange={(e) =>
                                  setBillingForm({
                                    ...billingForm,
                                    name: e.target.value,
                                  })
                                }
                                required
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label
                                htmlFor="billing-email"
                                className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                              >
                                Email
                              </Label>
                              <Input
                                id="billing-email"
                                type="email"
                                value={billingForm.email}
                                onChange={(e) =>
                                  setBillingForm({
                                    ...billingForm,
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
                                htmlFor="billing-order"
                                className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                              >
                                Order/Invoice Number
                              </Label>
                              <Input
                                id="billing-order"
                                value={billingForm.orderNumber}
                                onChange={(e) =>
                                  setBillingForm({
                                    ...billingForm,
                                    orderNumber: e.target.value,
                                  })
                                }
                                className="mt-1"
                                placeholder="QW-2025-XXXX"
                              />
                            </div>
                            <div>
                              <Label
                                htmlFor="billing-urgency"
                                className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                              >
                                Urgency Level
                              </Label>
                              <Select
                                onValueChange={(value) =>
                                  setBillingForm({
                                    ...billingForm,
                                    urgency: value,
                                  })
                                }
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select urgency level" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">
                                    Low - General inquiry
                                  </SelectItem>
                                  <SelectItem value="medium">
                                    Medium - Billing question
                                  </SelectItem>
                                  <SelectItem value="high">
                                    High - Refund request
                                  </SelectItem>
                                  <SelectItem value="urgent">
                                    Urgent - Payment issue
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <Label
                              htmlFor="billing-reason"
                              className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                            >
                              Request Type
                            </Label>
                            <Select
                              onValueChange={(value) =>
                                setBillingForm({
                                  ...billingForm,
                                  refundReason: value,
                                })
                              }
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select request type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="refund">
                                  Refund request
                                </SelectItem>
                                <SelectItem value="billing-error">
                                  Billing error
                                </SelectItem>
                                <SelectItem value="payment-failed">
                                  Payment failed
                                </SelectItem>
                                <SelectItem value="plan-change">
                                  Plan change
                                </SelectItem>
                                <SelectItem value="invoice-copy">
                                  Invoice copy
                                </SelectItem>
                                <SelectItem value="other">
                                  Other billing inquiry
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label
                              htmlFor="billing-amount"
                              className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                            >
                              Amount (if applicable)
                            </Label>
                            <Input
                              id="billing-amount"
                              value={billingForm.amount}
                              onChange={(e) =>
                                setBillingForm({
                                  ...billingForm,
                                  amount: e.target.value,
                                })
                              }
                              className="mt-1"
                              placeholder="£0.00"
                            />
                          </div>

                          <div>
                            <Label
                              htmlFor="billing-details"
                              className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                            >
                              Request Details
                            </Label>
                            <Textarea
                              id="billing-details"
                              value={billingForm.refundReason}
                              onChange={(e) =>
                                setBillingForm({
                                  ...billingForm,
                                  refundReason: e.target.value,
                                })
                              }
                              className="mt-1 min-h-[100px]"
                              placeholder="Please provide details about your billing inquiry, refund request, or payment issue..."
                              required
                            />
                          </div>
                          <Button
                            type="submit"
                            className="w-full bg-[#4ECDC4] hover:bg-[#45B7B8] text-white [font-family:'Lufga-Medium',Helvetica] font-medium"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Submit Billing Request
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
                  href="mailto:billing@qworship.com"
                  className="border border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-3 rounded-lg [font-family:'Lufga-Medium',Helvetica] font-medium transition-colors text-center"
                >
                  billing@qworship.com
                </a>
                <a
                  href="tel:+1-800-QWORSHIP"
                  className="border border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-3 rounded-lg [font-family:'Lufga-Medium',Helvetica] font-medium transition-colors text-center"
                >
                  1-800-QWORSHIP
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
