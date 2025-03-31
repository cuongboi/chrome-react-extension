import React from 'react';

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren,
  { hasError: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    // Update state so the next render will show the fallback UI.
    console.log('err', error);
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    this.setState({ hasError: true });
    console.error('Help', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <h1>Something went wrong here.</h1>;
    }

    return this.props.children;
  }
}
