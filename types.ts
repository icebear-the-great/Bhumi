
export enum IdeaStatus {
  NEW = 'New',
  VALIDATED = 'Validated',
  IN_PROGRESS = 'In Progress',
  LIVE = 'Live',
  CANCELLED = 'Cancelled',
}

export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: Date;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  status: IdeaStatus;
  priority: Priority;
  tags: string[];
  category: string; // Added for Company Wide vs Specific Studio
  author: string;
  createdAt: Date;
  comments: Comment[];
  campaignId?: string; // Link to a campaign
}

export interface CampaignAsset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'file';
  url: string;
}

export interface CampaignNote {
  id: string;
  text: string;
  createdAt: Date;
  author: string;
}

export interface ContentDraft {
  id: string;
  platform: 'Instagram' | 'TikTok' | 'Email' | 'LinkedIn' | 'XHS' | 'Threads' | 'Website Content';
  caption: string;
  mediaUrl?: string; // For the image/video preview
  status: 'Draft' | 'In Review' | 'Changes Requested' | 'Approved' | 'Scheduled';
  author: string;
  lastUpdated: Date;
  feedback: Comment[];
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'Planning' | 'Active' | 'Completed' | 'Archived';
  channel: string;
  linkedCampaignIds?: string[];
  assets: CampaignAsset[]; // Promotional photos/videos
  notes: CampaignNote[]; // Raw ideas and updates
  contentDrafts: ContentDraft[]; // Social media drafts
}

export interface SearchSource {
  title: string;
  uri: string;
}

export interface MarketResearchResult {
  content: string;
  sources: SearchSource[];
  timestamp: Date;
  query: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  avatarUrl?: string;
  password?: string;
}

export interface AppConfig {
  categories: string[];
  roles: string[];
  channels: string[];
}