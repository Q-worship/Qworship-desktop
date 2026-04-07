import { Request, Response } from 'express';
import { HelpArticle, FAQ, ResourceLink, SupportTicket } from './help.model.js';

export const getHelpArticles = async (req: Request, res: Response) => {
  try {
    const articles = await HelpArticle.find({ isPublished: true }).sort({ createdAt: -1 });
    res.json({ articles: articles.map(a => ({
      id: a._id,
      title: a.title,
      slug: a.slug,
      description: a.description,
      content: a.content,
      category: a.category,
      readTime: a.readTime,
      difficulty: a.difficulty,
      tags: a.tags,
      helpful: a.helpful,
      notHelpful: a.notHelpful
    })) });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getHelpArticleBySlug = async (req: Request, res: Response) => {
  try {
    const article = await HelpArticle.findOne({ slug: req.params.slug, isPublished: true });
    if (!article) return res.status(404).json({ message: 'Article not found' });
    
    res.json({ article: {
      id: article._id,
      title: article.title,
      slug: article.slug,
      description: article.description,
      content: article.content,
      category: article.category,
      readTime: article.readTime,
      difficulty: article.difficulty,
      tags: article.tags,
      helpful: article.helpful,
      notHelpful: article.notHelpful
    }});
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getFAQs = async (req: Request, res: Response) => {
  try {
    const faqs = await FAQ.find({ isPublished: true }).sort({ createdAt: -1 });
    res.json({ faqs: faqs.map(f => ({
      id: f._id,
      question: f.question,
      answer: f.answer,
      category: f.category,
      helpful: f.helpful,
      notHelpful: f.notHelpful
    })) });
  } catch (error) {
    console.error('Error fetching faqs:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getResources = async (req: Request, res: Response) => {
  try {
    const resources = await ResourceLink.find({ isPublished: true }).sort({ createdAt: -1 });
    res.json({ resources: resources.map(r => ({
      id: r._id,
      title: r.title,
      description: r.description,
      url: r.url,
      category: r.category,
      icon: r.icon
    })) });
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const submitSupportTicket = async (req: Request, res: Response) => {
  try {
    const { subject, message, priority, category } = req.body;
    const userId = (req as any).user._id;

    const newTicket = new SupportTicket({
      subject,
      message,
      priority,
      category,
      submittedBy: userId
    });

    await newTicket.save();
    
    res.status(201).json({ success: true, message: 'Support ticket submitted successfully. We will be in touch soon.' });
  } catch (error) {
    console.error('Error submitting ticket:', error);
    res.status(500).json({ message: 'Failed to submit support ticket' });
  }
};

export const seedHelpData = async (req: Request, res: Response) => {
  try {
    // Only allow if empty to prevent duplicates
    const count = await HelpArticle.countDocuments();
    if (count > 0) return res.status(400).json({ message: 'Already seeded' });

    await HelpArticle.create({
      title: "Getting Started with Q-worship",
      slug: "getting-started",
      description: "Learn the basics of setting up your first presentation.",
      content: "Welcome to Q-worship! Here is how to create a presentation...",
      category: "getting-started",
      readTime: "5 min",
      difficulty: "Beginner",
      tags: ["basics", "onboarding"]
    });

    await FAQ.create({
      question: "How do I reset my password?",
      answer: "Go to settings and click reset.",
      category: "billing"
    });

    await ResourceLink.create({
      title: "Video Tutorials",
      description: "Watch comprehensive unlisted tutorials.",
      url: "https://youtube.com/qworship",
      category: "guides",
      icon: "Video"
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'error seeding' });
  }
};
