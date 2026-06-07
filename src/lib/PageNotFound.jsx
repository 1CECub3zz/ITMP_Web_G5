import { Link } from 'react-router-dom';

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-brew-cream flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl mb-4">404</p>
        <h1 className="font-playfair text-3xl font-bold text-brew-green mb-2">Page not found</h1>
        <p className="text-muted-foreground mb-6">The page you are looking for does not exist.</p>
        <Link to="/" className="inline-flex items-center rounded-xl bg-brew-green px-5 py-2.5 text-sm font-medium text-white">
          Back home
        </Link>
      </div>
    </div>
  );
}
