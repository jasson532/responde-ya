import { Component, type ErrorInfo, type ReactNode } from 'react';
import logger from 'modules/shared/services/logger/logger';
import Button from 'modules/shared/components/atoms/Button/Button';
import './ErrorBoundary.scss';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Ultima linea de defensa: si un render falla, el usuario ve una salida clara
 * en vez de una pantalla en blanco. En una app de emergencias eso no es opcional.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('Error no capturado en el arbol de React', {
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  private handleReload = (): void => {
    window.location.assign('/');
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="error-boundary" role="alert" data-testid="ErrorBoundary">
        <h1 className="error-boundary__title">Algo se rompio de nuestro lado</h1>
        <p className="error-boundary__text">
          Si estas atendiendo una emergencia, llama de inmediato a la linea de emergencias de
          tu pais.
        </p>
        <Button variant="primary" size="lg" onClick={this.handleReload}>
          Volver al inicio
        </Button>
      </div>
    );
  }
}

export default ErrorBoundary;
