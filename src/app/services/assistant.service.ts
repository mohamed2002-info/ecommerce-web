import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface AssistantResponse {
  ok: boolean;
  reply?: string;
  message?: string;
}

/**
 * Talks to the backend shopping assistant (which proxies Google Gemini).
 * The API key never reaches the browser — only this endpoint is called.
 */
@Injectable({ providedIn: 'root' })
export class AssistantService {
  private apiUrl = `${environment.apiUrl}/assistant`;

  constructor(private http: HttpClient) {}

  ask(message: string, history: ChatMessage[]): Observable<AssistantResponse> {
    return this.http.post<AssistantResponse>(this.apiUrl, { message, history });
  }
}
