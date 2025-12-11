import { Injectable, OnModuleInit } from '@nestjs/common';
import { WizardSession, SessionMetadata } from '../types/session.types';

@Injectable()
export class SessionService implements OnModuleInit {
  private readonly sessions = new Map<number, WizardSession>();
  private readonly sessionMetadata = new Map<number, SessionMetadata>();
  private readonly TTL = 30 * 60 * 1000; // 30 minutes
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  onModuleInit(): void {
    // Start cleanup job
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000); // Run every 5 minutes
  }

  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  createSession(
    chatId: number,
    serviceType: string,
    metadata?: SessionMetadata,
  ): void {
    const now = Date.now();
    this.sessions.set(chatId, {
      currentStep: 0,
      data: {},
      serviceType,
      createdAt: now,
      lastActivity: now,
    });

    if (metadata) {
      this.sessionMetadata.set(chatId, metadata);
    }
  }

  getSession(chatId: number): WizardSession | undefined {
    const session = this.sessions.get(chatId);
    if (session && this.isSessionValid(session)) {
      session.lastActivity = Date.now();
      return session;
    }
    if (session) {
      this.deleteSession(chatId);
    }
    return undefined;
  }

  updateSessionData(chatId: number, data: Partial<WizardSession['data']>): void {
    const session = this.sessions.get(chatId);
    if (session) {
      session.data = { ...session.data, ...data };
      session.lastActivity = Date.now();
    }
  }

  incrementStep(chatId: number): void {
    const session = this.sessions.get(chatId);
    if (session) {
      session.currentStep++;
      session.lastActivity = Date.now();
    }
  }

  getCurrentStep(chatId: number): number {
    const session = this.sessions.get(chatId);
    return session?.currentStep ?? -1;
  }

  deleteSession(chatId: number): void {
    this.sessions.delete(chatId);
    this.sessionMetadata.delete(chatId);
  }

  hasActiveSession(chatId: number): boolean {
    const session = this.sessions.get(chatId);
    return session !== undefined && this.isSessionValid(session);
  }

  getMetadata(chatId: number): SessionMetadata | undefined {
    return this.sessionMetadata.get(chatId);
  }

  private isSessionValid(session: WizardSession): boolean {
    const now = Date.now();
    return now - session.lastActivity < this.TTL;
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredChatIds: number[] = [];

    for (const [chatId, session] of this.sessions.entries()) {
      if (now - session.lastActivity >= this.TTL) {
        expiredChatIds.push(chatId);
      }
    }

    for (const chatId of expiredChatIds) {
      this.deleteSession(chatId);
    }

    if (expiredChatIds.length > 0) {
      console.log(`Cleaned up ${expiredChatIds.length} expired sessions`);
    }
  }
}

