import { Component } from 'react'
import { AlertCircle } from 'lucide-react'
import Button from './ui/Button'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
          <div className="flex justify-center mb-3">
            <AlertCircle size={32} className="text-red-600" />
          </div>
          <h3 className="font-semibold text-red-900 mb-2">Section Editor Error</h3>
          <p className="text-sm text-red-700 mb-4">{this.state.error?.message || 'Something went wrong while editing this section.'}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
          >
            Reload Page
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
