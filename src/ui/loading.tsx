import { cn } from '../lib/utils';
import { Spinner } from './spinner';

type LoadingProps = {
  height?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
};

const sizeMap = {
  sm: 'size-8',
  md: 'size-12',
  lg: 'size-16',
};

export const Loading = ({ height = '100vh', className, size = 'md', label }: LoadingProps) => {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)} style={{ height }}>
      <Spinner className={cn('text-primary', sizeMap[size])} />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
};
