export interface ServiceData {
  name: string;
  host: string;
  ip: string;
  group: string;
  sub_group: string;
  icon: string;
  protocol: string;
  port: number;
}

export interface WebhookPayload {
  chat_id: number;
  user_id: number;
  username?: string;
  service_type: string;
  service: ServiceData;
}

