export interface HelpArticle {
  id: string;
  title: string;
  description: string;
  category: string;
  readTime?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  content: string;
  tags?: string[];
  helpful?: number;
  notHelpful?: number;
}

export const articleMap: { [key: string]: HelpArticle } = {
  'getting-started': {
    id: 'getting-started',
    title: 'Getting Started with Q-worship',
    description: 'Tips to help you get started with Q-worship platform and features.',
    category: 'presentations',
    readTime: '5 min read',
    difficulty: 'beginner',
    content: `## Welcome to Q-worship

Q-worship is a comprehensive church presentation platform designed to streamline your worship services with advanced digital tools and AI-powered features.

### Quick Start Guide

#### 1. Create Your First Presentation
- Click the **Project** menu in the top navigation
- Select **New** → **New Presentation**
- Enter a name for your service (e.g., "Sunday Service")
- Choose your service date

#### 2. Add Content to Your Service
- Use **Insert Item** menu to add:
  - **Songs** from your songbook or library
  - **Bible verses** with the Hands-Free Bible Companion
  - **Images and videos** from your media assets
  - **Announcements** and custom slides

#### 3. Organize Your Service Flow
Your presentation is divided into sections:
- **PRE-SERVICE ITEMS**: Background music, announcements
- **WARM-UP**: Opening songs, welcome messages
- **SERVICE ITEMS**: Main worship songs, sermon content
- **POST SERVICE LOOP**: Closing music, final messages

#### 4. Go Live with Your Presentation
- Click the **GO LIVE** button to launch full-screen presentation
- Use presenter controls to navigate slides
- Enable the Hands-Free Bible Companion for voice navigation

### Key Features
- **AI-Powered Bible Navigation**: Voice commands for scripture
- **Dynamic Backgrounds**: Customize slide backgrounds in real-time
- **Media Asset Management**: Organize all your visual content
- **Multi-Tab Presentation**: Independent presenter and audience views
- **Auto-Save**: Your work is automatically saved as you create

### Need More Help?
Explore other articles in this help center or contact our support team for personalized assistance.`,
    tags: ['getting-started', 'basics', 'tutorial']
  },
  'example-presentation': {
    id: 'example-presentation',
    title: 'Example Presentation Walkthrough',
    description: 'An example church service presentation with content, images and backgrounds.',
    category: 'presentations',
    readTime: '8 min read',
    difficulty: 'beginner',
    content: `## Sample Sunday Service Presentation

This example walks you through creating a complete Sunday service presentation with all the elements you need.

### Service Structure Overview

#### PRE-SERVICE (15 minutes before start)
- **Background Music**: Soft instrumental worship music
- **Welcome Slide**: Service information and announcements
- **Connection Card**: Encourage visitor information

#### WARM-UP (Service Opening)
- **Welcome Message**: Pastor or worship leader greeting
- **Opening Prayer**: Call to worship
- **Announcements**: Important church updates

#### SERVICE ITEMS (Main Service)
- **Opening Worship Set**:
  - "How Great is Our God" - Full song with lyrics
  - "Mighty to Save" - Bridge and chorus focus
  - "Amazing Grace" - Traditional with modern arrangement

- **Scripture Reading**: 
  - Use Hands-Free Bible Companion for Psalm 23
  - Voice command: "Navigate to Psalm 23 verse 1"

- **Sermon Series**: "Walking in Faith"
  - Title slide with series branding
  - Key verse: Hebrews 11:1
  - Sermon points as bullet slides

- **Closing Worship**:
  - "Blessed Be Your Name" - Reflective worship
  - **Altar Call**: Invitation slide with soft background

#### POST SERVICE LOOP
- **Fellowship Time**: Encourage connection
- **Next Week Preview**: Upcoming series or events
- **Closing Music**: Peaceful instrumental

### Visual Elements Used
- **Dynamic Backgrounds**: Gradient overlays for worship songs
- **Media Assets**: Church logo, series graphics, nature backgrounds
- **Typography**: Clear, readable fonts with high contrast
- **Color Scheme**: Consistent purple and gold church branding

### Technical Setup
- **Live Settings**: Presenter view with slide navigation
- **Background Sync**: Real-time updates between dashboard and live view
- **Voice Commands**: Bible navigation without touching controls
- **Auto-Advance**: Timed slide transitions for announcements

### Best Practices Demonstrated
- **Consistent Branding**: Church colors and fonts throughout
- **Readable Text**: High contrast, appropriate font sizes
- **Smooth Transitions**: Professional slide changes
- **Backup Plans**: Alternative content ready if needed

This example shows how Q-worship's features work together to create a seamless worship experience.`,
    tags: ['example', 'tutorial', 'sample', 'walkthrough']
  },
  'record-sermons': {
    id: 'record-sermons',
    title: 'How to Record Sermons',
    description: 'Instructions on how to record and edit your sermons about your scriptures.',
    category: 'technical',
    readTime: '10 min read',
    difficulty: 'intermediate',
    content: `## Recording and Managing Sermons in Q-worship

Learn how to effectively record, organize, and integrate sermon content into your presentations.

### Setting Up Sermon Recording

#### Audio Recording Setup
1. **Microphone Configuration**
   - Use a quality USB or XLR microphone
   - Position 6-8 inches from speaker
   - Test audio levels before service

2. **Recording Software Integration**
   - Q-worship supports direct audio capture
   - Compatible with OBS Studio for advanced recording
   - Automatic sync with presentation slides

#### Video Recording Options
- **Screen + Audio**: Capture presentation with sermon audio
- **Multi-Camera**: Add speaker video feed
- **Slide-Only**: Just the presentation content with audio

### During the Sermon

#### Live Recording Features
- **One-Click Recording**: Start/stop from presenter view
- **Automatic Markers**: Slide changes create chapter points
- **Real-Time Monitoring**: Audio level indicators
- **Backup Recording**: Simultaneous local and cloud storage

#### Scripture Integration
- **Bible Companion Sync**: Voice commands are recorded
- **Verse Highlights**: Automatic scripture references
- **Text Overlay**: Bible verses appear in recording

### Post-Sermon Processing

#### Automatic Editing Features
- **Noise Reduction**: Clean background audio
- **Volume Normalization**: Consistent audio levels
- **Silence Trimming**: Remove long pauses
- **Chapter Creation**: Based on slide transitions

#### Manual Editing Options
- **Trim Beginning/End**: Clean up intro and closing
- **Add Intro/Outro**: Church branding and announcements
- **Insert Graphics**: Lower thirds, scripture references
- **Multi-Format Export**: MP3 audio, MP4 video, podcast formats

### Distribution and Sharing

#### Built-in Publishing
- **Church Website**: Direct upload to your site
- **Podcast Platforms**: Automatic RSS feed generation
- **Social Media**: Formatted clips for sharing
- **Email Integration**: Send to church mailing list

#### Analytics and Engagement
- **View Tracking**: Monitor sermon reach
- **Scripture Lookup**: Track most referenced verses
- **Download Statistics**: Popular content identification
- **Feedback Collection**: Congregation response system

### Best Practices

#### Technical Preparation
- **Sound Check**: Test all equipment before service
- **Backup Systems**: Multiple recording methods
- **Storage Planning**: Ensure sufficient space
- **Network Stability**: Reliable internet for cloud backup

#### Content Organization
- **Naming Convention**: Date, series, topic structure
- **Tagging System**: Scripture references, themes, series
- **Sermon Series**: Group related messages together
- **Archive Management**: Long-term storage strategy

#### Quality Assurance
- **Audio Quality**: Clear, professional sound
- **Video Sync**: Properly aligned audio and visual
- **Metadata**: Complete service information
- **Accessibility**: Captions and transcripts available

This comprehensive recording system ensures your sermons reach your congregation and beyond with professional quality.`,
    tags: ['recording', 'sermons', 'audio', 'technical']
  },
  'onscreen-bible': {
    id: 'onscreen-bible',
    title: 'How to Create On-Screen Bible',
    description: 'Create and fully show the Bible verse in a new readable format with scriptures.',
    category: 'bible-companion',
    readTime: '7 min read',
    difficulty: 'beginner',
    content: `## Creating Professional On-Screen Bible Displays

Learn how to effectively display scripture during your worship services with Q-worship's Hands-Free Bible Companion.

### Hands-Free Bible Companion Overview

The AI-powered Bible widget allows you to:
- **Voice Navigation**: Speak scripture references to navigate
- **Multiple Translations**: ESV, NIV, NKJV, KJV available
- **Responsive Design**: Adapts to any screen size
- **Live Positioning**: Drag and drop anywhere on screen

### Setting Up Bible Display

#### Initial Configuration
1. **Access Bible Companion**
   - Click **Insert Item** → **Hands-Free Bible**
   - Widget appears with default styling
   - Position anywhere on your presentation

2. **Translation Selection**
   - Choose from available translations
   - **ESV**: English Standard Version (default)
   - **NIV**: New International Version
   - **NKJV**: New King James Version
   - **KJV**: King James Version

3. **Display Customization**
   - **Font Size**: Adjustable for different screen distances
   - **Background**: Transparent or solid overlay options
   - **Text Color**: High contrast options for readability
   - **Position**: Draggable to optimal screen location

### Voice Command Navigation

#### Basic Commands
- **"Navigate to John 3:16"** - Go to specific verse
- **"Show Psalm 23"** - Display entire chapter
- **"Next verse"** - Advance to following verse
- **"Previous verse"** - Go back one verse
- **"Close Bible"** - Hide the display

#### Advanced Navigation
- **"Show John 3:16 through 18"** - Display verse range
- **"Find love in John"** - Search within book
- **"Compare translations"** - Side-by-side view
- **"Bookmark this verse"** - Save for later reference

### Visual Presentation Best Practices

#### Readability Guidelines
- **Font Size**: Minimum 24pt for audience viewing
- **Contrast**: Dark text on light background or vice versa
- **Positioning**: Upper third of screen for best visibility
- **Duration**: Allow 15-20 seconds per verse for reading

#### Integration with Service Flow
- **Pre-planned Verses**: Set up key scriptures in advance
- **Sermon Support**: Quick access to referenced passages
- **Worship Integration**: Display scripture-based song themes
- **Prayer Moments**: Show verses during prayer time

### Advanced Features

#### Multi-Translation Display
- **Split Screen**: Compare different translations
- **Verse Study**: Show original Greek/Hebrew meanings
- **Cross References**: Related scripture suggestions
- **Study Notes**: Contextual biblical information

#### Interactive Elements
- **Highlighting**: Emphasize key phrases or words
- **Annotations**: Add pastor notes or explanations
- **Zoom Function**: Focus on specific text portions
- **Print/Save**: Create take-home scripture cards

### Technical Considerations

#### Performance Optimization
- **Preload Common Verses**: Faster access to frequently used scriptures
- **Cache Translations**: Reduce loading time
- **Voice Recognition**: Calibrate for optimal accuracy
- **Network Backup**: Offline access to core translations

#### Troubleshooting
- **Voice Not Recognized**: Speak clearly and pause between commands
- **Display Issues**: Check screen resolution and scaling
- **Translation Loading**: Verify internet connection
- **Position Problems**: Use manual drag controls as backup

### Creating Engaging Scripture Presentations

#### Timing and Flow
- **Smooth Transitions**: Fade in/out for professional appearance
- **Reading Pace**: Allow congregation time to absorb content
- **Interactive Moments**: Encourage congregation reading along
- **Visual Cues**: Use highlighting or animation sparingly

#### Worship Integration
- **Song Connections**: Display verses that inspired worship songs
- **Themed Services**: Scripture series for special events
- **Call and Response**: Interactive scripture reading
- **Meditation Moments**: Extended verse display for reflection

This powerful tool transforms scripture presentation from static slides to dynamic, accessible Bible engagement.`,
    tags: ['bible', 'scripture', 'display', 'hands-free']
  },
  'sermon-slides': {
    id: 'sermon-slides',
    title: 'How to Create Sermon Slides',
    description: 'Live create content for all sermon content with dynamic scripture integration.',
    category: 'presentations',
    readTime: '12 min read',
    difficulty: 'intermediate',
    content: `## Creating Dynamic Sermon Slides

Master the art of creating compelling sermon presentations that engage your congregation and support your message.

### Sermon Slide Foundation

#### Planning Your Visual Flow
- **Introduction Slides**: Series branding, sermon title, key theme
- **Main Points**: Clear, concise bullet points or statements  
- **Scripture Support**: Integrated Bible verses with context
- **Illustrations**: Stories, examples, and visual metaphors
- **Application**: Practical takeaways and action steps
- **Conclusion**: Summary and call to action

#### Design Principles
- **Consistency**: Uniform fonts, colors, and layout structure
- **Readability**: High contrast text, appropriate font sizes
- **Simplicity**: One main idea per slide, minimal text
- **Visual Hierarchy**: Important information stands out clearly

### Content Creation Workflow

#### Sermon Preparation Integration
1. **Outline Import**: Transfer sermon notes to slide structure
2. **Scripture Integration**: Use Hands-Free Bible Companion for verses
3. **Illustration Planning**: Identify visual support needs
4. **Timing Consideration**: Plan slide duration and transitions

#### Dynamic Content Features
- **Live Text Editing**: Modify slides during presentation
- **Real-Time Scripture**: Add Bible verses on-the-fly
- **Flexible Ordering**: Rearrange slides based on service flow
- **Backup Content**: Alternative slides ready for different scenarios

### Advanced Slide Techniques

#### Multi-Media Integration
- **Background Videos**: Subtle motion for visual interest
- **Image Overlays**: Relevant photography with text overlay
- **Audio Clips**: Sound effects or music cues
- **Interactive Elements**: Polls, questions, or responses

#### Scripture Presentation Methods
- **Progressive Revelation**: Verses appear line by line
- **Comparison Views**: Multiple translations side-by-side  
- **Context Display**: Surrounding verses for better understanding
- **Cross-Reference Links**: Related scriptures automatically suggested

#### Visual Storytelling
- **Metaphor Graphics**: Visual representations of concepts
- **Timeline Presentations**: Historical or prophetic sequences
- **Process Diagrams**: Step-by-step spiritual principles
- **Before/After**: Transformation illustrations

### Live Sermon Delivery

#### Presenter Tools
- **Slide Navigator**: Quick access to any slide in sequence
- **Notes Integration**: Personal sermon notes visible only to presenter
- **Timer Display**: Track sermon length and section timing
- **Backup Navigation**: Manual controls if voice commands fail

#### Audience Engagement Features
- **Interactive Questions**: Display discussion prompts
- **Fill-in-the-Blank**: Congregation participation slides
- **Response Moments**: Silent reflection or prayer slides
- **Take-Home Content**: Screenshots or handout generation

#### Spontaneous Content
- **Blank Slide Option**: Create new content during sermon
- **Voice-to-Text**: Speak content that appears on screen
- **Quick Scripture**: Instant Bible verse lookup and display
- **Annotation Tools**: Highlight or circle important elements

### Technical Excellence

#### Slide Transitions
- **Smooth Fading**: Professional between-slide movement
- **Directional Slides**: Left/right for sequential content
- **Zoom Effects**: Focus attention on specific elements
- **Custom Timing**: Automatic or manual advance options

#### Performance Optimization
- **Preload Content**: All slides ready before service
- **Image Compression**: Fast loading without quality loss
- **Font Embedding**: Consistent appearance across devices
- **Backup Systems**: Local storage with cloud synchronization

### Content Categories and Templates

#### Expository Preaching
- **Verse-by-Verse**: Sequential scripture examination
- **Word Studies**: Original language exploration
- **Historical Context**: Cultural and historical background
- **Application Framework**: Modern relevance structure

#### Topical Messages
- **Theme Development**: Central concept with supporting points
- **Cross-Reference System**: Multiple scripture connections
- **Illustration Integration**: Stories and examples woven throughout
- **Action-Oriented**: Clear next steps for congregation

#### Seasonal and Special Events
- **Holiday Themes**: Easter, Christmas, special occasions
- **Church Calendar**: Advent, Lent, Pentecost presentations
- **Community Events**: Baptisms, dedications, celebrations
- **Outreach Messages**: Evangelistic and guest-friendly content

### Quality Assurance

#### Pre-Service Testing
- **Slide Review**: Check all content for accuracy and flow
- **Technical Check**: Test all media elements and transitions
- **Backup Verification**: Ensure all fallback options work
- **Team Coordination**: Brief all service participants on content

#### During Service Monitoring
- **Slide Timing**: Watch congregation reading pace
- **Technical Issues**: Quick resolution of display problems
- **Content Flexibility**: Adapt to Holy Spirit moments
- **Engagement Tracking**: Notice congregation response levels

This comprehensive approach ensures your sermon slides enhance rather than distract from your biblical message delivery.`,
    tags: ['sermons', 'slides', 'presentation', 'preaching']
  }
};
