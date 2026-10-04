import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '../components/ui';

export default function NotFound() {
  return (
    <div className="container-x py-16">
      <EmptyState icon={<Compass className="h-5 w-5" />} title="Page not found" sub="The page you are looking for does not exist." action={<Link to="/" className="btn-primary">Go to home</Link>} />
    </div>
  );
}
