import React from 'react';
import { 
  LayoutDashboard, 
  Lightbulb, 
  Kanban, 
  BarChart3, 
  Plus, 
  Search, 
  MoreHorizontal, 
  MessageSquare,
  TrendingUp,
  Leaf,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Link,
  Unlink,
  Globe,
  Bot,
  ArrowLeft,
  Image,
  FileVideo,
  FileText,
  Upload,
  Save,
  Trash2,
  Edit,
  MapPin,
  X,
  Users,
  LogOut,
  Lock,
  Settings,
  Smartphone,
  ThumbsUp,
  ThumbsDown,
  Send,
  Archive
} from 'lucide-react';
import { Idea, Campaign, IdeaStatus, Priority, User } from './types';

export const ICONS = {
  Dashboard: <LayoutDashboard size={20} />,
  Ideas: <Lightbulb size={20} />,
  Pipeline: <Kanban size={20} />,
  Campaigns: <BarChart3 size={20} />,
  Add: <Plus size={16} />,
  Search: <Search size={18} />,
  More: <MoreHorizontal size={16} />,
  Comment: <MessageSquare size={14} />,
  Trending: <TrendingUp size={20} />,
  Brand: <Leaf size={24} />,
  Calendar: <Calendar size={16} />,
  Success: <CheckCircle2 size={16} />,
  Pending: <Clock size={16} />,
  Alert: <AlertCircle size={16} />,
  Link: <Link size={14} />,
  Unlink: <Unlink size={14} />,
  Globe: <Globe size={20} />,
  AI: <Bot size={20} />,
  Back: <ArrowLeft size={20} />,
  Image: <Image size={20} />,
  Video: <FileVideo size={20} />,
  File: <FileText size={20} />,
  Upload: <Upload size={16} />,
  Save: <Save size={16} />,
  Delete: <Trash2 size={16} />,
  Edit: <Edit size={16} />,
  Location: <MapPin size={14} />,
  Close: <X size={16} />,
  Users: <Users size={20} />,
  LogOut: <LogOut size={16} />,
  Lock: <Lock size={16} />,
  Settings: <Settings size={20} />,
  Smartphone: <Smartphone size={18} />,
  ThumbsUp: <ThumbsUp size={16} />,
  ThumbsDown: <ThumbsDown size={16} />,
  Send: <Send size={16} />,
  Archive: <Archive size={16} />
};

export const DEFAULT_CATEGORIES = [
  'Company Wide',
  'Bukit Bintang',
  'Bangsar',
  'Yishun',
  'Pavilion Damansara Heights'
];

export const DEFAULT_ROLES = [
  'Marketing Lead',
  'Content Strategist',
  'Product Manager',
  'Community Manager',
  'Contributor',
  'Designer',
  'Analyst'
];

export const DEFAULT_CHANNELS = [
  'Cross-channel',
  'Social Ads',
  'Organic Social',
  'Email',
  'Influencer',
  'Event',
  'In-Store',
  'PR'
];

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Mike K.',
    email: 'mike.k@bhumi.com',
    role: 'Marketing Lead',
    status: 'Active',
    avatarUrl: '',
    password: 'welcome123'
  },
  {
    id: 'u2',
    name: 'Sarah M.',
    email: 'sarah.m@bhumi.com',
    role: 'Content Strategist',
    status: 'Active',
    avatarUrl: '',
    password: 'welcome123'
  },
  {
    id: 'u3',
    name: 'Jessica L.',
    email: 'jess.l@bhumi.com',
    role: 'Product Manager',
    status: 'Active',
    avatarUrl: '',
    password: 'welcome123'
  },
  {
    id: 'u4',
    name: 'Tom R.',
    email: 'tom.r@bhumi.com',
    role: 'Community Manager',
    status: 'Inactive',
    avatarUrl: '',
    password: 'welcome123'
  }
];

export const MOCK_IDEAS: Idea[] = [
  {
    id: '1',
    title: 'Earth Day Yoga Challenge',
    description: 'A 7-day social media challenge encouraging users to practice yoga outdoors. Use hashtag #BhumiEarthFlow.',
    status: IdeaStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    tags: ['Social Media', 'Community', 'Q2'],
    category: 'Company Wide',
    author: 'Sarah M.',
    createdAt: new Date('2023-10-15'),
    comments: [{ id: 'c1', author: 'Mike', text: 'Love this! Needs influencer list.', timestamp: new Date() }],
    campaignId: '101'
  },
  {
    id: '2',
    title: 'Recycled Leggings Launch',
    description: 'Email campaign focused on the new technical fabric made from ocean plastic.',
    status: IdeaStatus.VALIDATED,
    priority: Priority.CRITICAL,
    tags: ['Product Launch', 'Email'],
    category: 'Company Wide',
    author: 'Jessica L.',
    createdAt: new Date('2023-10-20'),
    comments: [],
    campaignId: '101'
  },
  {
    id: '3',
    title: 'Influencer Retreat 2024',
    description: 'Plan a retreat in Bali for top tier brand ambassadors.',
    status: IdeaStatus.NEW,
    priority: Priority.MEDIUM,
    tags: ['Event', 'Influencer'],
    category: 'Bangsar',
    author: 'Tom R.',
    createdAt: new Date('2023-11-01'),
    comments: []
  },
  {
    id: '4',
    title: 'Sustainable Packaging Video',
    description: 'Behind the scenes reel showing how our biodegradable packaging dissolves.',
    status: IdeaStatus.IN_PROGRESS,
    priority: Priority.LOW,
    tags: ['Content', 'Education'],
    category: 'Company Wide',
    author: 'Sarah M.',
    createdAt: new Date('2023-11-05'),
    comments: []
  }
];

export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: '101',
    name: 'Winter Solstice Sale',
    description: 'End of year clearance event focusing on cold weather gear and holiday gifting.',
    startDate: '2023-12-15',
    endDate: '2023-12-25',
    status: 'Active',
    channel: 'Cross-channel',
    linkedCampaignIds: ['103'],
    assets: [],
    notes: [
      {
        id: 'n1',
        text: 'Remember to align with the email team on the countdown timer graphics.',
        createdAt: new Date('2023-12-01'),
        author: 'Mike K.'
      },
      {
        id: 'n2',
        text: 'Consider adding a "Last Chance" SMS blast on Dec 24th.',
        createdAt: new Date('2023-12-10'),
        author: 'Sarah M.'
      }
    ],
    contentDrafts: [
      {
        id: 'd1',
        platform: 'Instagram',
        caption: 'Embrace the chill. ❄️ Our Winter Solstice collection is here to keep you warm and grounded. \n\nShop the sale link in bio. \n\n#BhumiWinter #SustainableStyle',
        mediaUrl: '',
        status: 'In Review',
        author: 'Sarah M.',
        lastUpdated: new Date('2023-12-12'),
        feedback: []
      }
    ]
  },
  {
    id: '102',
    name: 'New Year New You',
    description: 'January fitness reboot campaign targeting resolution setters.',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    status: 'Planning',
    channel: 'Social Ads',
    linkedCampaignIds: [],
    assets: [],
    notes: [],
    contentDrafts: []
  },
  {
    id: '103',
    name: 'Fall Collection',
    description: 'Launch of the autumn earth-tone collection.',
    startDate: '2023-09-01',
    endDate: '2023-10-31',
    status: 'Completed',
    channel: 'Influencer',
    linkedCampaignIds: ['101'],
    assets: [],
    notes: [
      {
        id: 'n3',
        text: 'The beige set outperformed the sage green set by 20%.',
        createdAt: new Date('2023-11-05'),
        author: 'Mike K.'
      }
    ],
    contentDrafts: []
  }
];