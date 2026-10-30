import { Component } from 'react';
import Button from './Button';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isConfigError =
        this.state.error?.message?.includes('App is not configured');

      return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#070707] px-4 text-white font-sans">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.18] bg-white/[0.06] backdrop-blur-md p-6 text-center modal-shadow">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-[#6C667C] bg-[#211737] text-white mb-4">
              <i
                className={`text-2xl ${
                  isConfigError ? 'ri-settings-5-line' : 'ri-error-warning-line text-primary'
                }`}
              />
            </div>

            <h1 className="text-xl font-bold tracking-tight text-white">
              {isConfigError ? 'App is not configured' : 'Something went wrong'}
            </h1>

            <p className="mt-2 text-xs text-[rgba(255,255,255,0.55)] leading-relaxed">
              {isConfigError
                ? 'The production application is missing the VITE_API_BASE_URL environment variable. Please configure it in your hosting deployment settings.'
                : this.state.error?.message || 'An unexpected client error occurred while rendering the workspace.'}
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <Button variant="primary" size="sm" onClick={this.handleReload}>
                Reload Application
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
