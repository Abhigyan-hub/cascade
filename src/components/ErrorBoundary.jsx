import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.error(error)
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>
          <p className="text-gray-400 text-sm mb-6">
            This page hit an unexpected problem. Your data is safe — refresh to continue.
          </p>
          <button
            type="button"
            className="inline-block px-6 py-3 rounded-xl font-semibold bg-[#a855f7] text-white"
            onClick={() => {
              this.setState({ failed: false })
              window.location.assign('/')
            }}
          >
            Back to events
          </button>
        </div>
      </div>
    )
  }
}
