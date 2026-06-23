import { Component } from '@angular/core';
import { AssistantService, ChatMessage } from '../services/assistant.service';

@Component({
  selector: 'app-chat-widget',
  templateUrl: './chat-widget.component.html',
  styleUrls: ['./chat-widget.component.css']
})
export class ChatWidgetComponent {
  open = false;
  input = '';
  loading = false;
  messages: ChatMessage[] = [];

  private readonly greeting: ChatMessage = {
    role: 'assistant',
    text: "Hi! I'm TechBot 🤖 — tell me your budget and what you need, and I'll help you pick the best product."
  };

  constructor(private assistant: AssistantService) {}

  toggle(): void {
    this.open = !this.open;
    if (this.open && this.messages.length === 0) {
      this.messages.push(this.greeting);
    }
  }

  send(): void {
    const text = this.input.trim();
    if (!text || this.loading) {
      return;
    }

    this.messages.push({ role: 'user', text });
    this.input = '';
    this.loading = true;

    // Send prior turns (excluding the greeting) as context.
    const history = this.messages
      .filter((m) => m !== this.greeting)
      .slice(0, -1);

    this.assistant.ask(text, history).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.ok && res.reply) {
          this.messages.push({ role: 'assistant', text: res.reply });
        } else {
          this.messages.push({
            role: 'assistant',
            text: res.message || 'Sorry, I could not answer right now.'
          });
        }
        this.scrollToBottom();
      },
      error: (err) => {
        this.loading = false;
        const msg =
          err?.status === 429
            ? 'You are sending messages too fast — please wait a moment.'
            : err?.error?.message || 'The assistant is unavailable right now. Please try again.';
        this.messages.push({ role: 'assistant', text: msg });
        this.scrollToBottom();
      }
    });

    this.scrollToBottom();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = document.querySelector('.chat-messages');
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 50);
  }
}
