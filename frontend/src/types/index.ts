export type userType = {
  _id: string;
  email: string;
  username: string;
  unreadChatCount?: number;
};

export type messageType = {
  sendId: string | undefined;
  receivedId: string | undefined;
  content: string;
  status?: "sent" | "delivered" | "read";
  createdAt?: string;
};
