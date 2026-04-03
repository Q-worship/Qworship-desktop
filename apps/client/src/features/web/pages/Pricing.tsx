import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { 
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Link } from "wouter";
import Footer from "@/features/web/components/Footer";
import qWorshipLogo from "@assets/Group 1_1753749672909.png";

export const Pricing = (): JSX.Element => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Navigation menu items
  const navItems = [
    { name: "Home", isActive: false },
    { name: "About", isActive: false },
    { name: "Features", isActive: false },
    { name: "Pricing", isActive: true },
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const plans = [
    {
      name: "Free",
      price: "Free",
      period: "/Per Month",
      subtitle: "Trial Plan",
      description: "Perfect for individual pastors or small churches wanting to test Q-worship's AI-powered features.",
      features: [
        { name: "Voice-activated Bible navigation", included: true },
        { name: "Basic sermon recording", included: true },
        { name: "5GB cloud storage", included: true },
        { name: "Standard Bible translations", included: true },
        { name: "Community support", included: false },
        { name: "Custom presentation themes", included: false },
        { name: "Multi-language support", included: false },
        { name: "Advanced analytics", included: false }
      ],
      buttonText: "Get Started",
      buttonStyle: "bg-[#4285f4] text-white",
      titleColor: "text-[#e91e63]",
      popular: false
    },
    {
      name: billingPeriod === 'monthly' ? "£14" : "£134",
      price: billingPeriod === 'monthly' ? "£14" : "£134",
      period: billingPeriod === 'monthly' ? "/Per Month" : "/Per Year",
      subtitle: "Basic Plan",
      description: "Ideal for churches with 1 to 5 branches seeking comprehensive worship presentation tools with AI assistance.",
      features: [
        { name: "Voice-activated Bible navigation", included: true },
        { name: "Advanced sermon recording", included: true },
        { name: "50GB cloud storage", included: true },
        { name: "All Bible translations", included: true },
        { name: "Email & chat support", included: true },
        { name: "Custom presentation themes", included: true },
        { name: "Multi-language support", included: false },
        { name: "Advanced analytics dashboard", included: false }
      ],
      buttonText: "Get Started",
      buttonStyle: "border border-[#4285f4] text-[#4285f4] bg-transparent hover:bg-[#4285f4] hover:text-white",
      titleColor: "text-[#4285f4]",
      popular: false,
      savings: billingPeriod === 'yearly' ? "Save £34/year" : null,
      monthlyEquivalent: billingPeriod === 'yearly' ? "£11.17/month" : null
    },
    {
      name: billingPeriod === 'monthly' ? "£18" : "£172",
      price: billingPeriod === 'monthly' ? "£18" : "£172",
      period: billingPeriod === 'monthly' ? "/Per Month" : "/Per Year",
      subtitle: "Premium Plan",
      description: "Ideal for churches with 6-25 branches seeking full-featured worship management with team collaboration.",
      features: [
        { name: "Voice-activated Bible navigation", included: true },
        { name: "Professional sermon recording", included: true },
        { name: "500GB cloud storage", included: true },
        { name: "All Bible translations", included: true },
        { name: "Priority support & phone", included: true },
        { name: "Custom presentation themes", included: true },
        { name: "Multi-language support", included: true },
        { name: "Advanced analytics dashboard", included: true }
      ],
      buttonText: "Get Started",
      buttonStyle: "border border-[#4285f4] text-[#4285f4] bg-transparent hover:bg-[#4285f4] hover:text-white",
      titleColor: "text-[#e91e63]",
      popular: true,
      savings: billingPeriod === 'yearly' ? "Save £44/year" : null,
      monthlyEquivalent: billingPeriod === 'yearly' ? "£14.33/month" : null
    },
    {
      name: "Growth",
      price: "Growth",
      period: "Plan",
      subtitle: "Growth Plan",
      description: "Ideal for churches with more than 50 branches seeking enterprise-level worship technology solutions.",
      features: [
        { name: "All Premium features included", included: true },
        { name: "Unlimited cloud storage", included: true },
        { name: "Dedicated account manager", included: true },
        { name: "Custom integrations & API", included: true },
        { name: "24/7 priority support", included: true },
        { name: "White-label solutions", included: true },
        { name: "Advanced security & compliance", included: true },
        { name: "On-site training & setup", included: true }
      ],
      buttonText: "Book a call with us",
      buttonStyle: "bg-[#7a5af8] text-white hover:bg-[#6949e8]",
      titleColor: "text-[#7a5af8]",
      popular: false
    }
  ];

  const comparisonFeatures = [
    {
      category: "Core Worship Features",
      features: [
        { name: "Voice-activated Bible navigation", free: true, basic: true, premium: true, growth: true },
        { name: "Sermon recording capabilities", free: true, basic: true, premium: true, growth: true },
        { name: "Cloud storage", free: "5GB", basic: "50GB", premium: "500GB", growth: "Unlimited" },
        { name: "Bible translations", free: "Standard", basic: "All", premium: "All", growth: "All + Custom" },
        { name: "Presentation themes", free: false, basic: true, premium: true, growth: true }
      ]
    },
    {
      category: "Advanced Features",
      features: [
        { name: "Multi-language support", free: false, basic: false, premium: true, growth: true },
        { name: "Advanced analytics", free: false, basic: false, premium: true, growth: true },
        { name: "Custom integrations", free: false, basic: false, premium: false, growth: true },
        { name: "White-label solutions", free: false, basic: false, premium: false, growth: true },
        { name: "API access", free: false, basic: false, premium: false, growth: true }
      ]
    },
    {
      category: "Support & Training",
      features: [
        { name: "Community support", free: false, basic: true, premium: true, growth: true },
        { name: "Email & chat support", free: false, basic: true, premium: true, growth: true },
        { name: "Phone support", free: false, basic: false, premium: true, growth: true },
        { name: "Dedicated account manager", free: false, basic: false, premium: false, growth: true },
        { name: "On-site training", free: false, basic: false, premium: false, growth: true }
      ]
    }
  ];

  const faqs = [
    {
      question: "What is Q-worship and how does it help our church services?",
      answer: "Q-worship is a revolutionary cloud-based church presentation platform featuring the Hands-Free Bible Companion. Our AI-powered voice navigation allows pastors to seamlessly access scriptures during live services without interrupting their flow of preaching."
    },
    {
      question: "How does the voice-activated Bible navigation actually work?",
      answer: "Simply speak the scripture reference (like 'John 3:16' or 'Psalm 23'), and our AI companion instantly navigates to the verse and displays it on screen. No clicking, scrolling, or manual searching required during your sermon."
    },
    {
      question: "Can multiple church branches use the same Q-worship account?",
      answer: "Yes! Our plans are designed for multi-branch churches. Basic supports 1-5 branches, Premium handles 6-25 branches, and our Growth plan accommodates 50+ branches with centralized management."
    },
    {
      question: "What Bible translations and languages are supported?",
      answer: "Our Basic and Premium plans include all major Bible translations (NIV, ESV, NASB, KJV, and more). Premium plans also support multi-language presentations, while Growth plans offer custom translation integration."
    },
    {
      question: "Is our church data secure and backed up in the cloud?",
      answer: "Absolutely. We use enterprise-grade security, encrypted data transmission, and automated cloud backups. Your sermons, presentations, and church data are protected with industry-leading security standards."
    },
    {
      question: "Can I migrate from our current presentation software to Q-worship?",
      answer: "Yes! We provide free migration assistance to help transfer your existing presentations, sermon notes, and media files. Our support team guides you through the entire process with minimal disruption to your services."
    }
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* Header Section */}
      <section className="relative w-full bg-[#0F1419] py-4">
        <header className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <div className="relative h-[45px] w-[46px]">
                <img
                  className="w-[43px] h-[43px]"
                  alt="Q-worship logo"
                  src="/figmaAssets/ellipse-3.svg"
                />
                <div className="absolute w-[8px] h-[8px] top-[37px] left-[37px] bg-[#fd348f] rounded-[4px]" />
              </div>
              <h1 className="ml-4 [font-family:'Lufga-Medium',Helvetica] font-bold text-white text-xl md:text-2xl lg:text-3xl">
                Q-worship
              </h1>
            </div>

            {/* Navigation */}
            <NavigationMenu className="hidden lg:flex">
              <NavigationMenuList className="flex space-x-6">
                {navItems.map((item) => (
                  <NavigationMenuItem key={item.name}>
                    <NavigationMenuLink
                      className={`[font-family:'Lufga-Medium',Helvetica] font-medium text-base hover:text-[#fd348f] transition-colors ${
                        item.isActive ? "text-[#fd348f]" : "text-white"
                      }`}
                      asChild
                    >
                      <Link 
                        href={item.name === "Home" ? "/" : `/${item.name.toLowerCase()}`}
                      >
                        {item.name}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>

            {/* CTA Buttons */}
            <div className="hidden md:flex space-x-3">
              <Link href="/signup">
                <Button
                  variant="outline"
                  className="h-12 px-6 rounded-lg bg-transparent border-white text-white [font-family:'Lufga-Medium',Helvetica] font-medium text-sm hover:bg-white hover:text-[#0F1419] transition-colors"
                >
                  Sign Up
                </Button>
              </Link>
              <Link href="/contact">
                <Button className="h-12 px-6 rounded-lg bg-[#7a5af8] text-white [font-family:'Lufga-Medium',Helvetica] font-medium text-sm hover:bg-[#6949e8] transition-colors">
                  Book Demo
                </Button>
              </Link>
            </div>
          </div>
        </header>
      </section>
      {/* Hero Section */}
      <section className="w-full bg-[#0F1419] py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 text-center">
          <h1 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-white text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight">
            Download now to start<br />
            your 7-day free trial
          </h1>
          <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-white/80 text-lg md:text-xl max-w-3xl mx-auto mb-8">
            Get full access to all premium features and see how Q-worship can transform your church services with AI-powered presentation tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-[#7a5af8] text-white px-8 py-4 rounded-lg [font-family:'Lufga-Medium',Helvetica] font-medium hover:bg-[#6949e8] transition-colors">
              Start Free Trial
            </Button>
            <Button 
              variant="outline"
              className="border-white text-[#0F1419] bg-white px-8 py-4 rounded-lg [font-family:'Lufga-Medium',Helvetica] font-medium hover:bg-[#0F1419] hover:text-white transition-colors"
            >
              Book a demo
            </Button>
          </div>
        </div>
      </section>
      {/* Pricing Section */}
      <section className="w-full from-[#6b5bd6] via-[#7c6cd8] to-[#8e7dda] py-16 bg-[#524F81]">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-white text-3xl md:text-4xl mb-6">
              Pricing to fit your needs
            </h2>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={`[font-family:'Lufga-Regular',Helvetica] font-normal text-sm ${billingPeriod === 'monthly' ? 'text-white' : 'text-white/60'}`}>
                Commitment
              </span>
              <div className="bg-white rounded-full p-1 flex">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-4 py-2 rounded-full text-sm [font-family:'Lufga-Medium',Helvetica] font-medium transition-colors ${
                    billingPeriod === 'monthly' 
                      ? 'bg-[#7a5af8] text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Monthly billing
                </button>
                <button
                  onClick={() => setBillingPeriod('yearly')}
                  className={`px-4 py-2 rounded-full text-sm [font-family:'Lufga-Medium',Helvetica] font-medium transition-colors ${
                    billingPeriod === 'yearly' 
                      ? 'bg-[#7a5af8] text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Annual billing
                </button>
              </div>
              <span className={`[font-family:'Lufga-Regular',Helvetica] font-normal text-sm ${billingPeriod === 'yearly' ? 'text-white' : 'text-white/60'}`}>
                Average yearly subscription
              </span>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <div key={index} className="bg-white rounded-3xl p-6 shadow-lg relative">
                <div className="mb-6">
                  {/* Price and Title */}
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className={`[font-family:'Lufga-Bold',Helvetica] font-bold text-4xl ${plan.titleColor}`}>
                      {plan.name}
                    </span>
                    <span className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-500 text-sm">
                      {plan.period}
                    </span>
                  </div>
                  
                  {/* Savings Badge and Monthly Equivalent */}
                  {plan.savings && (
                    <div className="mb-2 space-y-1">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs [font-family:'Lufga-Medium',Helvetica] font-medium">
                        {plan.savings}
                      </span>
                      {plan.monthlyEquivalent && (
                        <div className="text-xs text-gray-500 [font-family:'Lufga-Regular',Helvetica] font-normal">
                          Equivalent to {plan.monthlyEquivalent}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Subtitle */}
                  <h3 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-gray-900 text-lg mb-3">
                    {plan.subtitle}
                  </h3>
                  
                  {/* Description */}
                  <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 text-sm mb-6 leading-relaxed">
                    {plan.description}
                  </p>
                  
                  {/* Button */}
                  <Link href={plan.buttonText === "Book a call with us" ? "/contact" : "/contact"}>
                    <Button 
                      className={`w-full py-3 rounded-lg [font-family:'Lufga-Medium',Helvetica] font-medium transition-colors mb-6 ${plan.buttonStyle}`}
                    >
                      {plan.buttonText} →
                    </Button>
                  </Link>
                </div>

                {/* Features List */}
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 ${
                        feature.included ? 'bg-green-500' : 'bg-gray-300'
                      }`}>
                        {feature.included && (
                          <Check className="text-white w-3 h-3" />
                        )}
                      </div>
                      <span className={`[font-family:'Lufga-Regular',Helvetica] font-normal text-sm ${
                        feature.included ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Feature Comparison Table */}
      <section className="w-full bg-[#0F1419] py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-white text-3xl md:text-4xl mb-4">
              Designed with tools to support the entire team
            </h2>
            <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-white/80 text-lg max-w-3xl mx-auto">
              Compare our plans and find the perfect fit for your church's needs with comprehensive feature breakdowns.
            </p>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-4 [font-family:'Lufga-Medium',Helvetica] font-medium bg-[#524f81] text-[#ffffff]">
                      Features
                    </th>
                    <th className="text-center p-4 [font-family:'Lufga-Medium',Helvetica] font-medium bg-[#524f81] text-[#ffffff]">
                      Free
                    </th>
                    <th className="text-center p-4 [font-family:'Lufga-Medium',Helvetica] font-medium bg-[#524f81] text-[#ffffff]">
                      Basic Plan
                    </th>
                    <th className="text-center p-4 [font-family:'Lufga-Medium',Helvetica] font-medium bg-[#524f81] text-[#ffffff]">
                      Premium Plan
                    </th>
                    <th className="text-center p-4 [font-family:'Lufga-Medium',Helvetica] font-medium bg-[#524f81] text-[#ffffff]">
                      Growth Plan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((category, categoryIndex) => (
                    <React.Fragment key={categoryIndex}>
                      <tr className="bg-gray-100">
                        <td colSpan={5} className="p-4 [font-family:'Lufga-Medium',Helvetica] text-gray-900 text-sm font-semibold">
                          {category.category}
                        </td>
                      </tr>
                      {category.features.map((feature, featureIndex) => (
                        <tr key={featureIndex} className="border-b border-gray-200">
                          <td className="p-4 [font-family:'Lufga-Regular',Helvetica] font-normal text-gray-700">
                            {feature.name}
                          </td>
                          <td className="p-4 text-center">
                            {typeof feature.free === 'boolean' ? (
                              feature.free ? (
                                <div className="w-5 h-5 bg-green-500 rounded-full mx-auto"></div>
                              ) : (
                                <div className="w-5 h-5 bg-gray-300 rounded-full mx-auto"></div>
                              )
                            ) : (
                              <span className="text-sm text-gray-600">{feature.free}</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {typeof feature.basic === 'boolean' ? (
                              feature.basic ? (
                                <div className="w-5 h-5 bg-green-500 rounded-full mx-auto"></div>
                              ) : (
                                <div className="w-5 h-5 bg-gray-300 rounded-full mx-auto"></div>
                              )
                            ) : (
                              <span className="text-sm text-gray-600">{feature.basic}</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {typeof feature.premium === 'boolean' ? (
                              feature.premium ? (
                                <div className="w-5 h-5 bg-green-500 rounded-full mx-auto"></div>
                              ) : (
                                <div className="w-5 h-5 bg-gray-300 rounded-full mx-auto"></div>
                              )
                            ) : (
                              <span className="text-sm text-gray-600">{feature.premium}</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {typeof feature.growth === 'boolean' ? (
                              feature.growth ? (
                                <div className="w-5 h-5 bg-green-500 rounded-full mx-auto"></div>
                              ) : (
                                <div className="w-5 h-5 bg-gray-300 rounded-full mx-auto"></div>
                              )
                            ) : (
                              <span className="text-sm text-gray-600">{feature.growth}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
      {/* FAQ Section */}
      <section className="w-full bg-[#0F1419] py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-left mb-12">
            <h2 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-white text-3xl md:text-4xl mb-4">
              FAQs
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-600 last:border-b-0">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full py-6 text-left flex items-center justify-between hover:opacity-80 transition-opacity"
                >
                  <span className="[font-family:'Lufga-Regular',Helvetica] font-normal text-white text-lg pr-4">
                    {faq.question}
                  </span>
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-[#FFD700] rounded-full flex items-center justify-center">
                      {openFaq === index ? (
                        <ChevronUp className="text-black w-4 h-4" />
                      ) : (
                        <ChevronDown className="text-black w-4 h-4" />
                      )}
                    </div>
                  </div>
                </button>
                {openFaq === index && (
                  <div className="pb-6 -mt-2">
                    <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-300 leading-relaxed text-base">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Final CTA */}
      <section className="w-full bg-[#E8E2FF] py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <img
                className="w-16 h-16 object-contain"
                alt="Q-worship logo"
                src={qWorshipLogo}
              />
            </div>
            <h3 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-black text-2xl md:text-3xl mb-8">
              Your complete AI Bible software
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-[#7a5af8] text-white px-8 py-4 rounded-lg [font-family:'Lufga-Medium',Helvetica] font-medium hover:bg-[#6949e8] transition-colors uppercase">
                TRY IT FREE
              </Button>
              <Button 
                variant="outline"
                className="border-[#7a5af8] text-[#7a5af8] bg-white px-8 py-4 rounded-lg [font-family:'Lufga-Medium',Helvetica] font-medium hover:bg-[#7a5af8] hover:text-white transition-colors uppercase"
              >
                SEE PRICING
              </Button>
            </div>
          </div>
        </div>
      </section>
      {/* Footer */}
      <Footer />
    </div>
  );
};