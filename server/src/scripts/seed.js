const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Project = require('../models/Project');

const seedUsers = [
  {
    name: 'Admin User',
    email: 'admin@growthvalley.com',
    password: 'admin123',
    role: 'admin',
    specialization: 'Administration',
    availability: 'available'
  },
  {
    name: 'John Smith',
    email: 'marketer@growthvalley.com',
    password: 'marketer123',
    role: 'performance_marketer',
    specialization: 'Facebook Ads, Google Ads',
    availability: 'available'
  },
  {
    name: 'Emily Writer',
    email: 'content@growthvalley.com',
    password: 'content123',
    role: 'content_writer',
    specialization: 'Copywriting, Script Writing',
    availability: 'available'
  },
  {
    name: 'Sarah Wilson',
    email: 'uiux@growthvalley.com',
    password: 'uiux123',
    role: 'ui_ux_designer',
    specialization: 'UI Design, UX Research',
    availability: 'available'
  },
  {
    name: 'Mike Johnson',
    email: 'graphic@growthvalley.com',
    password: 'graphic123',
    role: 'graphic_designer',
    specialization: 'Brand Design, Social Media Graphics',
    availability: 'busy'
  },
  {
    name: 'Alex Chen',
    email: 'developer@growthvalley.com',
    password: 'developer123',
    role: 'developer',
    specialization: 'React, Node.js',
    availability: 'available'
  },
  {
    name: 'Lisa Brown',
    email: 'tester@growthvalley.com',
    password: 'tester123',
    role: 'tester',
    specialization: 'QA Testing, Automation',
    availability: 'available'
  },
  {
    name: 'David Lee',
    email: 'marketer2@growthvalley.com',
    password: 'marketer123',
    role: 'performance_marketer',
    specialization: 'SEO, Content Marketing',
    availability: 'available'
  },
  {
    name: 'Emma Davis',
    email: 'uiux2@growthvalley.com',
    password: 'uiux123',
    role: 'ui_ux_designer',
    specialization: 'Mobile Design, Prototyping',
    availability: 'offline'
  }
];

const seedProjects = [
  {
    projectName: 'TechStart Landing Page',
    customerName: 'John Tech',
    businessName: 'TechStart Inc.',
    mobile: '+1 555-0101',
    email: 'john@techstart.com',
    industry: 'Technology',
    description: 'A SaaS startup needing a high-converting landing page for their new product launch.',
    budget: 15000,
    timeline: {
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-03-15')
    },
    isActive: true,
    status: 'active'
  },
  {
    projectName: 'FitLife Campaign',
    customerName: 'Maria Fitness',
    businessName: 'FitLife Solutions',
    mobile: '+1 555-0102',
    email: 'maria@fitlife.com',
    industry: 'Health & Fitness',
    description: 'Fitness coaching business launching an online program with sales funnel.',
    budget: 8000,
    timeline: {
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-04-01')
    },
    isActive: true,
    status: 'active'
  },
  {
    projectName: 'EcoHome Services',
    customerName: 'Robert Green',
    businessName: 'EcoHome Solutions',
    mobile: '+1 555-0103',
    email: 'robert@ecohome.com',
    industry: 'Home Services',
    description: 'Eco-friendly home services company needing lead generation funnel.',
    budget: 12000,
    timeline: {
      startDate: new Date('2024-01-20'),
      endDate: new Date('2024-04-20')
    },
    isActive: false,
    status: 'paused'
  }
];

const seedDatabase = async () => {
  try {
    const atlasUri = process.env.MONGODB_URI;
    const localUri = 'mongodb://localhost:27017/growth-valley';

    // Try Atlas first, then fall back to local MongoDB (same as database.js)
    const uris = atlasUri ? [atlasUri, localUri] : [localUri];

    let connected = false;
    for (const uri of uris) {
      try {
        await mongoose.connect(uri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        const isAtlas = uri.includes('mongodb+srv');
        console.log(`Connected to ${isAtlas ? 'MongoDB Atlas' : 'Local MongoDB'}`);
        connected = true;
        break;
      } catch (error) {
        const isAtlas = uri.includes('mongodb+srv');
        console.log(`Failed to connect to ${isAtlas ? 'MongoDB Atlas' : 'Local MongoDB'}: ${error.message}`);
        if (isAtlas) {
          console.log('Trying local MongoDB as fallback...');
        }
      }
    }

    if (!connected) {
      console.error('Could not connect to any MongoDB instance');
      process.exit(1);
    }

    // Clear existing data
    await User.deleteMany({});
    await Project.deleteMany({});
    console.log('Cleared existing users and projects');

    // Create users
    const createdUsers = {};
    for (const userData of seedUsers) {
      const user = await User.create(userData);
      createdUsers[userData.role === 'performance_marketer' && !createdUsers['performance_marketer'] ? 'performance_marketer' : userData.email] = user;
      console.log(`Created user: ${user.email} (${user.role})`);
    }

    // Store user references
    const pmUser = createdUsers['marketer@growthvalley.com'] || createdUsers['performance_marketer'];
    const pmUser2 = createdUsers['marketer2@growthvalley.com'];
    const uiuxUser = createdUsers['uiux@growthvalley.com'];
    const uiuxUser2 = createdUsers['uiux2@growthvalley.com'];
    const graphicUser = createdUsers['graphic@growthvalley.com'];
    const developerUser = createdUsers['developer@growthvalley.com'];
    const testerUser = createdUsers['tester@growthvalley.com'];
    const adminUser = createdUsers['admin@growthvalley.com'];

    // Create projects with team assignments
    for (const projectData of seedProjects) {
      const project = await Project.create({
        ...projectData,
        createdBy: adminUser._id,
        assignedTeam: {
          performanceMarketer: pmUser._id,
          uiUxDesigner: uiuxUser._id,
          graphicDesigner: graphicUser._id,
          developer: developerUser._id,
          tester: testerUser._id
        },
        stages: {
          onboarding: {
            isCompleted: true,
            completedAt: new Date()
          },
          marketResearch: {
            isCompleted: projectData.status === 'paused' ? false : true,
            completedAt: projectData.status === 'paused' ? undefined : new Date()
          },
          offerEngineering: {
            isCompleted: false
          },
          trafficStrategy: {
            isCompleted: false
          },
          landingPage: {
            isCompleted: false
          },
          creativeStrategy: {
            isCompleted: false
          }
        }
      });

      // Calculate progress
      project.calculateProgress();
      await project.save();

      console.log(`Created project: ${project.projectName || project.businessName}`);
    }

    console.log('\n✅ Database seeded successfully!');
    console.log('\nYou can now login with:');
    console.log('  Admin: admin@growthvalley.com / admin123');
    console.log('  Performance Marketer: marketer@growthvalley.com / marketer123');
    console.log('  Content Creator: content@growthvalley.com / content123');
    console.log('  UI/UX Designer: uiux@growthvalley.com / uiux123');
    console.log('  Graphic Designer: graphic@growthvalley.com / graphic123');
    console.log('  Developer: developer@growthvalley.com / developer123');
    console.log('  Tester: tester@growthvalley.com / tester123');
    console.log('\nAdditional Performance Marketer: marketer2@growthvalley.com / marketer123');
    console.log('Additional UI/UX Designer: uiux2@growthvalley.com / uiux123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();