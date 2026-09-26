import type { EntityId, IsoDateTime } from "./common.js";
import type {
  EmailFolder,
  IntegrationProviderType,
  MessageSource,
} from "./enums.js";

export interface Message {
  id: EntityId;
  userId: EntityId;
  source: MessageSource;
  externalId: string | null;
  sender: string;
  body: string;
  read: boolean;
  receivedAt: IsoDateTime;
}

export interface EmailMessage {
  id: EntityId;
  userId: EntityId;
  externalId: string;
  provider: IntegrationProviderType;
  folder: EmailFolder;
  from: string;
  to: string[];
  subject: string;
  bodyPreview: string | null;
  read: boolean;
  receivedAt: IsoDateTime;
}

export interface MessageFilterParams {
  source?: MessageSource[];
  read?: boolean;
}

export interface EmailFilterParams {
  folder?: EmailFolder;
  read?: boolean;
}
