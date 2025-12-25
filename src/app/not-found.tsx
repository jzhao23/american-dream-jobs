export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center px-4">
        <div className="text-6xl mb-4">404</div>
        <h1 className="text-2xl font-bold text-secondary-900 mb-2">
          Page Not Found
        </h1>
        <p className="text-secondary-600 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/" className="btn-primary">
            Go Home
          </a>
          <a href="/#careers" className="btn-secondary">
            Explore Careers
          </a>
        </div>
      </div>
    </div>
  );
}
