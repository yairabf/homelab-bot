// DNS Service Data Structure
export interface DnsServiceData {
  name: string;
  host: string;
  ip: string;
  protocol: string;
  policy: string;
  port: number;
}

// Dashboard Service Data Structure
export interface DashboardServiceData {
  name: string;
  host: string;
  group: string;
  sub_group: string;
  icon: string;
}

// Union type for all service data
export type ServiceData = DnsServiceData | DashboardServiceData;

export interface WebhookPayload {
  chat_id: number;
  user_id: number;
  username?: string;
  service_type: string;
  service: Partial<ServiceData>;
}

