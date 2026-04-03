import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
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
import { Link } from "wouter";
import Footer from "@/features/web/components/Footer";
import {
  Monitor,
  Users,
  FileText,
  RotateCcw,
  MessageSquare,
  Youtube,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  X,
  Send,
  Calendar,
  HelpCircle,
  Headphones,
  HeartHandshake,
} from "lucide-react";
import worshipImage from "@assets/Group 1171275221 1_1753809462960.png";
import globeImage from "@assets/image_1753814269268.png";

interface Policy {
  id: string;
  type: string;
  title: string;
  description?: string;
}

export default function Contact() {
  // Navigation menu items
  const navItems = [
    { name: "Home", isActive: false },
    { name: "About", isActive: false },
    { name: "Features", isActive: false },
    { name: "Pricing", isActive: false },
  ];

  // Form data states
  const [demoForm, setDemoForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    message: "",
    organizationSize: "",
    interest: "",
  });
  const [supportForm, setSupportForm] = useState({
    name: "",
    email: "",
    product: "",
    issue: "",
    description: "",
    priority: "",
  });
  const [helpForm, setHelpForm] = useState({
    name: "",
    email: "",
    topic: "",
    message: "",
    urgency: "",
  });
  const [talkForm, setTalkForm] = useState({
    name: "",
    email: "",
    phone: "",
    preferredTime: "",
    inquiry: "",
    timeSlot: "",
  });
  const [salesForm, setSalesForm] = useState({
    name: "",
    email: "",
    company: "",
    employees: "",
    requirements: "",
    timeline: "",
    budget: "",
  });
  const [partnershipForm, setPartnershipForm] = useState({
    name: "",
    email: "",
    company: "",
    type: "",
    proposal: "",
    industry: "",
  });
  const [affiliateForm, setAffiliateForm] = useState({
    name: "",
    email: "",
    website: "",
    audience: "",
    experience: "",
    platform: "",
  });
  const [mediaForm, setMediaForm] = useState({
    name: "",
    email: "",
    organization: "",
    inquiry: "",
    deadline: "",
    mediaType: "",
  });

  // Policies state for dynamic Quick Access section
  const [activePolicies, setActivePolicies] = useState<Policy[]>([]);

  // Fetch active policies for Quick Access section
  useEffect(() => {
    const fetchActivePolicies = async () => {
      try {
        const response = await fetch("/api/policies");
        if (response.ok) {
          const policies = await response.json();
          setActivePolicies(policies);
        }
      } catch (error) {
        console.error("Error fetching policies:", error);
      }
    };

    fetchActivePolicies();
  }, []);

  // Helper function to get policy type display info
  const getPolicyTypeInfo = (type: string) => {
    const typeMap: Record<string, any> = {
      privacy: {
        title: "Privacy Policy",
        icon: FileText,
        color: "#fd348f",
        gradient: "from-[#fd348f] to-[#e62d7a]",
        description: "Learn how we protect and handle your data",
        route: "/privacy-policy",
      },
      refund: {
        title: "Refund Policy",
        icon: RotateCcw,
        color: "#4ECDC4",
        gradient: "from-[#4ECDC4] to-[#45B7B8]",
        description: "Understand our refund terms and conditions",
        route: "/refund-policy",
      },
      eula: {
        title: "End User License Agreement",
        icon: MessageSquare,
        color: "#7a5af8",
        gradient: "from-[#7a5af8] to-[#6949e8]",
        description: "Review the terms of service and usage rights",
        route: "/end-user-license",
      },
      terms: {
        title: "Terms of Service",
        icon: FileText,
        color: "#ff6b6b",
        gradient: "from-[#ff6b6b] to-[#ee5a52]",
        description: "Review our terms and conditions",
        route: "/terms-of-service",
      },
      cookies: {
        title: "Cookie Policy",
        icon: MessageSquare,
        color: "#4ecdc4",
        gradient: "from-[#4ecdc4] to-[#44a08d]",
        description: "Learn about our cookie usage",
        route: "/cookie-policy",
      },
    };
    return typeMap[type] || typeMap.privacy;
  };

  // Form submission handlers
  const handleSubmit = async (formType: string, formData: any) => {
    try {
      const response = await fetch("/api/contact/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          formType: formType,
        }),
      });

      if (response.ok) {
        alert("Form submitted successfully! We will get back to you soon.");
        // Reset form based on type
        switch (formType) {
          case "demo":
            setDemoForm({
              name: "",
              email: "",
              company: "",
              phone: "",
              message: "",
              organizationSize: "",
              interest: "",
            });
            break;
          case "support":
            setSupportForm({
              name: "",
              email: "",
              product: "",
              issue: "",
              description: "",
              priority: "",
            });
            break;
          case "help":
            setHelpForm({
              name: "",
              email: "",
              topic: "",
              message: "",
              urgency: "",
            });
            break;
          case "talk":
            setTalkForm({
              name: "",
              email: "",
              phone: "",
              preferredTime: "",
              inquiry: "",
              timeSlot: "",
            });
            break;
          case "sales":
            setSalesForm({
              name: "",
              email: "",
              company: "",
              employees: "",
              requirements: "",
              timeline: "",
              budget: "",
            });
            break;
          case "partnership":
            setPartnershipForm({
              name: "",
              email: "",
              company: "",
              type: "",
              proposal: "",
              industry: "",
            });
            break;
          case "affiliate":
            setAffiliateForm({
              name: "",
              email: "",
              website: "",
              audience: "",
              experience: "",
              platform: "",
            });
            break;
          case "media":
            setMediaForm({
              name: "",
              email: "",
              organization: "",
              inquiry: "",
              deadline: "",
              mediaType: "",
            });
            break;
        }
      } else {
        throw new Error("Failed to submit form");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      alert("Failed to submit form. Please try again.");
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* Header Section */}
      <section className="relative w-full bg-[#100730] pt-4">
        <header className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between mt-[0px] mb-[0px] ml-[0px] mr-[0px] pt-[14px] pb-[14px]">
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
                        item.name === "Contact"
                          ? "text-[#fd348f]"
                          : "text-white"
                      }`}
                      asChild
                    >
                      <Link
                        href={
                          item.name === "Home"
                            ? "/"
                            : `/${item.name.toLowerCase()}`
                        }
                      >
                        {item.name}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>

            {/* Mobile Menu Button */}
            <button className="md:hidden text-white p-2">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* CTA Buttons */}
            <div className="hidden md:flex space-x-3">
              <Link href="/contact">
                <Button
                  variant="outline"
                  className="h-12 px-6 rounded-lg bg-white text-[#102865] [font-family:'Lufga-Medium',Helvetica] text-sm hover:bg-gray-50 transition-colors font-bold"
                >
                  Sign Up
                </Button>
              </Link>
              <Button className="h-12 px-6 rounded-lg bg-[#7a5af8] text-white [font-family:'Lufga-Medium',Helvetica] font-medium text-sm hover:bg-[#6949e8] transition-colors cursor-default">
                Book Demo
              </Button>
            </div>
          </div>
        </header>
      </section>
      {/* Hero Section */}
      <section className="w-full bg-[#524F81] py-32">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 text-center">
          <h1 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-4xl md:text-5xl text-white mb-4">
            Contact Us
          </h1>
          <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-xl text-white/90 max-w-2xl mx-auto">
            Get in touch with our team for support, partnerships, or any
            questions about Q-worship
          </p>
        </div>
      </section>
      {/* Main Content */}
      <section className="w-full py-20 bg-[#060608]">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-6xl mx-auto">
            {/* Customer Center */}
            <div className="group hover:scale-105 transition-all duration-300">
              <div className="bg-gradient-to-br from-[#4ECDC4]/10 to-[#4ECDC4]/5 rounded-2xl p-8 border border-[#4ECDC4]/20 h-full">
                <div className="flex items-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#4ECDC4] to-[#45B7B8] rounded-xl flex items-center justify-center mr-4 shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <Monitor className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-[#ffffff]">
                    Customer Center
                  </h2>
                </div>

                <div className="space-y-6">
                  {/* Book a Demo */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-[#4ECDC4] cursor-pointer">
                        <div className="text-[#4ECDC4] hover:text-[#45B7B8] [font-family:'Lufga-Medium',Helvetica] font-medium text-base transition-colors flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          Book a demo with our sales team.
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg lg:w-[1200px] lg:max-w-none lg:h-[800px] w-full max-h-[90vh] overflow-y-auto p-0">
                      <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
                        {/* Form Section */}
                        <div className="p-8 flex flex-col">
                          <DialogHeader className="mb-6">
                            <DialogTitle className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900 flex items-center">
                              <Calendar className="w-6 h-6 mr-3 text-[#4ECDC4]" />
                              Book a Demo
                            </DialogTitle>
                            <DialogDescription className="[font-family:'Lufga-Regular',Helvetica] text-gray-600">
                              Schedule a personalized demo with our sales team
                              to see Q-worship in action.
                            </DialogDescription>
                          </DialogHeader>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSubmit("Demo", demoForm);
                            }}
                            className="space-y-6 flex-1"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <Label
                                  htmlFor="demo-name"
                                  className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                                >
                                  Name
                                </Label>
                                <Input
                                  id="demo-name"
                                  value={demoForm.name}
                                  onChange={(e) =>
                                    setDemoForm({
                                      ...demoForm,
                                      name: e.target.value,
                                    })
                                  }
                                  required
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label
                                  htmlFor="demo-email"
                                  className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                                >
                                  Email
                                </Label>
                                <Input
                                  id="demo-email"
                                  type="email"
                                  value={demoForm.email}
                                  onChange={(e) =>
                                    setDemoForm({
                                      ...demoForm,
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
                                  htmlFor="demo-company"
                                  className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                                >
                                  Church/Organization
                                </Label>
                                <Input
                                  id="demo-company"
                                  value={demoForm.company}
                                  onChange={(e) =>
                                    setDemoForm({
                                      ...demoForm,
                                      company: e.target.value,
                                    })
                                  }
                                  required
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label
                                  htmlFor="demo-phone"
                                  className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                                >
                                  Phone
                                </Label>
                                <Input
                                  id="demo-phone"
                                  type="tel"
                                  value={demoForm.phone}
                                  onChange={(e) =>
                                    setDemoForm({
                                      ...demoForm,
                                      phone: e.target.value,
                                    })
                                  }
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div>
                                <Label className="[font-family:'Lufga-Medium',Helvetica] font-medium">
                                  Organization Size
                                </Label>
                                <Select
                                  onValueChange={(value) =>
                                    setDemoForm({
                                      ...demoForm,
                                      organizationSize: value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select size" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="small">
                                      Small (1-100 members)
                                    </SelectItem>
                                    <SelectItem value="medium">
                                      Medium (101-500 members)
                                    </SelectItem>
                                    <SelectItem value="large">
                                      Large (501-2000 members)
                                    </SelectItem>
                                    <SelectItem value="mega">
                                      Mega Church (2000+ members)
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="[font-family:'Lufga-Medium',Helvetica] font-medium">
                                  Primary Interest
                                </Label>
                                <Select
                                  onValueChange={(value) =>
                                    setDemoForm({
                                      ...demoForm,
                                      interest: value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select interest" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="presentation">
                                      Worship Presentation
                                    </SelectItem>
                                    <SelectItem value="bible">
                                      Bible Study Tools
                                    </SelectItem>
                                    <SelectItem value="multimedia">
                                      Multimedia Management
                                    </SelectItem>
                                    <SelectItem value="live-streaming">
                                      Live Streaming
                                    </SelectItem>
                                    <SelectItem value="all">
                                      All Features
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div>
                              <Label
                                htmlFor="demo-message"
                                className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                              >
                                Tell us about your needs
                              </Label>
                              <Textarea
                                id="demo-message"
                                value={demoForm.message}
                                onChange={(e) =>
                                  setDemoForm({
                                    ...demoForm,
                                    message: e.target.value,
                                  })
                                }
                                rows={3}
                                className="mt-1"
                                placeholder="What features are you most interested in?"
                              />
                            </div>
                            <Button
                              type="submit"
                              className="w-full bg-[#4ECDC4] hover:bg-[#45B7B8] text-white [font-family:'Lufga-Medium',Helvetica] font-medium mt-auto"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Schedule Demo
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

                  {/* Instant Assistance */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-[#4ECDC4] cursor-pointer">
                        <div className="text-[#4ECDC4] hover:text-[#45B7B8] [font-family:'Lufga-Medium',Helvetica] font-medium text-base transition-colors flex items-center">
                          <HelpCircle className="w-4 h-4 mr-2" />
                          Instant Assistance on all Q-worship products.
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg lg:w-[1200px] lg:max-w-none lg:h-[800px] w-full max-h-[90vh] overflow-y-auto p-0">
                      <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
                        {/* Form Section */}
                        <div className="p-8 flex flex-col">
                          <DialogHeader className="mb-6">
                            <DialogTitle className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900 flex items-center">
                              <HelpCircle className="w-6 h-6 mr-3 text-[#4ECDC4]" />
                              Instant Assistance
                            </DialogTitle>
                            <DialogDescription className="[font-family:'Lufga-Regular',Helvetica] text-gray-600">
                              Get quick help with any Q-worship product
                              questions or issues.
                            </DialogDescription>
                          </DialogHeader>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSubmit("Help", helpForm);
                            }}
                            className="space-y-4 flex-1"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <Label
                                  htmlFor="help-name"
                                  className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                                >
                                  Name
                                </Label>
                                <Input
                                  id="help-name"
                                  value={helpForm.name}
                                  onChange={(e) =>
                                    setHelpForm({
                                      ...helpForm,
                                      name: e.target.value,
                                    })
                                  }
                                  required
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label
                                  htmlFor="help-email"
                                  className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                                >
                                  Email
                                </Label>
                                <Input
                                  id="help-email"
                                  type="email"
                                  value={helpForm.email}
                                  onChange={(e) =>
                                    setHelpForm({
                                      ...helpForm,
                                      email: e.target.value,
                                    })
                                  }
                                  required
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div>
                                <Label className="[font-family:'Lufga-Medium',Helvetica] font-medium">
                                  Help Topic
                                </Label>
                                <Select
                                  onValueChange={(value) =>
                                    setHelpForm({ ...helpForm, topic: value })
                                  }
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select topic" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="bible-navigation">
                                      Bible Navigation
                                    </SelectItem>
                                    <SelectItem value="voice-commands">
                                      Voice Commands
                                    </SelectItem>
                                    <SelectItem value="setup-installation">
                                      Setup & Installation
                                    </SelectItem>
                                    <SelectItem value="presentation-tools">
                                      Presentation Tools
                                    </SelectItem>
                                    <SelectItem value="troubleshooting">
                                      Troubleshooting
                                    </SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="[font-family:'Lufga-Medium',Helvetica] font-medium">
                                  Urgency
                                </Label>
                                <Select
                                  onValueChange={(value) =>
                                    setHelpForm({ ...helpForm, urgency: value })
                                  }
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select urgency" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="low">
                                      Low - When convenient
                                    </SelectItem>
                                    <SelectItem value="medium">
                                      Medium - This week
                                    </SelectItem>
                                    <SelectItem value="high">
                                      High - Today
                                    </SelectItem>
                                    <SelectItem value="urgent">
                                      Urgent - ASAP
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div>
                              <Label
                                htmlFor="help-message"
                                className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                              >
                                How can we help?
                              </Label>
                              <Textarea
                                id="help-message"
                                value={helpForm.message}
                                onChange={(e) =>
                                  setHelpForm({
                                    ...helpForm,
                                    message: e.target.value,
                                  })
                                }
                                rows={4}
                                className="mt-1"
                                placeholder="Describe your question or issue..."
                                required
                              />
                            </div>
                            <Button
                              type="submit"
                              className="w-full bg-[#4ECDC4] hover:bg-[#45B7B8] text-white [font-family:'Lufga-Medium',Helvetica] font-medium mt-auto"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Get Help Now
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

                  {/* Customer Support */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-[#4ECDC4] cursor-pointer">
                        <div className="text-[#4ECDC4] hover:text-[#45B7B8] [font-family:'Lufga-Medium',Helvetica] font-medium text-base transition-colors flex items-center">
                          <Headphones className="w-4 h-4 mr-2" />
                          Request customer support help.
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg lg:w-[1200px] lg:max-w-none lg:h-[800px] w-full max-h-[90vh] overflow-y-auto p-0">
                      <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
                        {/* Form Section */}
                        <div className="p-8 flex flex-col">
                          <DialogHeader className="mb-6">
                            <DialogTitle className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900 flex items-center">
                              <Headphones className="w-6 h-6 mr-3 text-[#4ECDC4]" />
                              Customer Support
                            </DialogTitle>
                            <DialogDescription className="[font-family:'Lufga-Regular',Helvetica] text-gray-600">
                              Submit a detailed support request for technical
                              issues or account problems.
                            </DialogDescription>
                          </DialogHeader>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSubmit("Support", supportForm);
                            }}
                            className="space-y-4 flex-1"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <Label
                                  htmlFor="support-name"
                                  className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                                >
                                  Name
                                </Label>
                                <Input
                                  id="support-name"
                                  value={supportForm.name}
                                  onChange={(e) =>
                                    setSupportForm({
                                      ...supportForm,
                                      name: e.target.value,
                                    })
                                  }
                                  required
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label
                                  htmlFor="support-email"
                                  className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                                >
                                  Email
                                </Label>
                                <Input
                                  id="support-email"
                                  type="email"
                                  value={supportForm.email}
                                  onChange={(e) =>
                                    setSupportForm({
                                      ...supportForm,
                                      email: e.target.value,
                                    })
                                  }
                                  required
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div>
                                <Label className="[font-family:'Lufga-Medium',Helvetica] font-medium">
                                  Product/Feature
                                </Label>
                                <Select
                                  onValueChange={(value) =>
                                    setSupportForm({
                                      ...supportForm,
                                      product: value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select product" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="q-worship-basic">
                                      Q-worship Basic
                                    </SelectItem>
                                    <SelectItem value="q-worship-pro">
                                      Q-worship Pro
                                    </SelectItem>
                                    <SelectItem value="bible-companion">
                                      Bible Companion
                                    </SelectItem>
                                    <SelectItem value="voice-recognition">
                                      Voice Recognition
                                    </SelectItem>
                                    <SelectItem value="presentation-tools">
                                      Presentation Tools
                                    </SelectItem>
                                    <SelectItem value="live-streaming">
                                      Live Streaming
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="[font-family:'Lufga-Medium',Helvetica] font-medium">
                                  Issue Type
                                </Label>
                                <Select
                                  onValueChange={(value) =>
                                    setSupportForm({
                                      ...supportForm,
                                      issue: value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select issue type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="technical-bug">
                                      Technical Bug
                                    </SelectItem>
                                    <SelectItem value="account-issue">
                                      Account Issue
                                    </SelectItem>
                                    <SelectItem value="feature-request">
                                      Feature Request
                                    </SelectItem>
                                    <SelectItem value="installation">
                                      Installation Problem
                                    </SelectItem>
                                    <SelectItem value="performance">
                                      Performance Issue
                                    </SelectItem>
                                    <SelectItem value="billing">
                                      Billing Question
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div>
                              <Label className="[font-family:'Lufga-Medium',Helvetica] font-medium">
                                Priority Level
                              </Label>
                              <Select
                                onValueChange={(value) =>
                                  setSupportForm({
                                    ...supportForm,
                                    priority: value,
                                  })
                                }
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">
                                    Low - General inquiry
                                  </SelectItem>
                                  <SelectItem value="medium">
                                    Medium - Affects functionality
                                  </SelectItem>
                                  <SelectItem value="high">
                                    High - Blocks work
                                  </SelectItem>
                                  <SelectItem value="urgent">
                                    Urgent - Service down
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label
                                htmlFor="support-description"
                                className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                              >
                                Description
                              </Label>
                              <Textarea
                                id="support-description"
                                value={supportForm.description}
                                onChange={(e) =>
                                  setSupportForm({
                                    ...supportForm,
                                    description: e.target.value,
                                  })
                                }
                                rows={4}
                                className="mt-1"
                                placeholder="Please provide detailed information about your issue..."
                                required
                              />
                            </div>
                            <Button
                              type="submit"
                              className="w-full bg-[#4ECDC4] hover:bg-[#45B7B8] text-white [font-family:'Lufga-Medium',Helvetica] font-medium mt-auto"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Submit Support Request
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

                  {/* Talk with Support */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-[#4ECDC4] cursor-pointer">
                        <div className="text-[#4ECDC4] hover:text-[#45B7B8] [font-family:'Lufga-Medium',Helvetica] font-medium text-base transition-colors flex items-center">
                          <Monitor className="w-4 h-4 mr-2" />
                          Talk with Q-worship support.
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg lg:w-[1200px] lg:max-w-none lg:h-[800px] w-full max-h-[90vh] overflow-y-auto p-0">
                      <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
                        {/* Form Section */}
                        <div className="p-8 flex flex-col">
                          <DialogHeader className="mb-6">
                            <DialogTitle className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900 flex items-center">
                              <Monitor className="w-6 h-6 mr-3 text-[#4ECDC4]" />
                              Talk with Support
                            </DialogTitle>
                            <DialogDescription className="[font-family:'Lufga-Regular',Helvetica] text-gray-600">
                              Schedule a call with our support team for
                              personalized assistance.
                            </DialogDescription>
                          </DialogHeader>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSubmit("Talk", talkForm);
                            }}
                            className="space-y-4 flex-1"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <Label
                                  htmlFor="talk-name"
                                  className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                                >
                                  Name
                                </Label>
                                <Input
                                  id="talk-name"
                                  value={talkForm.name}
                                  onChange={(e) =>
                                    setTalkForm({
                                      ...talkForm,
                                      name: e.target.value,
                                    })
                                  }
                                  required
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label
                                  htmlFor="talk-email"
                                  className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                                >
                                  Email
                                </Label>
                                <Input
                                  id="talk-email"
                                  type="email"
                                  value={talkForm.email}
                                  onChange={(e) =>
                                    setTalkForm({
                                      ...talkForm,
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
                                  htmlFor="talk-phone"
                                  className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                                >
                                  Phone
                                </Label>
                                <Input
                                  id="talk-phone"
                                  type="tel"
                                  value={talkForm.phone}
                                  onChange={(e) =>
                                    setTalkForm({
                                      ...talkForm,
                                      phone: e.target.value,
                                    })
                                  }
                                  required
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label
                                  htmlFor="talk-time"
                                  className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                                >
                                  Preferred Time
                                </Label>
                                <Input
                                  id="talk-time"
                                  value={talkForm.preferredTime}
                                  onChange={(e) =>
                                    setTalkForm({
                                      ...talkForm,
                                      preferredTime: e.target.value,
                                    })
                                  }
                                  className="mt-1"
                                  placeholder="e.g., Weekday mornings"
                                />
                              </div>
                            </div>
                            <div>
                              <Label
                                htmlFor="talk-inquiry"
                                className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                              >
                                What would you like to discuss?
                              </Label>
                              <Textarea
                                id="talk-inquiry"
                                value={talkForm.inquiry}
                                onChange={(e) =>
                                  setTalkForm({
                                    ...talkForm,
                                    inquiry: e.target.value,
                                  })
                                }
                                rows={3}
                                className="mt-1"
                                placeholder="Brief description of what you need help with..."
                                required
                              />
                            </div>
                            <Button
                              type="submit"
                              className="w-full bg-[#4ECDC4] hover:bg-[#45B7B8] text-white [font-family:'Lufga-Medium',Helvetica] font-medium mt-auto"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Schedule Call
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
                </div>
              </div>
            </div>

            {/* Business & Partnership */}
            <div className="group hover:scale-105 transition-all duration-300">
              <div className="bg-gradient-to-br from-[#7a5af8]/10 to-[#7a5af8]/5 rounded-2xl p-8 border border-[#7a5af8]/20 h-full">
                <div className="flex items-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#7a5af8] to-[#6949e8] rounded-xl flex items-center justify-center mr-4 shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-[#ffffff]">
                    Business & Partnership
                  </h2>
                </div>

                <div className="space-y-6">
                  {/* Enterprise Sales */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-[#7a5af8] cursor-pointer">
                        <div className="text-[#7a5af8] hover:text-[#6949e8] [font-family:'Lufga-Medium',Helvetica] font-medium text-base transition-colors flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          Contact our sales team for enterprise solutions.
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg lg:w-[1200px] lg:max-w-none lg:h-[800px] w-full max-h-[90vh] overflow-y-auto p-0">
                      <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
                        {/* Form Section */}
                        <div className="p-8 flex flex-col">
                          <DialogHeader className="mb-6">
                            <DialogTitle className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900 flex items-center">
                              <Users className="w-6 h-6 mr-3 text-[#7a5af8]" />
                              Enterprise Sales
                            </DialogTitle>
                            <DialogDescription className="[font-family:'Lufga-Regular',Helvetica] text-gray-600">
                              Connect with our enterprise sales team for custom
                              solutions and volume pricing.
                            </DialogDescription>
                          </DialogHeader>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSubmit("Sales", salesForm);
                            }}
                            className="space-y-4 flex-1"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <Label
                                  htmlFor="sales-name"
                                  className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                                >
                                  Name
                                </Label>
                                <Input
                                  id="sales-name"
                                  value={salesForm.name}
                                  onChange={(e) =>
                                    setSalesForm({
                                      ...salesForm,
                                      name: e.target.value,
                                    })
                                  }
                                  required
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label
                                  htmlFor="sales-email"
                                  className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                                >
                                  Email
                                </Label>
                                <Input
                                  id="sales-email"
                                  type="email"
                                  value={salesForm.email}
                                  onChange={(e) =>
                                    setSalesForm({
                                      ...salesForm,
                                      email: e.target.value,
                                    })
                                  }
                                  required
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div>
                                <Label
                                  htmlFor="sales-company"
                                  className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                                >
                                  Organization
                                </Label>
                                <Input
                                  id="sales-company"
                                  value={salesForm.company}
                                  onChange={(e) =>
                                    setSalesForm({
                                      ...salesForm,
                                      company: e.target.value,
                                    })
                                  }
                                  required
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="[font-family:'Lufga-Medium',Helvetica] font-medium">
                                  Team Size
                                </Label>
                                <Select
                                  onValueChange={(value) =>
                                    setSalesForm({
                                      ...salesForm,
                                      employees: value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select team size" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1-10">
                                      1-10 staff members
                                    </SelectItem>
                                    <SelectItem value="11-50">
                                      11-50 staff members
                                    </SelectItem>
                                    <SelectItem value="51-200">
                                      51-200 staff members
                                    </SelectItem>
                                    <SelectItem value="201-500">
                                      201-500 staff members
                                    </SelectItem>
                                    <SelectItem value="500+">
                                      500+ staff members
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div>
                                <Label className="[font-family:'Lufga-Medium',Helvetica] font-medium">
                                  Implementation Timeline
                                </Label>
                                <Select
                                  onValueChange={(value) =>
                                    setSalesForm({
                                      ...salesForm,
                                      timeline: value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select timeline" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="immediate">
                                      Immediate (within 1 month)
                                    </SelectItem>
                                    <SelectItem value="short">
                                      Short-term (1-3 months)
                                    </SelectItem>
                                    <SelectItem value="medium">
                                      Medium-term (3-6 months)
                                    </SelectItem>
                                    <SelectItem value="long">
                                      Long-term (6+ months)
                                    </SelectItem>
                                    <SelectItem value="planning">
                                      Still planning
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="[font-family:'Lufga-Medium',Helvetica] font-medium">
                                  Budget Range
                                </Label>
                                <Select
                                  onValueChange={(value) =>
                                    setSalesForm({
                                      ...salesForm,
                                      budget: value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select budget range" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="under-5k">
                                      Under $5,000
                                    </SelectItem>
                                    <SelectItem value="5k-15k">
                                      $5,000 - $15,000
                                    </SelectItem>
                                    <SelectItem value="15k-50k">
                                      $15,000 - $50,000
                                    </SelectItem>
                                    <SelectItem value="50k-100k">
                                      $50,000 - $100,000
                                    </SelectItem>
                                    <SelectItem value="100k+">
                                      $100,000+
                                    </SelectItem>
                                    <SelectItem value="discuss">
                                      Prefer to discuss
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div>
                              <Label
                                htmlFor="sales-requirements"
                                className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                              >
                                Enterprise Requirements
                              </Label>
                              <Textarea
                                id="sales-requirements"
                                value={salesForm.requirements}
                                onChange={(e) =>
                                  setSalesForm({
                                    ...salesForm,
                                    requirements: e.target.value,
                                  })
                                }
                                rows={4}
                                className="mt-1"
                                placeholder="Tell us about your enterprise needs, integration requirements, volume, etc."
                                required
                              />
                            </div>
                            <Button
                              type="submit"
                              className="w-full bg-[#7a5af8] hover:bg-[#6949e8] text-white [font-family:'Lufga-Medium',Helvetica] font-medium mt-auto"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Contact Sales Team
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

                  {/* Partnership */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-[#7a5af8] cursor-pointer">
                        <div className="text-[#7a5af8] hover:text-[#6949e8] [font-family:'Lufga-Medium',Helvetica] font-medium text-base transition-colors flex items-center">
                          <HeartHandshake className="w-4 h-4 mr-2" />
                          Request for partnership.
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg lg:w-[1200px] lg:max-w-none lg:h-[800px] w-full max-h-[90vh] overflow-y-auto p-0">
                      <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
                        {/* Form Section */}
                        <div className="p-8 flex flex-col">
                          <DialogHeader className="mb-6">
                            <DialogTitle className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900 flex items-center">
                              <HeartHandshake className="w-6 h-6 mr-3 text-[#7a5af8]" />
                              Partnership Request
                            </DialogTitle>
                            <DialogDescription className="[font-family:'Lufga-Regular',Helvetica] text-gray-600">
                              Explore strategic partnerships with Q-worship to
                              grow together.
                            </DialogDescription>
                          </DialogHeader>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSubmit("Partnership", partnershipForm);
                            }}
                            className="space-y-4 flex-1"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <Label
                                  htmlFor="partnership-name"
                                  className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                                >
                                  Name
                                </Label>
                                <Input
                                  id="partnership-name"
                                  value={partnershipForm.name}
                                  onChange={(e) =>
                                    setPartnershipForm({
                                      ...partnershipForm,
                                      name: e.target.value,
                                    })
                                  }
                                  required
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label
                                  htmlFor="partnership-email"
                                  className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                                >
                                  Email
                                </Label>
                                <Input
                                  id="partnership-email"
                                  type="email"
                                  value={partnershipForm.email}
                                  onChange={(e) =>
                                    setPartnershipForm({
                                      ...partnershipForm,
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
                                  htmlFor="partnership-company"
                                  className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                                >
                                  Company
                                </Label>
                                <Input
                                  id="partnership-company"
                                  value={partnershipForm.company}
                                  onChange={(e) =>
                                    setPartnershipForm({
                                      ...partnershipForm,
                                      company: e.target.value,
                                    })
                                  }
                                  required
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label
                                  htmlFor="partnership-type"
                                  className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                                >
                                  Partnership Type
                                </Label>
                                <Input
                                  id="partnership-type"
                                  value={partnershipForm.type}
                                  onChange={(e) =>
                                    setPartnershipForm({
                                      ...partnershipForm,
                                      type: e.target.value,
                                    })
                                  }
                                  className="mt-1"
                                  placeholder="e.g., Technology, Reseller, Integration"
                                />
                              </div>
                            </div>
                            <div>
                              <Label
                                htmlFor="partnership-proposal"
                                className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                              >
                                Partnership Proposal
                              </Label>
                              <Textarea
                                id="partnership-proposal"
                                value={partnershipForm.proposal}
                                onChange={(e) =>
                                  setPartnershipForm({
                                    ...partnershipForm,
                                    proposal: e.target.value,
                                  })
                                }
                                rows={4}
                                className="mt-1"
                                placeholder="Describe your partnership idea and how we can work together..."
                                required
                              />
                            </div>
                            <Button
                              type="submit"
                              className="w-full bg-[#7a5af8] hover:bg-[#6949e8] text-white [font-family:'Lufga-Medium',Helvetica] font-medium mt-auto"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Submit Partnership Request
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

                  {/* Become an Affiliate */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-[#7a5af8] cursor-pointer">
                        <div className="text-[#7a5af8] hover:text-[#6949e8] [font-family:'Lufga-Medium',Helvetica] font-medium text-base transition-colors flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          Become an Affiliate.
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg lg:w-[1200px] lg:max-w-none lg:h-[800px] w-full max-h-[90vh] overflow-y-auto p-0">
                      <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
                        {/* Form Section */}
                        <div className="p-8 flex flex-col">
                          <DialogHeader className="mb-6">
                            <DialogTitle className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900 flex items-center">
                              <Users className="w-6 h-6 mr-3 text-[#7a5af8]" />
                              Become an Affiliate
                            </DialogTitle>
                            <DialogDescription className="[font-family:'Lufga-Regular',Helvetica] text-gray-600">
                              Join our affiliate program and earn commissions by
                              promoting Q-worship.
                            </DialogDescription>
                          </DialogHeader>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSubmit("Affiliate", affiliateForm);
                            }}
                            className="space-y-4 flex-1"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <Label
                                  htmlFor="affiliate-name"
                                  className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                                >
                                  Name
                                </Label>
                                <Input
                                  id="affiliate-name"
                                  value={affiliateForm.name}
                                  onChange={(e) =>
                                    setAffiliateForm({
                                      ...affiliateForm,
                                      name: e.target.value,
                                    })
                                  }
                                  required
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label
                                  htmlFor="affiliate-email"
                                  className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                                >
                                  Email
                                </Label>
                                <Input
                                  id="affiliate-email"
                                  type="email"
                                  value={affiliateForm.email}
                                  onChange={(e) =>
                                    setAffiliateForm({
                                      ...affiliateForm,
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
                                  htmlFor="affiliate-website"
                                  className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                                >
                                  Website/Blog
                                </Label>
                                <Input
                                  id="affiliate-website"
                                  value={affiliateForm.website}
                                  onChange={(e) =>
                                    setAffiliateForm({
                                      ...affiliateForm,
                                      website: e.target.value,
                                    })
                                  }
                                  className="mt-1"
                                  placeholder="https://yoursite.com"
                                />
                              </div>
                              <div>
                                <Label
                                  htmlFor="affiliate-audience"
                                  className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                                >
                                  Audience Size
                                </Label>
                                <Input
                                  id="affiliate-audience"
                                  value={affiliateForm.audience}
                                  onChange={(e) =>
                                    setAffiliateForm({
                                      ...affiliateForm,
                                      audience: e.target.value,
                                    })
                                  }
                                  className="mt-1"
                                  placeholder="e.g., 10K followers"
                                />
                              </div>
                            </div>
                            <div>
                              <Label
                                htmlFor="affiliate-experience"
                                className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                              >
                                Marketing Experience
                              </Label>
                              <Textarea
                                id="affiliate-experience"
                                value={affiliateForm.experience}
                                onChange={(e) =>
                                  setAffiliateForm({
                                    ...affiliateForm,
                                    experience: e.target.value,
                                  })
                                }
                                rows={4}
                                className="mt-1"
                                placeholder="Tell us about your experience with affiliate marketing, your audience, and how you plan to promote Q-worship..."
                                required
                              />
                            </div>
                            <Button
                              type="submit"
                              className="w-full bg-[#7a5af8] hover:bg-[#6949e8] text-white [font-family:'Lufga-Medium',Helvetica] font-medium mt-auto"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Join Affiliate Program
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

                  {/* Media Inquiry */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-[#7a5af8] cursor-pointer">
                        <div className="text-[#7a5af8] hover:text-[#6949e8] [font-family:'Lufga-Medium',Helvetica] font-medium text-base transition-colors flex items-center">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Media Inquiry.
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg lg:w-[1200px] lg:max-w-none lg:h-[800px] w-full max-h-[90vh] overflow-y-auto p-0">
                      <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
                        {/* Form Section */}
                        <div className="p-8 flex flex-col">
                          <DialogHeader className="mb-6">
                            <DialogTitle className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900 flex items-center">
                              <MessageSquare className="w-6 h-6 mr-3 text-[#7a5af8]" />
                              Media Inquiry
                            </DialogTitle>
                            <DialogDescription className="[font-family:'Lufga-Regular',Helvetica] text-gray-600">
                              Media professionals can request interviews, press
                              materials, or company information.
                            </DialogDescription>
                          </DialogHeader>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSubmit("Media", mediaForm);
                            }}
                            className="space-y-4 flex-1"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <Label
                                  htmlFor="media-name"
                                  className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                                >
                                  Name
                                </Label>
                                <Input
                                  id="media-name"
                                  value={mediaForm.name}
                                  onChange={(e) =>
                                    setMediaForm({
                                      ...mediaForm,
                                      name: e.target.value,
                                    })
                                  }
                                  required
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label
                                  htmlFor="media-email"
                                  className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                                >
                                  Email
                                </Label>
                                <Input
                                  id="media-email"
                                  type="email"
                                  value={mediaForm.email}
                                  onChange={(e) =>
                                    setMediaForm({
                                      ...mediaForm,
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
                                  htmlFor="media-organization"
                                  className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                                >
                                  Media Organization
                                </Label>
                                <Input
                                  id="media-organization"
                                  value={mediaForm.organization}
                                  onChange={(e) =>
                                    setMediaForm({
                                      ...mediaForm,
                                      organization: e.target.value,
                                    })
                                  }
                                  required
                                  className="mt-1"
                                  placeholder="News outlet, blog, podcast, etc."
                                />
                              </div>
                              <div>
                                <Label
                                  htmlFor="media-deadline"
                                  className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                                >
                                  Deadline
                                </Label>
                                <Input
                                  id="media-deadline"
                                  value={mediaForm.deadline}
                                  onChange={(e) =>
                                    setMediaForm({
                                      ...mediaForm,
                                      deadline: e.target.value,
                                    })
                                  }
                                  className="mt-1"
                                  placeholder="e.g., Next Friday"
                                />
                              </div>
                            </div>
                            <div>
                              <Label
                                htmlFor="media-inquiry"
                                className="[font-family:'Lufga-Medium',Helvetica] font-medium"
                              >
                                Media Inquiry
                              </Label>
                              <Textarea
                                id="media-inquiry"
                                value={mediaForm.inquiry}
                                onChange={(e) =>
                                  setMediaForm({
                                    ...mediaForm,
                                    inquiry: e.target.value,
                                  })
                                }
                                rows={4}
                                className="mt-1"
                                placeholder="What type of media coverage are you working on? What information or interviews do you need?"
                                required
                              />
                            </div>
                            <Button
                              type="submit"
                              className="w-full bg-[#7a5af8] hover:bg-[#6949e8] text-white [font-family:'Lufga-Medium',Helvetica] font-medium mt-auto"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Submit Media Inquiry
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Quick Access */}
      <section className="w-full py-20 bg-[#1f1c1c]">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-3xl md:text-4xl mb-4 text-[#ffffff]">
              Quick Access
            </h2>
            <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-lg max-w-2xl mx-auto text-[#9c9ea1]">
              Access important documents and policies in one convenient location
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {activePolicies.length > 0 ? (
              activePolicies.map((policy) => {
                const typeInfo = getPolicyTypeInfo(policy.type);
                const Icon = typeInfo.icon;
                return (
                  <Link key={policy.id} href={typeInfo.route}>
                    <div className="group cursor-pointer">
                      <div
                        className={`bg-gradient-to-br from-[${typeInfo.color}]/5 to-[${typeInfo.color}]/10 rounded-2xl p-8 text-center hover:shadow-xl transition-all duration-300 border border-[${typeInfo.color}]/10 group-hover:scale-105 h-64 flex flex-col justify-between`}
                      >
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-20 h-20 bg-gradient-to-br ${typeInfo.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 mb-6`}
                          >
                            <Icon className="w-10 h-10 text-white" />
                          </div>
                          <h3
                            className={`[font-family:'Lufga-Bold',Helvetica] font-bold text-xl mb-2`}
                            style={{ color: typeInfo.color }}
                          >
                            {policy.title}
                          </h3>
                        </div>
                        <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-sm text-[#9a9b9c] mt-auto">
                          {policy.description || typeInfo.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              // Fallback to default static policies if no dynamic policies are available
              <>
                {/* Privacy Policy */}
                <Link href="/privacy-policy">
                  <div className="group cursor-pointer">
                    <div className="bg-gradient-to-br from-[#fd348f]/5 to-[#fd348f]/10 rounded-2xl p-8 text-center hover:shadow-xl transition-all duration-300 border border-[#fd348f]/10 group-hover:scale-105 h-64 flex flex-col justify-between">
                      <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-[#fd348f] to-[#e62d7a] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 mb-6">
                          <FileText className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-xl mb-2 text-[#f43186]">
                          Privacy Policy
                        </h3>
                      </div>
                      <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-sm text-[#9a9b9c] mt-auto">
                        Learn how we protect and handle your data
                      </p>
                    </div>
                  </div>
                </Link>

                {/* Refund Policy */}
                <Link href="/refund-policy">
                  <div className="group cursor-pointer">
                    <div className="bg-gradient-to-br from-[#4ECDC4]/5 to-[#4ECDC4]/10 rounded-2xl p-8 text-center hover:shadow-xl transition-all duration-300 border border-[#4ECDC4]/10 group-hover:scale-105 h-64 flex flex-col justify-between">
                      <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-[#4ECDC4] to-[#45B7B8] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 mb-6">
                          <RotateCcw className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-xl mb-2 text-[#4cc8c1]">
                          Refund Policy
                        </h3>
                      </div>
                      <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-sm text-[#9c9a9a] mt-auto">
                        Understand our refund terms and conditions
                      </p>
                    </div>
                  </div>
                </Link>

                {/* End User License Agreement */}
                <Link href="/end-user-license">
                  <div className="group cursor-pointer">
                    <div className="bg-gradient-to-br from-[#7a5af8]/5 to-[#7a5af8]/10 rounded-2xl p-8 text-center hover:shadow-xl transition-all duration-300 border border-[#7a5af8]/10 group-hover:scale-105 h-64 flex flex-col justify-between">
                      <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-[#7a5af8] to-[#6949e8] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 mb-6">
                          <MessageSquare className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-xl mb-2 text-[#7151ef]">
                          End User License Agreement
                        </h3>
                      </div>
                      <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-sm text-[#9b9c9e] mt-auto">
                        Review the terms of service and usage rights
                      </p>
                    </div>
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
      {/* Follow us on */}
      <section className="w-full bg-gradient-to-br from-gray-50 to-white py-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 text-center">
          <h2 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-3xl text-gray-900 mb-4">
            Follow us on:
          </h2>
          <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-lg text-gray-600 mb-12 max-w-xl mx-auto">
            Stay connected with Q-worship community across all social platforms
          </p>

          <div className="flex justify-center space-x-6">
            <a href="#" className="group">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <Youtube className="w-8 h-8 text-white" />
              </div>
            </a>
            <a href="#" className="group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <Facebook className="w-8 h-8 text-white" />
              </div>
            </a>
            <a href="#" className="group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl flex items-center justify-center hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <Instagram className="w-8 h-8 text-white" />
              </div>
            </a>
            <a href="#" className="group">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-black rounded-2xl flex items-center justify-center hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <Twitter className="w-8 h-8 text-white" />
              </div>
            </a>
            <a href="#" className="group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <Linkedin className="w-8 h-8 text-white" />
              </div>
            </a>
          </div>
        </div>
      </section>
      {/* Footer */}
      <Footer />
    </div>
  );
}
