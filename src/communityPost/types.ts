export interface NotificationItem {
  id: number;
  postId: number;
  type: 'like' | 'comment';
  userId: number;
  userName: string;
  profileImage?: string;
  content?: string;
  createdAt: Date;
} 