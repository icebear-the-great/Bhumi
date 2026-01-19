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
  'Admin',
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
    id: 'u0',
    name: 'Admin User',
    email: 'admin@bhumi.com',
    role: 'Admin',
    status: 'Active',
    avatarUrl: '',
    password: 'admin123'
  },
  {
    id: 'u1',
    name: 'Jason K.',
    email: 'jason.k@bhumi.com',
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
  }
];

export const MOCK_IDEAS: Idea[] = [
  {
    id: '2',
    title: 'CNY Deco in the Mall',
    description: 'Mall decorations for Chinese New Year.',
    status: IdeaStatus.IN_PROGRESS,
    priority: Priority.MEDIUM,
    tags: ['Event', 'Seasonal', 'CNY'],
    category: 'Bukit Bintang',
    author: 'Sarah M.',
    createdAt: new Date(),
    comments: [],
    type: 'Task'
  },
  {
    id: '4',
    title: 'Create XHS Account',
    description: 'Process to create the official Xiao Hong Shu account.',
    status: IdeaStatus.NEW,
    priority: Priority.HIGH,
    tags: ['Social Media', 'XHS'],
    category: 'Company Wide',
    author: 'Tom R.',
    createdAt: new Date(),
    comments: [],
    campaignId: '201',
    type: 'Task'
  }
];

export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: '201',
    name: 'New XHS Accounts',
    description: 'Establish presence on Xiao Hong Shu (new XHS accounts).',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Active',
    channel: 'Organic Social',
    linkedCampaignIds: [],
    assets: [],
    notes: [],
    contentDrafts: []
  }
];