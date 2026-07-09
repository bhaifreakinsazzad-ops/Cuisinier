import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Phone } from 'lucide-react';
import { BUSINESS_INFO } from '@/config/business';
import { buildWhatsAppLink } from '@/lib/utils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  section?: string;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.section ?? 'app'}]`, error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    const waLink = buildWhatsAppLink(
      BUSINESS_INFO.whatsappNumber,
      'Hi, I ran into an error on Cuisinier. Please help!',
    );

    return (
      <div className="flex min-h-[40dvh] items-center justify-center bg-[#080808] px-5 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="mb-3 text-4xl">⚠️</div>
          <h2 className="mb-2 text-lg font-bold text-white">Something went wrong</h2>
          <p className="mb-6 text-sm text-white/55">
            We hit an unexpected error. Please reload the page or reach us on WhatsApp.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-orange-500 px-6 py-3 font-bold text-black transition-colors hover:bg-orange-600"
            >
              Reload Page
            </button>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm text-white/80 transition-colors hover:bg-white/10"
            >
              <Phone size={16} />
              WhatsApp Support
            </a>
          </div>
        </div>
      </div>
    );
  }
}
